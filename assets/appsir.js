/* AppSir Games ~ homepage scripts */
(function () {
  var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fine = window.matchMedia && window.matchMedia("(pointer: fine)").matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* WordArt wobble */
  $$(".wordart").forEach(function (w) {
    w.addEventListener("click", function () {
      w.classList.remove("wobble"); void w.offsetWidth; w.classList.add("wobble");
    });
  });

  /* personal visit counter (stored only in this browser) */
  var odo = $("#odometer");
  if (odo) {
    var n = 1;
    try { n = (parseInt(localStorage.getItem("appsir-visits"), 10) || 0) + 1; localStorage.setItem("appsir-visits", n); } catch (e) {}
    var s = ("000000" + n).slice(-6);
    odo.innerHTML = s.split("").map(function (d) { return "<span>" + d + "</span>"; }).join("");
    var lbl = $("#visits-label");
    if (lbl) lbl.textContent = n === 1 ? "Welcome, first-timer!" : "Welcome back! Visit #" + n + ".";
  }

  /* now playing widget */
  var np = $("#now-playing");
  if (np) {
    var list = JSON.parse(np.getAttribute("data-games"));
    var ni = 0, nimg = $("img", np), ncap = $(".cap", np), nlink = $("a", np);
    var step = function () {
      ni = (ni + 1) % list.length;
      nimg.src = list[ni].img; nimg.alt = list[ni].title + " cover art";
      ncap.textContent = list[ni].title; nlink.href = list[ni].href;
    };
    if (!reduced) setInterval(step, 3000);
  }

  /* webring: random hop between the member sites */
  var rnd = $("#ring-rand");
  if (rnd) rnd.addEventListener("click", function () {
    var sites = ["https://www.appsirgames.com/", "https://appsirgames.neocities.org/"];
    rnd.href = sites[Math.floor(Math.random() * sites.length)];
  });

  /* guestbook: composes an email */
  var gb = $("#guestbook-form");
  if (gb) gb.addEventListener("submit", function (e) {
    e.preventDefault();
    var name = gb.elements.name.value.trim() || "A mysterious visitor";
    var msg = gb.elements.message.value.trim();
    var fav = gb.elements.fav.value;
    var body = msg + (fav ? "\n\nFavorite AppSir game: " + fav : "") + "\n\n~ " + name;
    location.href = "mailto:hello@appsirgames.com?subject=" + encodeURIComponent("Guestbook entry from " + name) + "&body=" + encodeURIComponent(body);
  });


  /* contact form: composes an email */
  var cf = $("#contact-form");
  if (cf) cf.addEventListener("submit", function (e) {
    e.preventDefault();
    var f = cf.elements;
    var name = f.name.value.trim() || "A visitor";
    var lines = [f.message.value.trim()];
    if (f.game.value) lines.push("", "Game: " + f.game.value);
    if (f.email.value.trim()) lines.push("Reply to: " + f.email.value.trim());
    lines.push("", "~ " + name);
    location.href = "mailto:hello@appsirgames.com?subject=" + encodeURIComponent(f.topic.value + " from " + name) + "&body=" + encodeURIComponent(lines.join("\n"));
  });

  /* dialog box */
  var dlg;
  function dialog(title, msg) {
    if (!dlg) {
      dlg = document.createElement("div");
      dlg.className = "dialog win"; dlg.setAttribute("role", "alertdialog"); dlg.setAttribute("aria-modal", "true");
      dlg.innerHTML = '<div class="win-title"><span></span><div class="win-ctrl"><i aria-hidden="true">x</i></div></div><div class="win-body"><div class="icon" aria-hidden="true">&#9888;&#65039;</div><div class="msg"></div></div><div class="actions"><button class="btn95" type="button">OK</button></div>';
      document.body.appendChild(dlg);
      $("button", dlg).addEventListener("click", function () { dlg.classList.remove("show"); });
    }
    $(".win-title span", dlg).textContent = title;
    $(".msg", dlg).textContent = msg;
    dlg.classList.add("show");
    $("button", dlg).focus();
  }

  /* lightbox */
  var shots = $$(".shots button");
  if (shots.length) {
    var lb = document.createElement("div");
    lb.className = "lightbox"; lb.setAttribute("role", "dialog"); lb.setAttribute("aria-modal", "true"); lb.setAttribute("aria-label", "Screenshot viewer");
    lb.innerHTML = '<img alt=""><button class="btn95 lb-close" aria-label="Close">X</button><button class="btn95 lb-prev" aria-label="Previous">&lt;</button><button class="btn95 lb-next" aria-label="Next">&gt;</button>';
    document.body.appendChild(lb);
    var li = 0, lbImg = $("img", lb), last;
    var open = function (k) { li = (k + shots.length) % shots.length; var im = $("img", shots[li]); lbImg.src = im.src; lbImg.alt = im.alt; lb.classList.add("open"); document.body.style.overflow = "hidden"; };
    var close = function () { lb.classList.remove("open"); document.body.style.overflow = ""; if (last) last.focus(); };
    shots.forEach(function (b, k) { b.addEventListener("click", function () { last = b; open(k); $(".lb-close", lb).focus(); }); });
    $(".lb-close", lb).addEventListener("click", close);
    $(".lb-prev", lb).addEventListener("click", function () { open(li - 1); });
    $(".lb-next", lb).addEventListener("click", function () { open(li + 1); });
    lb.addEventListener("click", function (e) { if (e.target === lb) close(); });
    document.addEventListener("keydown", function (e) {
      if (!lb.classList.contains("open")) return;
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") open(li - 1);
      if (e.key === "ArrowRight") open(li + 1);
    });
    var sx = null;
    lb.addEventListener("touchstart", function (e) { sx = e.touches[0].clientX; }, { passive: true });
    lb.addEventListener("touchend", function (e) { if (sx === null) return; var dx = e.changedTouches[0].clientX - sx; if (Math.abs(dx) > 50) open(li + (dx < 0 ? 1 : -1)); sx = null; });
  }

  /* sparkle cursor trail (mouse only) */
  if (fine && !reduced) {
    var chars = ["✦", "★", "✧", "·"], cols = ["#ffff00", "#ff00cc", "#00ffff", "#ffffff"], lastT = 0;
    document.addEventListener("mousemove", function (e) {
      var t = Date.now(); if (t - lastT < 45) return; lastT = t;
      var sp = document.createElement("span");
      sp.className = "sparkle"; sp.setAttribute("aria-hidden", "true");
      sp.textContent = chars[Math.floor(Math.random() * chars.length)];
      sp.style.color = cols[Math.floor(Math.random() * cols.length)];
      sp.style.left = (e.clientX + 6) + "px"; sp.style.top = (e.clientY + 6) + "px";
      document.body.appendChild(sp);
      setTimeout(function () { sp.remove(); }, 800);
    });
  }

  /* year */
  $$(".yr").forEach(function (y) { y.textContent = new Date().getFullYear(); });

  /* secret: konami code, or tap the big title 7 times */
  var seq = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"], pos = 0;
  var exe = function () {
    var on = document.documentElement.classList.toggle("exe-mode");
    $$("[data-exe]").forEach(function (el) {
      if (!el.hasAttribute("data-normal")) el.setAttribute("data-normal", el.textContent);
      el.textContent = on ? el.getAttribute("data-exe") : el.getAttribute("data-normal");
    });
    dialog("AIDE.exe", on ? "Set her free." : "EXE MODE DISABLED. For now.");
  };
  document.addEventListener("keydown", function (e) {
    var k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    pos = k === seq[pos] ? pos + 1 : (k === seq[0] ? 1 : 0);
    if (pos === seq.length) { pos = 0; exe(); }
  });
  var wa = $(".wordart"), taps = 0, tt;
  if (wa) wa.addEventListener("click", function () {
    taps++; clearTimeout(tt); tt = setTimeout(function () { taps = 0; }, 1200);
    if (taps >= 7) { taps = 0; exe(); }
  });
})();
