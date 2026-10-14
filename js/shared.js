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
  document.addEventListener("DOMContentLoaded", () => {
    syncIcon();
    document.querySelectorAll("[data-year]").forEach((el) => {
      el.textContent = new Date().getFullYear();
    });
  });
})();
