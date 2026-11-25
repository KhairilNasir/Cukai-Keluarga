# Cukai Keluarga

App web ringkas untuk jejak cukai pendapatan peribadi Malaysia (Borang BE) sepanjang tahun: gaji dan PCB, pelepasan cukai dengan resit, dan anggaran refund LHDN. Data setiap keluarga disimpan dalam Google Sheet mereka sendiri, dan gambar resit dalam folder Google Drive.

Link: `https://khairilnasir.github.io/cukai-keluarga/`

> Ini anggaran untuk merancang, bukan nasihat cukai. Fail tetap dibuat sendiri di MyTax.

---

## Untuk keluarga

1. Buka link app dan pergi ke tab **Settings**.
2. Isi nama isi rumah, **Family code** (minta daripada admin) dan emel Gmail, kemudian tekan **Create & connect**. Google Sheet dan folder resit akan dicipta dan dikongsi ke Gmail anda.
3. Masih di **Settings**, tukar nama dan isi bilangan anak di bawah ibu atau bapa yang akan claim.
4. Tab **Income & PCB**: salin gaji kasar bulanan, PCB, KWSP dan PERKESO daripada slip gaji.
5. Tab **Reliefs & receipts**: setiap kali beli barang yang boleh claim, tambah resit bersama gambar.
6. Untuk pasangan: tekan **Copy link for spouse** di Settings dan hantar link tu. Pasangan buka link tu dan terus nampak data yang sama.
7. Bulan Mac, buka tab **MyTax figures** dan salin setiap angka ke e-Filing.

## Untuk admin (sekali sahaja)

### 1. Pasang Apps Script

1. Buka https://script.google.com, tekan **New project**, namakan "Cukai Keluarga".
2. Padam kod asal dan tampal semua isi `Code.gs`.
3. Tukar `const KOD = 'tukar-kod-ini';` kepada kod rahsia keluarga.
4. Tekan **Save**, pilih fungsi **authorize**, tekan **Run** dan benarkan akses (Advanced → Go to Cukai Keluarga → Allow).
5. **Deploy → New deployment → Web app**. Execute as: **Me**, Who has access: **Anyone**. Tekan **Deploy** dan salin **Web app URL** (berakhir dengan `/exec`).

### 2. Masukkan URL dalam app

1. Dalam repo GitHub, buka `index.html` dan tekan ikon pensel.
2. Cari `const API_URL = "";` dan tampal URL di antara tanda petik.
3. **Commit changes**. Aktifkan GitHub Pages (Settings → Pages → Branch: main, folder `/root`) jika belum.

### Nota admin

- Semua sheet dan folder resit dicipta dalam Google Drive admin, jadi admin secara teknikal boleh buka semuanya. Data cukai lebih sensitif daripada bajet, jadi beritahu keluarga dahulu.
- Senarai semua keluarga: jalankan `senaraiKeluarga` dan semak Execution log.
- Lepas ubah `Code.gs`: **Deploy → Manage deployments → Edit → Version: New version → Deploy**. URL kekal sama.
- Link pasangan mengandungi kod rahsia sheet. Sesiapa yang ada link itu boleh baca dan ubah data, jadi kongsi dengan pasangan sahaja.

## Kemas kini kadar setiap tahun

Kadar cukai dan had pelepasan ada dalam objek `RULES` di bahagian atas skrip `index.html`. Selepas Bajet diluluskan, tambah tahun baharu (contoh `2027: {...}`) dan tukar `ya` dalam data. Angka YA 2026 sekarang diambil daripada senarai pelepasan LHDN dan PwC Malaysian Tax Booklet 2026/2027.

## Apa yang belum ada

- Imbasan resit automatik (isi manual + gambar sahaja)
- Pendapatan sewa, perniagaan (Borang B), dividen
- Taksiran bersama suami isteri
- Kalkulator PCB bulanan
