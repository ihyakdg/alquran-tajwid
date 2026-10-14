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
