// Background field: a drifting dot grid that lifts away from the pointer.
// Colors come from the page's theme tokens, so it follows light and dark.
(function () {
  var canvas = document.getElementById("field");
  if (!canvas || !canvas.getContext) return;
  var ctx = canvas.getContext("2d");
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)");

  var R = 180;            // pointer influence radius, px
  var pts = [];
  var cols = 0, rows = 0, w = 0, h = 0, spacing = 48;
  var ink = "#111110", muted = "#77756E";
  var pointer = { x: -9999, y: -9999, active: false };
  var raf = 0, running = false;

  function readColors() {
    var s = getComputedStyle(document.documentElement);
    ink = s.getPropertyValue("--ink").trim() || ink;
    muted = s.getPropertyValue("--muted").trim() || muted;
  }

  function build() {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = window.innerWidth;
    h = window.innerHeight;
    spacing = w < 520 ? 36 : 48;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    cols = Math.ceil(w / spacing) + 2;
    rows = Math.ceil(h / spacing) + 2;
    pts = [];
    for (var j = 0; j < rows; j++) {
      for (var i = 0; i < cols; i++) {
        pts.push({
          bx: i * spacing - spacing / 2,
          by: j * spacing - spacing / 2,
          ph: Math.random() * Math.PI * 2,
          x: 0,
          y: 0
        });
      }
    }
  }

  function place(time) {
    var on = pointer.active;
    for (var k = 0; k < pts.length; k++) {
      var p = pts[k];
      var x = p.bx + Math.sin(time * 0.45 + p.ph) * 2.4;
      var y = p.by + Math.cos(time * 0.35 + p.ph * 1.3) * 2.4;
      if (on) {
        var dx = x - pointer.x, dy = y - pointer.y;
        var d = Math.sqrt(dx * dx + dy * dy);
        if (d < R && d > 0.001) {
          var f = Math.pow(1 - d / R, 2) * 18;
          x += (dx / d) * f;
          y += (dy / d) * f;
        }
      }
      p.x = x;
      p.y = y;
    }
  }

  function proximity(x, y) {
    if (!pointer.active) return 0;
    var dx = x - pointer.x, dy = y - pointer.y;
    var d = Math.sqrt(dx * dx + dy * dy);
    return d >= R ? 0 : 1 - d / R;
  }

  function draw(time) {
    readColors();
    place(time);
    ctx.clearRect(0, 0, w, h);

    // Lines to right and down neighbours: a quiet graph-paper structure.
    ctx.strokeStyle = muted;
    ctx.lineWidth = 1;
    for (var j = 0; j < rows; j++) {
      for (var i = 0; i < cols; i++) {
        var a = pts[j * cols + i];
        if (i + 1 < cols) segment(a, pts[j * cols + i + 1]);
        if (j + 1 < rows) segment(a, pts[(j + 1) * cols + i]);
      }
    }

    // Dots, growing and darkening near the pointer.
    ctx.fillStyle = ink;
    for (var k = 0; k < pts.length; k++) {
      var p = pts[k];
      var q = proximity(p.x, p.y);
      ctx.globalAlpha = 0.28 + q * 0.7;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 0.9 + q * 1.6, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function segment(a, b) {
    var q = proximity((a.x + b.x) / 2, (a.y + b.y) / 2);
    ctx.globalAlpha = 0.14 + q * 0.45;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  }

  function loop(t) {
    draw(t * 0.001);
    raf = requestAnimationFrame(loop);
  }

  function start() {
    if (running || reduce.matches) return;
    running = true;
    raf = requestAnimationFrame(loop);
  }

  function stop() {
    running = false;
    cancelAnimationFrame(raf);
  }

  function refresh() {
    build();
    if (reduce.matches) {
      stop();
      draw(0);
    } else {
      start();
    }
  }

  var resizeTimer = 0;
  window.addEventListener("resize", function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(refresh, 120);
  });

  window.addEventListener("pointermove", function (e) {
    pointer.x = e.clientX;
    pointer.y = e.clientY;
    pointer.active = true;
  }, { passive: true });

  window.addEventListener("pointerdown", function (e) {
    pointer.x = e.clientX;
    pointer.y = e.clientY;
    pointer.active = true;
  }, { passive: true });

  window.addEventListener("pointerup", function (e) {
    if (e.pointerType !== "mouse") pointer.active = false;
  }, { passive: true });

  document.addEventListener("mouseleave", function () {
    pointer.active = false;
  });

  if (reduce.addEventListener) reduce.addEventListener("change", refresh);
  else if (reduce.addListener) reduce.addListener(refresh);

  build();
  if (reduce.matches) draw(0);
  else start();
})();
