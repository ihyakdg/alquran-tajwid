# 🕌 Qur'an Tajwid

Website Al-Qur'an dengan **panduan warna tajwid**, lengkap dengan terjemahan Bahasa Indonesia,
transliterasi latin, audio murottal per ayat, dan tafsir. Dibuat dengan HTML + CSS + JavaScript murni
(tanpa build step) sehingga bisa langsung dibuka atau di-deploy ke GitHub Pages.

🔗 **Demo:** aktifkan GitHub Pages dari repo ini (Settings → Pages → Deploy from branch `main` → `/ (root)`).

## ✨ Fitur

- 📖 114 surah + pencarian & filter Makkiyah/Madaniyah
- 🎨 Teks Arab berwarna sesuai hukum tajwid (idgham, ikhfa, iqlab, qalqalah, mad, ghunnah, saktah, dll.)
  - arahkan kursor ke teks berwarna untuk melihat penjelasan hukumnya
  - bisa dimatikan lewat tombol "Warna tajwid"
- 🔤 Transliterasi latin + 🇮🇩 terjemahan Indonesia per ayat
- 🎙️ Audio murottal per ayat (6 pilihan qari), mode putar otomatis ayat berikutnya, & audio 1 surah penuh
- 📚 Tafsir per ayat (klik tombol "Tafsir")
- 🔖 Penanda "terakhir dibaca" (tersimpan di browser)
- 🔠 Ukuran huruf Arab bisa diatur • 🌙 Mode gelap/terang
- 📚 Halaman materi tajwid + legenda warna

## 🚀 Cara menjalankan lokal

Cukup buka `index.html` di browser, atau jalankan server lokal:

```bash
cd alquran-tajwid
python3 -m http.server 8080
# buka http://localhost:8080
```

> Butuh koneksi internet karena data ayat, audio, dan font diambil dari API & CDN.

## 🔌 Sumber data (API gratis)

| Kebutuhan | Sumber |
|---|---|
| Daftar surah, teks Arab, latin, terjemahan, audio, tafsir, deskripsi | [equran.id API v2](https://equran.id/apidot) |
| Teks Arab ber-penanda tajwid | [quran.com API v4](https://api.quran.com/api/v4) (`text_uthmani_tajweed`) |
| Font Arab & latin | Google Fonts (Amiri Quran, Plus Jakarta Sans) |

## 📁 Struktur

```
alquran-tajwid/
├── index.html      # Beranda + daftar surah
├── surah.html      # Halaman baca per surah (?nomor=1..114)
├── tajwid.html     # Materi tajwid + legenda warna
├── css/style.css   # Seluruh styling + warna tajwid
└── js/
    ├── shared.js   # Tema gelap/terang
    ├── main.js     # Daftar surah & pencarian
    └── surah.js    # Logika halaman baca
```

## 🤝 Kontribusi

Pull request & issue sangat dipersilakan. Barakallahu fiikum! 🤲
