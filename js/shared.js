// Berbagi: tema gelap/terang + tahun footer
(function () {
  const root = document.documentElement;
  const saved = localStorage.getItem("qt-theme");
  if (saved) root.setAttribute("data-theme", saved);

  window.toggleTheme = function () {
    const next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
    root.setAttribute("data-theme", next);
    localStorage.setItem("qt-theme", next);
    syncIcon();
  };
  function syncIcon() {
    document.querySelectorAll("[data-theme-icon]").forEach((el) => {
      el.textContent = root.getAttribute("data-theme") === "dark" ? "☀️" : "🌙";
    });
  }
  // Mode Lansia 👴: huruf jumbo untuk TV/STB & orang tua.
  // Aktif via tombol, tersimpan di browser, atau paksa via ?lansia=1
  function applyLansia(on) {
    document.body.classList.toggle("lansia", on);
    try { localStorage.setItem("qt-lansia", on ? "1" : "0"); } catch (_) {}
  }
  window.toggleLansia = function () {
    applyLansia(!document.body.classList.contains("lansia"));
  };
  window.isLansia = function () {
    return document.body.classList.contains("lansia") ||
      new URLSearchParams(location.search).has("lansia");
  };
  // Label hukum ala stiker mushaf cetak ("Mad", "Ikhfa'", "Gunnah", ...)
  window.PRINT_TAG = {
    madda_normal: ["Mad", "#159947"], madda_permissible: ["Mad", "#159947"],
    madda_necessary: ["Mad", "#159947"], madda_obligatory: ["Mad", "#159947"],
    madda_obligatory_mottasel: ["Mad", "#159947"], madda_obligatory_monfasel: ["Mad", "#159947"],
    ikhafa: ["Ikhfa'", "#159947"], ikhfa: ["Ikhfa'", "#159947"],
    ikhafa_shafawi: ["Ikhfa'", "#159947"], ikhfa_shafawi: ["Ikhfa'", "#159947"],
    ghunnah: ["Gunnah", "#d81b60"], noon_ghunnah: ["Gunnah", "#d81b60"], meem_ghunnah: ["Gunnah", "#d81b60"],
    idgham_ghunnah: ["Idgam", "#d81b60"], idgham_w_ghunnah: ["Idgam", "#d81b60"],
    idgham_wo_ghunnah: ["Idgam", "#d81b60"], idgham_shafawi: ["Idgam", "#d81b60"],
    idgham_mutajanisayn: ["Idgam", "#d81b60"], idgham_mutaqaribayn: ["Idgam", "#d81b60"],
    iqlab: ["Iqlab", "#d81b60"],
    qalaqah: ["Qalqalah", "#1a237e"],
  };
  // Sisipkan <span class="taj-tag"> di atas tiap huruf berhukum (gabung yang berurutan)
  window.decoratePrintTags = function (scope) {
    scope.querySelectorAll("rule[class]").forEach((r) => {
      const key = (r.getAttribute("class") || "").split(" ")[0];
      const tag = window.PRINT_TAG[key];
      if (!tag) return;
      if (r.parentElement && r.parentElement.closest("rule.tagged")) return; // sudah di dalam label
      const prev = r.previousElementSibling;
      if (prev && prev.tagName === "RULE" && prev.dataset.tag === tag[0]) return; // gabung
      r.dataset.tag = tag[0];
      r.classList.add("tagged");
      const s = document.createElement("span");
      s.className = "taj-tag";
      s.style.background = tag[1];
      s.textContent = tag[0];
      r.prepend(s);
    });
  };
  document.addEventListener("DOMContentLoaded", () => {
    let on = false;
    try { on = localStorage.getItem("qt-lansia") === "1"; } catch (_) {}
    if (new URLSearchParams(location.search).has("lansia")) on = true;
    applyLansia(on);
  });
  document.addEventListener("DOMContentLoaded", () => {
    syncIcon();
    document.querySelectorAll("[data-year]").forEach((el) => {
      el.textContent = new Date().getFullYear();
    });
  });
})();
