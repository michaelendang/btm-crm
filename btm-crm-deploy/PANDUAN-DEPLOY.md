# 📋 PANDUAN DEPLOY BTM CRM
### Dari file ini sampai bisa dipakai tim di HP — step by step

---

## GAMBARAN BESAR

```
Google Sheet (database) ←→ Apps Script (jembatan) ←→ CRM di Vercel (tampilan)
```

Total waktu: **±45 menit** (pertama kali)
Biaya: **GRATIS**

---

## BAGIAN 1 — SETUP GOOGLE SHEET & APPS SCRIPT
*(±15 menit)*

### Step 1: Buat Google Sheet
1. Buka **sheets.google.com**
2. Klik **"+ Blank"** untuk buat spreadsheet baru
3. Beri nama: **"BTM CRM Database"**
4. Biarkan terbuka

### Step 2: Buka Apps Script
1. Di Google Sheet yang baru dibuat, klik menu **"Extensions"** (bar atas)
2. Klik **"Apps Script"**
3. Tab baru akan terbuka — ini adalah editor kode

### Step 3: Paste kode Apps Script
1. Di editor Apps Script, **hapus semua kode** yang ada (biasanya ada `function myFunction() {}`)
2. Buka file **`GOOGLE-APPS-SCRIPT.js`** dari folder ini
3. **Copy semua isinya** (Ctrl+A lalu Ctrl+C)
4. **Paste** ke editor Apps Script (Ctrl+V)
5. Klik ikon **Save** (💾) atau tekan Ctrl+S

### Step 4: Deploy Apps Script sebagai Web App
1. Klik tombol **"Deploy"** (pojok kanan atas)
2. Pilih **"New Deployment"**
3. Klik ikon ⚙️ di sebelah "Select type" → pilih **"Web app"**
4. Isi form:
   - **Description**: BTM CRM Backend
   - **Execute as**: Me *(biarkan default)*
   - **Who has access**: **Anyone** ← *PENTING, harus "Anyone"*
5. Klik **"Deploy"**
6. Klik **"Authorize access"** jika muncul → login dengan akun Google kamu
7. **Copy URL** yang muncul (bentuknya: `https://script.google.com/macros/s/XXXXX/exec`)
8. **Simpan URL ini** — akan dipakai di langkah selanjutnya

> ⚠️ **CATATAN PENTING**: Setiap kali kamu update kode Apps Script, kamu harus deploy ulang (New Deployment) dan URL-nya akan berubah. Kalau tidak ada perubahan kode, URL tetap sama.

---

## BAGIAN 2 — SETUP GITHUB
*(±10 menit)*

### Step 5: Buat akun GitHub
1. Buka **github.com**
2. Klik **"Sign up"** → buat akun gratis
3. Verifikasi email

### Step 6: Buat repository baru
1. Setelah login, klik tombol **"+"** di pojok kanan atas
2. Pilih **"New repository"**
3. Isi:
   - **Repository name**: `btm-crm`
   - Pilih **Public**
4. Klik **"Create repository"**

### Step 7: Upload file CRM ke GitHub

**Cara termudah (tanpa coding):**

1. Di halaman repository yang baru dibuat, klik **"uploading an existing file"**
2. **Drag & drop** seluruh isi folder `btm-crm-deploy` ke area upload
   - Pastikan struktur foldernya benar:
     ```
     btm-crm/
     ├── index.html
     ├── package.json
     ├── vite.config.js
     ├── public/
     │   └── manifest.json
     └── src/
         ├── main.jsx
         └── App.jsx
     ```
3. Scroll ke bawah, klik **"Commit changes"**
4. Tunggu sampai selesai upload

---

## BAGIAN 3 — DEPLOY KE VERCEL
*(±10 menit)*

### Step 8: Buat akun Vercel
1. Buka **vercel.com**
2. Klik **"Sign Up"**
3. Pilih **"Continue with GitHub"** → login dengan akun GitHub yang barusan dibuat
4. Authorize Vercel untuk akses GitHub

