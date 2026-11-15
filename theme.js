// Theme: "system" (follow the OS), "light" or "dark".
// Runs synchronously in <head> so the right theme paints on the first frame.
(function () {
  var KEY = "theme";
  var root = document.documentElement;
  var query = window.matchMedia("(prefers-color-scheme: dark)");

  function stored() {
    try {
      var v = localStorage.getItem(KEY);
      return v === "light" || v === "dark" ? v : "system";
    } catch (e) {
      return "system";
    }
  }

  function save(mode) {
    try {
      if (mode === "system") localStorage.removeItem(KEY);
      else localStorage.setItem(KEY, mode);
    } catch (e) { /* storage blocked: the choice still applies for this visit */ }
  }

  function syncMeta() {
    var dark = root.getAttribute("data-theme") === "dark" ||
      (root.getAttribute("data-theme") !== "light" && query.matches);
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", dark ? "#111110" : "#F4F3EF");
  }

  function apply(mode) {
    if (mode === "light" || mode === "dark") root.setAttribute("data-theme", mode);
    else root.removeAttribute("data-theme");
    root.setAttribute("data-theme-choice", mode);
    syncMeta();
    var buttons = document.querySelectorAll("[data-theme-set]");
    for (var i = 0; i < buttons.length; i++) {
      buttons[i].setAttribute("aria-pressed", String(buttons[i].getAttribute("data-theme-set") === mode));
    }
  }

  apply(stored());

  // While on "system", follow OS changes live.
  var onChange = function () { if (stored() === "system") syncMeta(); };
  if (query.addEventListener) query.addEventListener("change", onChange);
  else if (query.addListener) query.addListener(onChange);

  document.addEventListener("DOMContentLoaded", function () {
    var buttons = document.querySelectorAll("[data-theme-set]");
    for (var i = 0; i < buttons.length; i++) {
      buttons[i].addEventListener("click", function (e) {
        var mode = e.currentTarget.getAttribute("data-theme-set");
        save(mode);
        apply(mode);
      });
    }
    apply(stored());
  });
})();
