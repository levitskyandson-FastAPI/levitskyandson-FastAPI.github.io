/* ============================================================
   ask-anna.js — плавающий виджет "Спросить Анну"
   Levitsky & Son · верхний правый угол · история сессии
   ============================================================ */
(function () {
  "use strict";

  var API_BASE     = "https://api.levitskyandson.com";
  var CHAT_EP      = API_BASE + "/web/chat";
  var HISTORY_EP   = API_BASE + "/web/history";
  var CLIENT_TOKEN = "web_3f662b802375a6e11ddec134aaed6ecf";
  var AVATAR       = "anna.jpg";
  var SESS_KEY     = "levitsky_anna_session_id";
  var GREETING     = "Здравствуйте! Меня зовут Анна, я ИИ-сотрудник Levitsky & Son. Расскажу про ИИ-сотрудников для вашего бизнеса и помогу подобрать решение. С чего начнём?";
  var TOP_OFFSET   = "80px";

  if (window.__askAnnaLoaded) return;
  window.__askAnnaLoaded = true;

  function uuid() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
      var r = (Math.random() * 16) | 0, v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }
  var sessionId = localStorage.getItem(SESS_KEY);
  if (!sessionId) { sessionId = uuid(); localStorage.setItem(SESS_KEY, sessionId); }

  var css = document.createElement("style");
  css.textContent = [
    "#aa-w{position:fixed;right:24px;top:" + TOP_OFFSET + ";z-index:99990;font-family:-apple-system,'Inter',system-ui,sans-serif}",
    "#aa-fab{display:flex;align-items:center;gap:12px;background:rgba(28,23,18,0);color:#fff;border:1px solid rgba(255,255,255,.3);border-radius:100px;padding:10px 22px 10px 10px;cursor:pointer;box-shadow:none;transition:background .35s,border-color .35s,box-shadow .35s,transform .2s}",
    "#aa-fab:hover{transform:translateY(-2px)}",
    "#aa-fab.scrolled{background:#1c1712;border-color:transparent;box-shadow:0 8px 30px rgba(0,0,0,.28)}",
    ".aa-ava{width:40px;height:40px;border-radius:50%;object-fit:cover;flex:none;background:#3a2f24}",
    ".aa-fab-txt{font-size:16px;font-weight:600;white-space:nowrap}",
    "#aa-panel{position:absolute;right:0;top:72px;width:390px;max-width:calc(100vw - 32px);height:580px;max-height:calc(100vh - 120px);background:#1c1712;border:1px solid rgba(255,255,255,.12);border-radius:20px;box-shadow:0 24px 60px rgba(0,0,0,.5);display:flex;flex-direction:column;overflow:hidden;transform:translateY(-20px) scale(.98);opacity:0;pointer-events:none;transition:transform .28s cubic-bezier(.16,1,.3,1),opacity .28s;transform-origin:top right}",
    "#aa-panel.open{transform:translateY(0) scale(1);opacity:1;pointer-events:auto}",
    ".aa-head{display:flex;align-items:center;gap:12px;padding:16px 18px;background:linear-gradient(160deg,#8a6f52,#5c4a38)}",
    ".aa-ava-sm{width:42px;height:42px;border-radius:50%;object-fit:cover;flex:none;background:#3a2f24}",
    ".aa-hinfo{flex:1;min-width:0}",
    ".aa-name{font-weight:700;color:#fff;font-size:15px;line-height:1.2}",
    ".aa-role{font-size:12px;color:#e8dcc8;margin-top:2px}",
    ".aa-status{display:inline-flex;align-items:center;gap:5px;font-size:11px;color:#7ed99f;margin-top:3px}",
    ".aa-dot{width:6px;height:6px;border-radius:50%;background:#7ed99f}",
    ".aa-close{background:none;border:none;color:#f0e8dc;font-size:22px;cursor:pointer;padding:4px;line-height:1;opacity:.8}",
    ".aa-close:hover{opacity:1}",
    ".aa-body{flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:10px}",
    ".aa-msg{max-width:82%;padding:10px 14px;border-radius:16px;font-size:14px;line-height:1.45;white-space:pre-wrap;word-wrap:break-word}",
    ".aa-msg.bot{align-self:flex-start;background:#2a2219;color:#f0e8dc;border-bottom-left-radius:4px}",
    ".aa-msg.user{align-self:flex-end;background:#8a6f52;color:#fff;border-bottom-right-radius:4px}",
    ".aa-typing{align-self:flex-start;color:#b3a690;font-size:13px;padding:6px 14px}",
    ".aa-inrow{display:flex;gap:8px;padding:12px;border-top:1px solid rgba(255,255,255,.1);background:#1c1712}",
    ".aa-input{flex:1;background:#2a2219;border:1px solid rgba(255,255,255,.12);border-radius:100px;padding:11px 16px;font-size:14px;color:#f0e8dc;outline:none}",
    ".aa-input::placeholder{color:#8a7c68}",
    ".aa-input:focus{border-color:#8a6f52}",
    ".aa-send{background:#8a6f52;color:#fff;border:none;border-radius:50%;width:42px;height:42px;cursor:pointer;font-size:16px;flex:none}",
    ".aa-send:disabled{opacity:.4;cursor:default}",
    "@media(max-width:600px){#aa-w{right:16px;top:16px}#aa-panel{width:calc(100vw - 32px);top:66px;height:calc(100vh - 100px)}.aa-fab-txt{font-size:15px}}"
  ].join("");
  document.head.appendChild(css);

  var w = document.createElement("div");
  w.id = "aa-w";
  w.innerHTML =
    '<button id="aa-fab">' +
      '<img class="aa-ava" src="' + AVATAR + '" alt="Анна">' +
      '<span class="aa-fab-txt">Спросить Анну</span>' +
    '</button>' +
    '<div id="aa-panel">' +
      '<div class="aa-head">' +
        '<img class="aa-ava-sm" src="' + AVATAR + '" alt="Анна">' +
        '<div class="aa-hinfo">' +
          '<div class="aa-name">Анна</div>' +
          '<div class="aa-role">Менеджер продаж · Levitsky &amp; Son</div>' +
          '<div class="aa-status"><span class="aa-dot"></span>на связи</div>' +
        '</div>' +
        '<button class="aa-close" aria-label="Закрыть">&times;</button>' +
      '</div>' +
      '<div class="aa-body" id="aa-body"></div>' +
      '<div class="aa-inrow">' +
        '<input class="aa-input" id="aa-input" type="text" placeholder="Напишите сообщение…" autocomplete="off">' +
        '<button class="aa-send" id="aa-send" aria-label="Отправить">&#10148;</button>' +
      '</div>' +
    '</div>';
  document.body.appendChild(w);

  var panel = w.querySelector("#aa-panel");
  var body  = w.querySelector("#aa-body");
  var input = w.querySelector("#aa-input");
  var sendBtn = w.querySelector("#aa-send");
  var fab   = w.querySelector("#aa-fab");
  var closeBtn = w.querySelector(".aa-close");

  // Эффект скролла
  function onScroll() {
    fab.classList.toggle("scrolled", window.scrollY > 30);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  function addMsg(text, who) {
    var d = document.createElement("div");
    d.className = "aa-msg " + who;
    d.textContent = text;
    body.appendChild(d);
    body.scrollTop = body.scrollHeight;
  }
  function typing(on) {
    var t = body.querySelector(".aa-typing");
    if (on && !t) {
      t = document.createElement("div");
      t.className = "aa-typing";
      t.textContent = "Анна печатает…";
      body.appendChild(t); body.scrollTop = body.scrollHeight;
    } else if (!on && t) { t.remove(); }
  }

  // Загрузка истории
  function loadHistory() {
    fetch(HISTORY_EP, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ client_token: CLIENT_TOKEN, session_id: sessionId })
    })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (data) {
        var msgs = data && (data.messages || data.conversation);
        if (msgs && msgs.length) {
          msgs.forEach(function (m) {
            var who = (m.role === "user" || m.is_user) ? "user" : "bot";
            var txt = m.content || m.text || m.message || "";
            if (txt) addMsg(txt, who);
          });
        } else {
          addMsg(GREETING, "bot");
        }
      })
      .catch(function () { addMsg(GREETING, "bot"); });
  }

  var historyLoaded = false;

  function toggle() {
    panel.classList.toggle("open");
    if (panel.classList.contains("open")) {
      if (!historyLoaded) {
        historyLoaded = true;
        loadHistory();
      }
      setTimeout(function () { input.focus(); }, 200);
    }
  }

  function send() {
    var text = input.value.trim();
    if (!text || sendBtn.disabled) return;
    input.value = "";
    addMsg(text, "user");
    sendBtn.disabled = true; typing(true);
    fetch(CHAT_EP, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ client_token: CLIENT_TOKEN, session_id: sessionId, message: text })
    })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        typing(false);
        if (data && data.reply) addMsg(data.reply, "bot");
        else addMsg("Извините, техническая заминка. Попробуйте ещё раз.", "bot");
      })
      .catch(function () { typing(false); addMsg("Ошибка соединения. Попробуйте чуть позже.", "bot"); })
      .finally(function () { sendBtn.disabled = false; input.focus(); });
  }

  fab.addEventListener("click", toggle);
  closeBtn.addEventListener("click", toggle);
  sendBtn.addEventListener("click", send);
  input.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); send(); } });
})();
