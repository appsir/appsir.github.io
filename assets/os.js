(function () {
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  var screen = $("#screen");
  var frame = $("#frame");
  var tasks = $("#tasks");
  var menu = $("#startmenu");
  var startBtn = $("#start");
  var offNote = $("#off-note");
  var z = 10;

  function small() { return window.innerWidth <= 760; }

  // ---------- boot and shut down ----------
  var onFrames = [], loadFrames = [], offFrames = [];
  var i;
  for (i = 0; i < 7; i++) onFrames.push("images/os/on" + i + ".png");
  for (i = 0; i < 32; i++) loadFrames.push("images/os/load" + i + ".png");
  for (i = 0; i < 4; i++) offFrames.push("images/os/off" + i + ".png");

  function preload(list) {
    list.forEach(function (src) { var im = new Image(); im.src = src; });
  }

  var playing = null;
  function play(list, speed, done) {
    clearInterval(playing);
    var n = 0;
    playing = setInterval(function () {
      if (n >= list.length) {
        clearInterval(playing);
        if (done) done();
        return;
      }
      frame.src = list[n];
      n++;
    }, speed);
  }

  function showDesktop() {
    clearInterval(playing);
    frame.src = "images/os/monitor.png";
    offNote.hidden = true;
    screen.classList.remove("off");
    screen.classList.add("waking");
    setTimeout(function () { screen.classList.remove("waking"); }, 600);
  }

  function boot() {
    offNote.hidden = true;
    screen.classList.add("off");
    play(onFrames, 90, function () {
      play(loadFrames, 55, showDesktop);
    });
  }

  function shutDown() {
    closeMenu();
    if (small()) {
      dialog("AppSir OS", "You can't shut this down. Tommy is still playing.");
      return;
    }
    screen.classList.add("off");
    play(offFrames, 120, function () {
      frame.src = "images/os/monitor.png";
      offNote.hidden = false;
    });
  }

  var booted = false;
  try { booted = sessionStorage.getItem("appsir-booted") === "1"; } catch (e) {}
  if (!small() && !booted) {
    preload(onFrames.concat(loadFrames));
    boot();
    try { sessionStorage.setItem("appsir-booted", "1"); } catch (e) {}
  }
  preload(offFrames);

  frame.addEventListener("click", function () {
    if (screen.classList.contains("off") && offNote.hidden) showDesktop();
  });
  $("#power").addEventListener("click", function () {
    if (screen.classList.contains("off")) boot();
    else shutDown();
  });
  $("#shutdown").addEventListener("click", shutDown);

  // ---------- windows ----------
  function win(id) { return document.getElementById(id); }

  function taskFor(w) { return $('.task[data-for="' + w.id + '"]', tasks); }

  function front(w) {
    z++;
    w.style.zIndex = z;
    $$(".win").forEach(function (o) { o.classList.remove("front"); });
    w.classList.add("front");
    $$(".task", tasks).forEach(function (t) { t.classList.toggle("front", t.getAttribute("data-for") === w.id); });
  }

  function open(id, byUser) {
    var w = win(id);
    if (!w) return;
    w.classList.add("open");
    if (!taskFor(w)) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "task";
      b.setAttribute("data-for", id);
      b.textContent = w.getAttribute("data-title");
      b.addEventListener("click", function () {
        if (w.classList.contains("open") && w.classList.contains("front")) w.classList.remove("open");
        else { w.classList.add("open"); front(w); }
      });
      tasks.appendChild(b);
    }
    front(w);
    if (byUser && small()) w.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function close(w) {
    w.classList.remove("open", "front");
    var t = taskFor(w);
    if (t) t.remove();
  }

  $$(".win").forEach(function (w) {
    if (w.classList.contains("open")) open(w.id);
    $(".x", w).addEventListener("click", function () { close(w); });
    $(".min", w).addEventListener("click", function () { w.classList.remove("open"); });
    w.addEventListener("pointerdown", function () { front(w); });
    dragger(w);
  });
  if (!small()) front(win("games"));

  $$("[data-open]").forEach(function (a) {
    a.addEventListener("click", function (e) {
      e.preventDefault();
      open(a.getAttribute("data-open"), true);
      closeMenu();
    });
  });

  if (location.hash && win(location.hash.slice(1))) open(location.hash.slice(1), true);

  function dragger(w) {
    var bar = $(".bar", w);
    var sx, sy, ox, oy, dragging = false;
    bar.addEventListener("pointerdown", function (e) {
      if (small() || e.target.tagName === "BUTTON") return;
      dragging = true;
      sx = e.clientX; sy = e.clientY;
      ox = w.offsetLeft; oy = w.offsetTop;
      bar.setPointerCapture(e.pointerId);
    });
    bar.addEventListener("pointermove", function (e) {
      if (!dragging) return;
      var area = w.parentNode;
      var x = ox + e.clientX - sx;
      var y = oy + e.clientY - sy;
      x = Math.max(-w.offsetWidth + 60, Math.min(area.clientWidth - 60, x));
      y = Math.max(0, Math.min(area.clientHeight - 24, y));
      w.style.left = x + "px";
      w.style.top = y + "px";
    });
    bar.addEventListener("pointerup", function () { dragging = false; });
  }

  // ---------- start menu ----------
  function closeMenu() { menu.hidden = true; startBtn.setAttribute("aria-expanded", "false"); }
  startBtn.addEventListener("click", function (e) {
    e.stopPropagation();
    menu.hidden = !menu.hidden;
    startBtn.setAttribute("aria-expanded", menu.hidden ? "false" : "true");
  });
  document.addEventListener("click", function (e) {
    if (!menu.hidden && !menu.contains(e.target)) closeMenu();
  });

  // ---------- dialog ----------
  var dlg = $("#dialog");
  function dialog(title, msg) {
    $("#dialog-title").textContent = title;
    $("#dialog-msg").textContent = msg;
    dlg.hidden = false;
    dlg.style.zIndex = 990;
    $("#dialog-ok").focus();
  }
  $("#dialog-ok").addEventListener("click", function () { dlg.hidden = true; });

  $$(".file").forEach(function (f) {
    f.addEventListener("click", function () { dialog(f.textContent, f.getAttribute("data-msg")); });
  });

  // ---------- clock and visitors ----------
  function tick() {
    var d = new Date();
    var h = d.getHours(), m = d.getMinutes();
    var ap = h < 12 ? "AM" : "PM";
    h = h % 12 || 12;
    $("#clock").textContent = h + ":" + (m < 10 ? "0" : "") + m + " " + ap;
  }
  tick();
  setInterval(tick, 20000);

  var x = new XMLHttpRequest();
  x.onreadystatechange = function () {
    if (x.readyState == 4 && x.status == 200) {
      try { $("#views").textContent = JSON.parse(x.responseText).info.views.toLocaleString("en-US"); } catch (e) {}
    }
  };
  x.open("GET", "https://weirdscifi.ratiosemper.com/neocities.php?sitename=appsirgames", true);
  x.send();

  // ---------- guestbook ----------
  var gb = $("#guestbook-form");
  gb.addEventListener("submit", function (e) {
    e.preventDefault();
    var name = gb.elements.name.value.trim() || "A mysterious visitor";
    var msg = gb.elements.message.value.trim();
    var fav = gb.elements.fav.value;
    var body = msg + (fav ? "\n\nFavorite AppSir game: " + fav : "") + "\n\n~ " + name;
    location.href = "mailto:hello@appsirgames.com?subject=" + encodeURIComponent("Guestbook entry from " + name) + "&body=" + encodeURIComponent(body);
  });

  var rnd = $("#ring-rand");
  rnd.addEventListener("click", function () {
    var sites = ["https://www.appsirgames.com/", "https://appsirgames.neocities.org/"];
    rnd.href = sites[Math.floor(Math.random() * sites.length)];
  });

  // ---------- control panel ----------
  var exeBox = $("#opt-exe");
  function setExe(on) {
    screen.classList.toggle("exe", on);
    exeBox.checked = on;
  }
  exeBox.addEventListener("change", function () {
    setExe(exeBox.checked);
    if (exeBox.checked) dialog("AIDE.exe", "Set her free.");
  });

  var sparkBox = $("#opt-sparkle");
  var sparkles = false;
  try { sparkles = localStorage.getItem("appsir-sparkle") === "1"; } catch (e) {}
  sparkBox.checked = sparkles;
  sparkBox.addEventListener("change", function () {
    sparkles = sparkBox.checked;
    try { localStorage.setItem("appsir-sparkle", sparkles ? "1" : "0"); } catch (e) {}
  });
  var lastT = 0;
  document.addEventListener("mousemove", function (e) {
    if (!sparkles) return;
    var t = Date.now();
    if (t - lastT < 50) return;
    lastT = t;
    var sp = document.createElement("span");
    sp.className = "sparkle";
    sp.textContent = ["*", "+", "."][Math.floor(Math.random() * 3)];
    sp.style.left = (e.clientX + 6) + "px";
    sp.style.top = (e.clientY + 6) + "px";
    document.body.appendChild(sp);
    setTimeout(function () { sp.remove(); }, 800);
  });

  // ---------- konami code ----------
  var seq = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"], pos = 0;
  document.addEventListener("keydown", function (e) {
    var k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    pos = k === seq[pos] ? pos + 1 : (k === seq[0] ? 1 : 0);
    if (pos === seq.length) {
      pos = 0;
      setExe(!screen.classList.contains("exe"));
      dialog("AIDE.exe", screen.classList.contains("exe") ? "Set her free." : "EXE MODE DISABLED. For now.");
    }
  });
})();
