/**
 * Cukai Keluarga — Google Apps Script backend
 * Deploy once as a Web app (Execute as: Me, Who has access: Anyone).
 * Each household gets its own Google Sheet + Drive folder for receipts, created in the admin's Drive
 * and shared to the household's Gmail.
 */

// Family code needed to create a new household sheet. Change this.
const KOD = 'tukar-kod-ini';

const DATA_TAB = '_data';
const META_TAB = '_meta';
const CHUNK = 45000; // a cell holds max 50,000 characters

function doGet() {
  return out_({ ok: true, app: 'Cukai Keluarga' });
}

function doPost(e) {
  try {
    const b = JSON.parse(e.postData.contents);
    switch (b.action) {
      case 'create': return out_(create_(b));
      case 'load':   return out_(load_(b));
      case 'save':   return out_(save_(b));
      case 'upload': return out_(upload_(b));
      default: throw new Error('Unknown action');
    }
  } catch (err) {
    return out_({ ok: false, error: String(err.message || err) });
  }
}

function create_(b) {
  if (String(b.kod || '').trim() !== KOD) throw new Error('Family code is wrong. Ask the admin for the right one.');
  const email = String(b.email || '').trim();
  if (!/^[^@\s]+@[^@\s]+$/.test(email)) throw new Error('Enter a valid Gmail address.');
  const name = 'Cukai Keluarga – ' + String(b.name || 'Household').slice(0, 60);

  const ss = SpreadsheetApp.create(name);
  const folder = DriveApp.createFolder(name + ' – receipts');
  const token = Utilities.getUuid();

  setupTabs_(ss);
  const meta = ss.getSheetByName(META_TAB);
  meta.getRange('A1:B3').setValues([['token', token], ['folder', folder.getId()], ['created', new Date()]]);
  meta.hideSheet();

  ss.addEditor(email);
  folder.addEditor(email);

  const log = PropertiesService.getScriptProperties();
  log.setProperty('hh_' + ss.getId(), JSON.stringify({ name: name, email: email, at: new Date().toISOString() }));

  return { ok: true, id: ss.getId(), token: token, name: name, url: ss.getUrl() };
}

function open_(b) {
  if (!b.id || !b.token) throw new Error('Missing sheet code');
  let ss;
  try { ss = SpreadsheetApp.openById(b.id); } catch (e) { throw new Error('Sheet not found'); }
  const meta = ss.getSheetByName(META_TAB);
  if (!meta || meta.getRange('B1').getValue() !== b.token) throw new Error('This link is not valid for that sheet');
  return ss;
}

function load_(b) {
  const ss = open_(b);
  const sh = ss.getSheetByName(DATA_TAB);
  const last = sh.getLastRow();
  let data = null;
  if (last > 0) {
    const txt = sh.getRange(1, 1, last, 1).getValues().map(r => r[0]).join('');
    if (txt) data = JSON.parse(txt);
  }
  return { ok: true, data: data, name: ss.getName(), url: ss.getUrl() };
}

function save_(b) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const ss = open_(b);
    const txt = JSON.stringify(b.data || {});
    const parts = [];
    for (let i = 0; i < txt.length; i += CHUNK) parts.push([txt.slice(i, i + CHUNK)]);
    const sh = ss.getSheetByName(DATA_TAB);
    sh.clearContents();
    if (parts.length) sh.getRange(1, 1, parts.length, 1).setValues(parts);

    // Readable tabs for people who open the sheet
    const rows = b.rows || {};
    writeTable_(ss.getSheetByName('Receipts'),
      ['YA', 'Date', 'Person', 'Relief', 'Type', 'Item', 'Amount (RM)', 'Receipt link'], rows.claims || []);
    writeTable_(ss.getSheetByName('Summary'),
      ['YA', 'Person', 'Employment income', 'Total relief', 'Chargeable income', 'Tax', 'Tax payable', 'PCB paid', 'Refund (+) / to pay (−)'], rows.summary || []);
    return { ok: true };
  } finally {
    lock.releaseLock();
  }
}

function upload_(b) {
  const ss = open_(b);
  const folderId = ss.getSheetByName(META_TAB).getRange('B2').getValue();
  const folder = DriveApp.getFolderById(folderId);
  const bytes = Utilities.base64Decode(b.b64);
  if (bytes.length > 8 * 1024 * 1024) throw new Error('File is over 8 MB');
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'application/pdf'];
  const mime = allowed.indexOf(b.mime) >= 0 ? b.mime : 'application/octet-stream';
  const file = folder.createFile(Utilities.newBlob(bytes, mime, String(b.name || 'receipt').slice(0, 120)));
  return { ok: true, url: file.getUrl() };
}

function setupTabs_(ss) {
  const first = ss.getSheets()[0];
  first.setName('Summary');
  ss.insertSheet('Receipts');
  ss.insertSheet(DATA_TAB).hideSheet();
  ss.insertSheet(META_TAB);
}

function writeTable_(sh, head, rows) {
  sh.clearContents();
  sh.getRange(1, 1, 1, head.length).setValues([head]).setFontWeight('bold');
  if (rows.length) sh.getRange(2, 1, rows.length, head.length).setValues(rows.map(r => head.map((_, i) => r[i] === undefined ? '' : r[i])));
  sh.setFrozenRows(1);
}

function out_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}

/** Run once from the editor to grant Sheets and Drive access. */
function authorize() {
  const tmp = SpreadsheetApp.create('Cukai Keluarga – test');
  DriveApp.getFileById(tmp.getId()).setTrashed(true);
  Logger.log('Access granted. Now Deploy → New deployment → Web app.');
}

/** Run from the editor to list every household sheet created. */
function senaraiKeluarga() {
  const p = PropertiesService.getScriptProperties().getProperties();
  Object.keys(p).filter(k => k.indexOf('hh_') === 0).forEach(k => {
    const v = JSON.parse(p[k]);
    Logger.log(v.name + ' | ' + v.email + ' | https://docs.google.com/spreadsheets/d/' + k.slice(3));
  });
}
