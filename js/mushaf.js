// Mode Mushaf: tampilan per halaman (1-604) ala mushaf cetak Madinah.
// Teks Utsmani + warna tajwid, ornamen kepala surah, baris sesuai mushaf asli.
(function () {
  const params = new URLSearchParams(location.search);
  let hal = parseInt(params.get("hal") || "", 10);
  if (!Number.isInteger(hal) || hal < 1 || hal > 604) {
    try {
      hal = parseInt(localStorage.getItem("qt-mushaf-page") || "1", 10) || 1;
    } catch (_) { hal = 1; }
  }
  hal = Math.min(604, Math.max(1, hal));

  const content = document.getElementById("content");
  const navBox = document.getElementById("page-nav");

  // Halaman awal tiap juz pada mushaf Madinah (604 halaman)
  const JUZ_START = { 1: 1, 2: 22, 3: 42, 4: 62, 5: 82, 6: 102, 7: 122, 8: 142, 9: 162, 10: 182, 11: 202, 12: 222, 13: 242, 14: 262, 15: 282, 16: 302, 17: 322, 18: 342, 19: 362, 20: 382, 21: 402, 22: 422, 23: 442, 24: 462, 25: 482, 26: 502, 27: 522, 28: 542, 29: 562, 30: 582 };
  const JUZ_END = {};
  Object.keys(JUZ_START).forEach((j) => {
    const jz = +j;
    JUZ_END[jz] = jz === 30 ? 604 : JUZ_START[jz + 1] - 1;
  });

  const TAJWID = {
    ham_wasl: "Hamzah Washal — tidak dibaca saat menyambung",
    slnt: "Tanda bulat — huruf tidak dibaca",
    laam_shamsiyah: "Lam Syamsiyah — lam tidak dibaca",
    qalaqah: "Qalqalah — dibaca memantul",
    ghunnah: "Ghunnah — nun/mim bertasydid, dengung ±2 harakat",
    idgham_ghunnah: "Idgham Bighunnah — dilebur + dengung",
    idgham_wo_ghunnah: "Idgham Bilaghunnah — dilebur tanpa dengung",
    idgham_shafawi: "Idgham Syafawi — mim dilebur ke mim + dengung",
    ikhafa: "Ikhfa — dibaca samar + dengung",
    ikhafa_shafawi: "Ikhfa Syafawi — mim sukun samar menghadapi ba",
    iqlab: "Iqlab — nun/tanwin menjadi bunyi mim",
    madda_normal: "Mad Thabi'i — panjang 2 harakat",
    madda_permissible: "Mad Jaiz — boleh 2, 4, atau 5 harakat",
    madda_necessary: "Mad Lazim — panjang 6 harakat",
    madda_obligatory_mottasel: "Mad Wajib Muttashil — panjang 4–5 harakat",
    madda_obligatory_monfasel: "Mad Jaiz Munfashil — boleh 2, 4, atau 5 harakat",
    "custom-alef-maksora": "Alif Maksura (bagian dari Mad)",
    idgham_mutajanisayn: "Idgham Mutajanisain — dilebur (sejenis makhraj)",
    idgham_mutaqaribayn: "Idgham Mutaqaribain — dilebur (berdekatan makhraj)",
  };

  let showTajwid = true;
  let surahNames = {}; // nomor -> nama Arab

  function esc(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
    }[c]));
  }
  function toAr(n) {
    return String(n).replace(/[0-9]/g, (d) => "٠١٢٣٤٥٦٧٨٩"[+d]);
  }
  function stripTags(html) {
    return html.replace(/<\/?rule[^>]*>/g, "");
  }
  function juzOf(page) {
    for (let j = 30; j >= 1; j--) if (page >= JUZ_START[j]) return j;
    return 1;
  }

  async function fetchPageVerses(page) {
    const verses = [];
    let apiPage = 1;
    for (;;) {
      const url = "https://api.quran.com/api/v4/verses/by_page/" + page +
        "?words=true&word_fields=text_uthmani_tajweed&page=" + apiPage + "&per_page=100";
      const res = await fetch(url);
      if (!res.ok) throw new Error("HTTP " + res.status);
      const json = await res.json();
      verses.push(...(json.verses || []));
      const pg = json.pagination || {};
      if (!pg.next_page) break;
      apiPage = pg.next_page;
    }
    return verses;
  }

  function wordHtml(w, verseNumber) {
    if (w.char_type_name === "end") {
      return `<span class="ayah-num" title="Ayat ${verseNumber}">۝${toAr(verseNumber)}</span>`;
    }
    const t = w.text_uthmani_tajweed || w.text || "";
    return showTajwid ? t : esc(stripTags(t));
  }

  function buildLines(verses) {
    // Kelompokkan kata per nomor baris (sesuai mushaf cetak), sisipkan ornamen & basmalah
    const lines = {}; // lineNumber -> { type: 'text'|'header'|'bismillah', html }
    const appendText = (ln, html) => {
      if (!lines[ln]) lines[ln] = { type: "text", parts: [] };
      lines[ln].parts.push(html);
    };
    verses.forEach((v) => {
      const [ch, vs] = v.verse_key.split(":").map(Number);
      const firstLine = v.words.length ? v.words[0].line_number : null;
      if (vs === 1 && firstLine) {
        const needBismillah = ch !== 1 && ch !== 9;
        const headerLine = firstLine - (needBismillah ? 2 : 1);
        if (headerLine >= 1) {
          lines[headerLine] = {
            type: "header",
            html: `<div class="surah-ornament"><span>سورة ${esc(surahNames[ch] || "")}</span></div>`,
          };
        }
        if (needBismillah && firstLine - 1 >= 1 && !lines[firstLine - 1]) {
          lines[firstLine - 1] = {
            type: "bismillah",
            html: `<div class="bismillah-line arabic">بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ</div>`,
          };
        }
      }
      v.words.forEach((w) => appendText(w.line_number, wordHtml(w, v.verse_number)));
      if (v.sajdah_number) {
        const lastW = v.words[v.words.length - 1];
        if (lastW) appendText(lastW.line_number, `<span class="sajdah" title="Sujud Tilawah">۩</span>`);
      }
    });
    return Object.keys(lines).map(Number).sort((a, b) => a - b)
      .map((ln) => ({ ln, ...lines[ln] }));
  }

  function renderControls(juz) {
    const juzOpts = Object.keys(JUZ_START).map((j) =>
      `<option value="${JUZ_START[j]}"${+j === juz ? " selected" : ""}>Juz ${j}</option>`).join("");
    return `
      <div class="controls">
        <label>📄 Hal <input id="goto" type="number" min="1" max="604" value="${hal}" style="width:76px;border:1px solid var(--line);background:var(--bg-card);color:var(--ink);border-radius:10px;padding:8px 10px;font-family:inherit" /> <span style="color:var(--muted)">/ 604</span></label>
        <button class="mini-btn" id="btn-goto">Ke halaman</button>
        <label>📚 <select id="juz">${juzOpts}</select></label>
        <label class="switch"><input type="checkbox" id="tgl-tajwid" checked /> 🎨 Tajwid</label>
        <label>🔠 <input type="range" id="font-size" min="20" max="44" value="30" /></label>
        <button class="mini-btn" id="btn-mark">🔖 Tandai halaman ini</button>
        <a class="btn small ghost" href="tajwid.html">🎨 Legenda</a>
      </div>`;
  }

  function attachTooltips() {
    content.querySelectorAll("rule[class]").forEach((r) => {
      const key = (r.getAttribute("class") || "").split(" ")[0];
      if (TAJWID[key]) r.title = TAJWID[key];
    });
  }

  async function load() {
    try {
      const [names, verses] = await Promise.all([
        Object.keys(surahNames).length ? surahNames
          : fetch("https://equran.id/api/v2/surat").then((r) => {
            if (!r.ok) throw new Error("Gagal memuat nama surah");
            return r.json();
          }).then((j) => {
            j.data.forEach((s) => { surahNames[s.nomor] = s.nama; });
            return surahNames;
          }),
        fetchPageVerses(hal),
      ]);
      surahNames = names;
      if (!verses.length) throw new Error("Halaman kosong");

      document.title = "Mushaf hal. " + hal + " — Al-Qur'an Bertajwid";

      const first = verses[0], last = verses[verses.length - 1];
      const juzA = first.juz_number, juzB = last.juz_number;
      const juzLabel = juzA === juzB ? "Juz " + juzA : "Juz " + juzA + "–" + juzB;
      const surahRange = first.verse_key.split(":")[0] === last.verse_key.split(":")[0]
        ? "QS. " + (surahNames[+first.verse_key.split(":")[0]] || "")
        : "QS. " + (surahNames[+first.verse_key.split(":")[0]] || "") + " – " + (surahNames[+last.verse_key.split(":")[0]] || "");

      const lineBlocks = buildLines(verses);
      const linesHtml = lineBlocks.map((b) => {
        if (b.type !== "text") return b.html;
        return `<div class="mushaf-line arabic">${b.parts.join(" ")}</div>`;
      }).join("");

      content.innerHTML = `
        <div class="mushaf-top">
          <a href="index.html" style="color:var(--brand);font-weight:700;text-decoration:none">← Beranda</a>
          <h1>Halaman ${hal} <span class="chip">📚 ${juzLabel}</span></h1>
          <p class="section-sub">${esc(surahRange)} • ${esc(first.verse_key)} – ${esc(last.verse_key)}</p>
        </div>
        ${renderControls(juzOf(hal))}
        <div class="mushaf-page" id="mushaf-page">${linesHtml}</div>`;

      attachTooltips();

      document.getElementById("tgl-tajwid").addEventListener("change", (e) => {
        showTajwid = e.target.checked;
        refreshText(verses);
      });
      document.getElementById("font-size").addEventListener("input", (e) => {
        document.getElementById("mushaf-page").style.setProperty("--mushaf-size", e.target.value + "px");
      });
      document.getElementById("btn-goto").addEventListener("click", () => {
        const v = Math.min(604, Math.max(1, +document.getElementById("goto").value || 1));
        location.href = "mushaf.html?hal=" + v;
      });
      document.getElementById("juz").addEventListener("change", (e) => {
        location.href = "mushaf.html?hal=" + e.target.value;
      });
      document.getElementById("btn-mark").addEventListener("click", () => {
        localStorage.setItem("qt-mushaf-page", String(hal));
        alert("🔖 Halaman " + hal + " ditandai. Buka menu Mushaf untuk melanjutkannya.");
      });

      navBox.style.display = "flex";
      navBox.innerHTML =
        (hal > 1 ? `<a class="btn ghost" href="mushaf.html?hal=${hal - 1}">← Hal. ${hal - 1}</a>` : `<span></span>`) +
        (hal < 604 ? `<a class="btn ghost" style="text-align:right" href="mushaf.html?hal=${hal + 1}">Hal. ${hal + 1} →</a>` : `<span></span>`);
    } catch (e) {
      content.innerHTML = `<div class="error">❌ Gagal memuat halaman mushaf. Periksa koneksi lalu muat ulang.<br><small>${esc(e.message)}</small></div>`;
    }
  }

  function refreshText(verses) {
    const lineBlocks = buildLines(verses);
    const page = document.getElementById("mushaf-page");
    page.querySelectorAll(".mushaf-line").forEach((el, i) => {
      const texts = lineBlocks.filter((b) => b.type === "text");
      if (texts[i]) el.innerHTML = texts[i].parts.join(" ");
    });
    attachTooltips();
  }

  load();
})();
