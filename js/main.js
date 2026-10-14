// Halaman utama: daftar 114 surah + terakhir dibaca
(function () {
  const listEl = document.getElementById("surah-list");
  const searchEl = document.getElementById("search");
  const filterEl = document.getElementById("filter-turun");
  let allSurah = [];

  function esc(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
    }[c]));
  }

  function card(s) {
    return `
      <a class="card surah-card" href="surah.html?nomor=${s.nomor}">
        <span class="surah-num">${s.nomor}</span>
        <span>
          <h3>${esc(s.namaLatin)}</h3>
          <p>${esc(s.arti)} • ${s.jumlahAyat} ayat • ${s.tempatTurun === "mekah" ? "Makkiyah" : "Madaniyah"}</p>
        </span>
        <span class="surah-ar arabic">${esc(s.nama)}</span>
      </a>`;
  }

  function render() {
    const q = searchEl.value.trim().toLowerCase();
    const f = filterEl.value;
    const rows = allSurah.filter((s) => {
      const okQ = !q ||
        s.namaLatin.toLowerCase().includes(q) ||
        s.arti.toLowerCase().includes(q) ||
        String(s.nomor) === q;
      const okF = !f || s.tempatTurun === f;
      return okQ && okF;
    });
    listEl.innerHTML = rows.length
      ? rows.map(card).join("")
      : `<div class="empty">😔 Surah tidak ditemukan. Coba kata kunci lain.</div>`;
  }

  function renderLastRead() {
    const box = document.getElementById("last-read");
    try {
      const lr = JSON.parse(localStorage.getItem("qt-lastread") || "null");
      if (!lr) return;
      box.innerHTML = `
        <div class="lastread">
          <span style="font-size:1.6rem">🔖</span>
          <span><strong>Terakhir dibaca:</strong> QS. ${esc(lr.namaLatin)} ayat ${lr.ayat}</span>
          <a class="btn small" style="margin-inline-start:auto" href="surah.html?nomor=${lr.surah}#ayat-${lr.ayat}">Lanjutkan →</a>
        </div>`;
    } catch (_) { /* abaikan */ }
  }

  async function load() {
    try {
      const res = await fetch("https://equran.id/api/v2/surat");
      if (!res.ok) throw new Error("HTTP " + res.status);
      const json = await res.json();
      allSurah = json.data;
      render();
    } catch (e) {
      listEl.innerHTML = `<div class="error">❌ Gagal memuat daftar surah. Periksa koneksi internet lalu muat ulang halaman.<br><small>${esc(e.message)}</small></div>`;
    }
  }

  searchEl.addEventListener("input", render);
  filterEl.addEventListener("change", render);
  renderLastRead();
  load();
})();