### Step 9: Import project
1. Di dashboard Vercel, klik **"Add New..."** → **"Project"**
2. Cari repository **"btm-crm"** → klik **"Import"**
3. Di halaman konfigurasi:
   - **Framework Preset**: Vite *(biasanya terdeteksi otomatis)*
   - **Root Directory**: biarkan default
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Klik **"Deploy"**
5. Tunggu 2-3 menit sampai selesai

### Step 10: Ambil URL CRM
1. Setelah deploy selesai, Vercel akan tampilkan URL seperti:
   `https://btm-crm-xxxxx.vercel.app`
2. **Klik URL itu** → CRM akan terbuka di browser
3. CRM akan minta Apps Script URL (dari Step 4)
4. Paste URL Apps Script → klik **"Test Koneksi"** → klik **"Simpan & Mulai"**

---

## BAGIAN 4 — CUSTOM DOMAIN (OPSIONAL)
*(±15 menit, jika sudah punya domain)*

Kalau Michael punya domain seperti `btmenergi.com` dan mau CRM-nya ada di `crm.btmenergi.com`:

1. Di Vercel dashboard, masuk ke project **btm-crm**
2. Klik tab **"Settings"** → **"Domains"**
3. Ketik `crm.btmenergi.com` → klik **"Add"**
4. Vercel akan kasih instruksi untuk tambah DNS record di tempat domain dibeli (Niagahoster, Namecheap, dll)
5. Ikuti instruksinya, tunggu 10-30 menit → domain aktif

---

## BAGIAN 5 — SHARE KE TIM
*(±5 menit)*

### Yang perlu dikirim ke tim:
1. **URL CRM** (dari Vercel atau domain custom)
2. **URL Apps Script** (dari Step 4)
3. Instruksi di bawah ini:

---

### 📱 INSTRUKSI UNTUK TIM SALES

**Cara buka CRM di HP:**
1. Buka browser di HP (Chrome atau Safari)
2. Ketik URL: `[URL CRM dari Michael]`
3. Pertama kali buka, akan minta Apps Script URL
4. Paste URL: `[Apps Script URL dari Michael]`
5. Klik "Test Koneksi" → "Simpan & Mulai"

**Cara simpan ke home screen HP (seperti app):**

*Android:*
1. Buka CRM di Chrome
2. Klik ikon ⋮ (tiga titik) di pojok kanan atas
3. Pilih "Add to Home screen"
4. Klik "Add"

*iPhone:*
1. Buka CRM di Safari
2. Klik ikon Share (kotak dengan panah ke atas)
3. Pilih "Add to Home Screen"
4. Klik "Add"

**Cara update deal:**
- Buka CRM → klik kartu deal → edit di panel kanan
- Atau: Tab "Tugas" → tombol "Update" di setiap baris

---

## BAGIAN 6 — UPDATE CRM (untuk versi baru)

Kalau Michael mau update CRM ke versi yang lebih baru:

1. **Export data dulu** — klik tombol Download (⬇️) di header CRM → simpan file JSON
2. Ganti file `src/App.jsx` di GitHub dengan versi baru
3. Vercel otomatis deploy ulang dalam 2-3 menit
4. Kalau data hilang, klik Upload (⬆️) → pilih file JSON yang tadi di-export

> Data yang tersimpan di Google Sheet **tidak akan hilang** saat update CRM.

---

## TROUBLESHOOTING

| Masalah | Solusi |
|---------|--------|
| "Koneksi gagal" saat test | Pastikan Apps Script di-deploy dengan "Who has access: Anyone" |
| Data tidak tersimpan | Cek indikator WiFi di header CRM — merah = offline |
| Tim tidak bisa akses | Pastikan semua orang pakai URL yang sama |
| CRM lambat loading pertama kali | Normal — Vercel free tier "cold start" butuh 5-10 detik |
| Lupa URL Apps Script | Buka Apps Script → Deploy → Manage Deployments → copy URL |

---

## KONTAK BANTUAN

Kalau stuck di langkah mana pun, screenshot error-nya dan tanyakan ke Claude.
Sebutkan di step mana kamu stuck dan apa pesan error-nya.
