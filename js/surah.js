// Halaman baca per surah: tajwid berwarna, latin, terjemah, audio, tafsir, penanda
(function () {
  const params = new URLSearchParams(location.search);
  let nomor = parseInt(params.get("nomor") || "1", 10);
  if (!Number.isInteger(nomor) || nomor < 1 || nomor > 114) nomor = 1;

  const content = document.getElementById("content");
  const navBox = document.getElementById("surah-nav");

  const QARI = {
    "01": "Abdullah Al-Juhany", "02": "Abdul Muhsin Al-Qasim",
    "03": "Abdurrahman as-Sudais", "04": "Ibrahim Al-Dossari",
    "05": "Misyari Rasyid Al-Afasy", "06": "Yasser Al-Dosari",
  };

  const TAJWID = {
    ham_wasl: "Hamzah Washal — dibaca menyambung, tidak dibaca saat mulai dari sini",
    slnt: "Tanda bulat — huruf tidak dibaca",
    silent: "Huruf yang tidak dibaca",
    laam_shamsiyah: "Lam Syamsiyah — lam tidak dibaca, huruf berikutnya bertasydid",
    qalaqah: "Qalqalah — dibaca memantul",
    ghunnah: "Ghunnah — nun/mim bertasydid dibaca dengung ±2 harakat",
    noon_ghunnah: "Ghunnah — nun bertasydid dibaca dengung ±2 harakat",
    meem_ghunnah: "Ghunnah — mim bertasydid dibaca dengung ±2 harakat",
    idgham_ghunnah: "Idgham Bighunnah — dilebur disertai dengung",
    idgham_w_ghunnah: "Idgham Bighunnah — dilebur disertai dengung",
    idgham_wo_ghunnah: "Idgham Bilaghunnah — dilebur tanpa dengung",
    idgham_shafawi: "Idgham Syafawi (Idgham Mimi) — mim dilebur ke mim dengan dengung",
    ikhafa: "Ikhfa — dibaca samar antara izhar dan idgham, disertai dengung",
    ikhfa: "Ikhfa — dibaca samar antara izhar dan idgham, disertai dengung",
    ikhafa_shafawi: "Ikhfa Syafawi — mim sukun dibaca samar menghadapi ba",
    ikhfa_shafawi: "Ikhfa Syafawi — mim sukun dibaca samar menghadapi ba",
    iqlab: "Iqlab — nun/tanwin berubah menjadi bunyi mim menghadapi ba",
    madda_normal: "Mad Thabi'i — dibaca panjang 2 harakat",
    madda_permissible: "Mad Jaiz — boleh dibaca 2, 4, atau 5 harakat",
    madda_necessary: "Mad Lazim — dibaca panjang 6 harakat",
    madda_obligatory: "Mad Wajib — dibaca panjang 4–5 harakat",
    madda_obligatory_mottasel: "Mad Wajib Muttashil — dibaca panjang 4–5 harakat",
    madda_obligatory_monfasel: "Mad Jaiz Munfashil — boleh dibaca 2, 4, atau 5 harakat",
    "custom-alef-maksora": "Alif Maksura (bagian dari Mad)",
    idgham_mutajanisayn: "Idgham Mutajanisain — dilebur karena sejenis makhraj",
    idgham_mutaqaribayn: "Idgham Mutaqaribain — dilebur karena berdekatan makhraj",
    saktah: "Saktah — berhenti sejenak tanpa bernapas",
  };

  const audio = new Audio();
  let ayatList = [];
  let tajwidByAyat = {};
  let tafsirCache = null;
  let autoNext = false;
  let currentAyat = null;

  function esc(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
    }[c]));
  }
  function toAr(n) {
    return String(n).replace(/[0-9]/g, (d) => "٠١٢٣٤٥٦٧٨٩"[+d]);
  }

  function attachTooltips(scope) {
    scope.querySelectorAll("rule[class]").forEach((r) => {
      const key = (r.getAttribute("class") || "").split(" ")[0];
      if (TAJWID[key]) r.title = TAJWID[key];
    });
  }

  let showTajwid = true;

  function buildArabic(nomorAyat) {
    if (tajwidByAyat[nomorAyat]) return tajwidByAyat[nomorAyat];
    const a = ayatList.find((x) => x.nomorAyat === nomorAyat);
    return esc(a ? a.teksArab : "");
  }

  function applyTajwidMode(mode) {
    try { localStorage.setItem("qt-tajwid-mode", mode); } catch (_) {}
    showTajwid = mode !== "mati";
    content.classList.toggle("tajwid-blok", mode === "blok");
    document.querySelectorAll("[data-arab]").forEach((p) => {
      const n = +p.dataset.arab;
      p.innerHTML = showTajwid ? buildArabic(n)
        : esc(ayatList.find((x) => x.nomorAyat === n).teksArab);
    });
    if (showTajwid) attachTooltips(content);
  }

  function renderAyat(a, showTajwid) {
    return `
      <section class="ayat" id="ayat-${a.nomorAyat}">
        <div class="ayat-top">
          <span class="ayat-badge">Ayat ${a.nomorAyat}</span>
          <span class="ayat-actions">
            <button class="mini-btn" data-act="play" data-ayat="${a.nomorAyat}" title="Dengarkan murottal">▶️ Putar</button>
            <button class="mini-btn" data-act="tafsir" data-ayat="${a.nomorAyat}" title="Lihat tafsir">📚 Tafsir</button>
            <button class="mini-btn" data-act="mark" data-ayat="${a.nomorAyat}" title="Tandai terakhir dibaca">🔖</button>
          </span>
        </div>
        <p class="arabic" data-arab="${a.nomorAyat}">${showTajwid ? buildArabic(a.nomorAyat) : esc(a.teksArab)}</p>
        <p class="latin">${esc(a.teksLatin)}</p>
        <p class="terjemah">${esc(a.teksIndonesia)}</p>
        <div class="tafsir-box" id="tafsir-${a.nomorAyat}"></div>
      </section>`;
  }

  function renderControls(surah) {
    const keys = ayatList.length && ayatList[0].audio ? Object.keys(ayatList[0].audio) : [];
    const opts = keys.map((k) =>
      `<option value="${k}"${k === "05" ? " selected" : ""}>${QARI[k] || ("Qari " + k)}</option>`
    ).join("");
    return `
      <div class="controls">
        <label>🎙️ Qari</label>
        <select id="qari">${opts}</select>
        <label>🎨 Gaya tajwid</label>
        <select id="sel-tajwid">
          <option value="huruf">Huruf berwarna</option>
          <option value="blok">Blok warna (cetakan)</option>
          <option value="mati">Tanpa warna</option>
        </select>
        <label class="switch"><input type="checkbox" id="tgl-auto" /> ⏭️ Otomatis ayat berikutnya</label>
        <label>🔠 Ukuran <input type="range" id="font-size" min="24" max="52" value="32" /></label>
        <button class="btn small" id="btn-full">▶️ Putar 1 Surah Penuh</button>
        <a class="btn small ghost" href="tajwid.html">🎨 Legenda warna</a>
      </div>`;
  }

  function audioUrl(a, key) {
    if (!a || !a.audio) return null;
    return a.audio[key] || a.audio[Object.keys(a.audio)[0]];
  }

  function setPlaying(nomorAyat) {
    document.querySelectorAll('[data-act="play"]').forEach((b) => {
      const on = +b.dataset.ayat === nomorAyat;
      b.classList.toggle("playing", on);
      b.textContent = on ? "⏸️ Putar" : "▶️ Putar";
    });
  }

  function playAyat(nomorAyat) {
    const key = document.getElementById("qari").value;
    if (currentAyat === nomorAyat && !audio.paused) { audio.pause(); return; }
    const a = ayatList.find((x) => x.nomorAyat === nomorAyat);
    const url = audioUrl(a, key);
    if (!url) return;
    currentAyat = nomorAyat;
    audio.src = url;
    audio.play().catch(() => {});
  }

  audio.addEventListener("play", () => setPlaying(currentAyat));
  audio.addEventListener("pause", () => { if (audio.ended || true) setPlaying(null); });
  audio.addEventListener("ended", () => {
    const done = currentAyat;
    setPlaying(null);
    if (autoNext && done < ayatList.length) {
      const next = document.getElementById("ayat-" + (done + 1));
      if (next) next.scrollIntoView({ behavior: "smooth", block: "center" });
      playAyat(done + 1);
    } else currentAyat = null;
  });

  async function toggleTafsir(nomorAyat, btn) {
    const box = document.getElementById("tafsir-" + nomorAyat);
    if (box.classList.contains("open")) { box.classList.remove("open"); return; }
    if (!box.dataset.loaded) {
      box.innerHTML = "⏳ Memuat tafsir…";
      box.classList.add("open");
      try {
        if (!tafsirCache) {
          const res = await fetch("https://equran.id/api/v2/tafsir/" + nomor);
          if (!res.ok) throw new Error("HTTP " + res.status);
          tafsirCache = (await res.json()).data.tafsir || [];
        }
        const t = tafsirCache.find((x) => x.ayat === nomorAyat);
        box.innerHTML = "<strong>Tafsir QS. " + nomor + ":" + nomorAyat + ":</strong><br>" +
          esc(t ? t.teks : "Tafsir tidak tersedia untuk ayat ini.");
        box.dataset.loaded = "1";
      } catch (e) {
        box.innerHTML = "❌ Gagal memuat tafsir. Coba lagi nanti.";
      }
    }
    box.classList.add("open");
  }

  function markLast(nomorAyat, namaLatin) {
    localStorage.setItem("qt-lastread", JSON.stringify({ surah: nomor, namaLatin, ayat: nomorAyat }));
    const el = document.getElementById("ayat-" + nomorAyat);
    el.classList.add("flash");
    setTimeout(() => el.classList.remove("flash"), 1600);
    alert("🔖 Ditandai: QS. " + namaLatin + " ayat " + nomorAyat + " sebagai terakhir dibaca.");
  }

  async function load() {
    try {
      const [d1, d2] = await Promise.all([
        fetch("https://equran.id/api/v2/surat/" + nomor).then((r) => {
          if (!r.ok) throw new Error("Surah tidak ditemukan");
          return r.json();
        }),
        fetch("https://equran.id/api/v2/surat/" + nomor).then((r) => r.json()).then((j) =>
          fetch("https://api.quran.com/api/v4/verses/by_chapter/" + nomor +
            "?words=true&word_fields=text_uthmani_tajweed&per_page=" + j.data.jumlahAyat
          ).then((r) => (r.ok ? r.json() : null)).catch(() => null)
        ),
      ]);
      const s = d1.data;
      ayatList = s.ayat;

      if (d2 && d2.verses) {
        d2.verses.forEach((v) => {
          const words = (v.words || [])
            .filter((w) => w.char_type_name !== "end")
            .map((w) => w.text_uthmani_tajweed || "")
            .join(" ");
          tajwidByAyat[v.verse_number] =
            words + `<span class="ayah-num" title="Ayat ${v.verse_number}">۝${toAr(v.verse_number)}</span>`;
        });
      }

      document.title = "QS. " + s.namaLatin + " — Al-Qur'an Bertajwid";

      const bismillah = (nomor !== 1 && nomor !== 9)
        ? `<div class="bismillah arabic">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</div>` : "";

      content.innerHTML = `
        <div class="surah-head">
          <a href="index.html" style="color:var(--brand);font-weight:700;text-decoration:none">← Semua Surah</a>
          <div class="arabic">${esc(s.nama)}</div>
          <h1>${esc(s.namaLatin)}</h1>
          <div class="meta-chips">
            <span class="chip">📖 ${s.jumlahAyat} ayat</span>
            <span class="chip">💡 ${esc(s.arti)}</span>
            <span class="chip">📍 ${s.tempatTurun === "mekah" ? "Makkiyah" : "Madaniyah"}</span>
          </div>
          <div class="desc">${s.deskripsi}</div>
        </div>
        ${renderControls(s)}
        ${bismillah}
        <div id="ayat-list">${ayatList.map((a) => renderAyat(a, true)).join("")}</div>`;

      attachTooltips(content);

      // Interaksi kontrol
      const savedMode0 = (() => { try { return localStorage.getItem("qt-tajwid-mode") || (window.isLansia && window.isLansia() ? "blok" : "huruf"); } catch (_) { return "huruf"; } })();
      document.getElementById("sel-tajwid").value = savedMode0;
      applyTajwidMode(savedMode0);
      document.getElementById("sel-tajwid").addEventListener("change", (e) => applyTajwidMode(e.target.value));
      document.getElementById("tgl-auto").addEventListener("change", (e) => { autoNext = e.target.checked; });
      document.getElementById("font-size").addEventListener("input", (e) => {
        document.documentElement.style.setProperty("--arab-size", e.target.value + "px");
      });
      document.getElementById("btn-full").addEventListener("click", () => {
        const key = document.getElementById("qari").value;
        const full = s.audioFull || {};
        const url = full[key] || full[Object.keys(full)[0]];
        if (!url) { alert("Audio full tidak tersedia."); return; }
        currentAyat = null; setPlaying(null);
        audio.src = url;
        audio.play().catch(() => {});
      });

      content.addEventListener("click", (e) => {
        const btn = e.target.closest("[data-act]");
        if (!btn) return;
        const n = +btn.dataset.ayat;
        if (btn.dataset.act === "play") playAyat(n);
        else if (btn.dataset.act === "tafsir") toggleTafsir(n, btn);
        else if (btn.dataset.act === "mark") markLast(n, s.namaLatin);
      });

      // Navigasi surah sebelum/sesudah
      const prev = s.suratSebelumnya && s.suratSebelumnya.nomor;
      const next = s.suratSelanjutnya && s.suratSelanjutnya.nomor;
      navBox.style.display = "flex";
      navBox.innerHTML =
        (prev ? `<a class="btn ghost" href="surah.html?nomor=${prev}">← QS. ${esc(s.suratSebelumnya.namaLatin)}</a>` : `<span></span>`) +
        (next ? `<a class="btn ghost" style="text-align:right" href="surah.html?nomor=${next}">QS. ${esc(s.suratSelanjutnya.namaLatin)} →</a>` : `<span></span>`);

      // Lompat ke ayat dari bookmark
      if (location.hash.startsWith("#ayat-")) {
        const target = document.querySelector(location.hash);
        if (target) {
          target.scrollIntoView({ block: "center" });
          target.classList.add("flash");
          setTimeout(() => target.classList.remove("flash"), 2000);
        }
      }
    } catch (e) {
      content.innerHTML = `<div class="error">❌ Gagal memuat surah. Periksa koneksi internet lalu muat ulang.<br><small>${esc(e.message)}</small></div>`;
    }
  }

  load();
})();
