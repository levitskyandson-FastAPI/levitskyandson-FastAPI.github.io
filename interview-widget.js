(function () {
  "use strict";

  // ---- Конфиг эндпоинта (тот же движок, что у Анастасии) ----
  var API_BASE = "https://api.levitskyandson.com";
  var CHAT_EP = API_BASE + "/web/chat";
  var HISTORY_EP = API_BASE + "/web/history";

  // Находим кнопку-триггер с data-атрибутами
  // <button class="btn-primary" data-interview data-client="UUID" data-name="Анна" data-role="Менеджер продаж">Провести собеседование</button>
  var triggers = document.querySelectorAll("[data-interview]");
  if (!triggers.length) return;

  // ---- Стили (в тёплой гамме сайта) ----
  var css = document.createElement("style");
  css.textContent = [
    ".iw-overlay{position:fixed;inset:0;background:rgba(20,17,14,.55);backdrop-filter:blur(4px);z-index:9998;opacity:0;pointer-events:none;transition:opacity .25s}",
    ".iw-overlay.open{opacity:1;pointer-events:auto}",
    ".iw-modal{position:fixed;right:24px;bottom:24px;width:400px;max-width:calc(100vw - 32px);height:600px;max-height:calc(100vh - 48px);background:#1c1712;border:1px solid rgba(255,255,255,.12);border-radius:20px;box-shadow:0 24px 60px rgba(0,0,0,.5);z-index:9999;display:flex;flex-direction:column;overflow:hidden;transform:translateY(20px) scale(.98);opacity:0;pointer-events:none;transition:transform .28s cubic-bezier(.16,1,.3,1),opacity .28s}",
    ".iw-modal.open{transform:translateY(0) scale(1);opacity:1;pointer-events:auto}",
    ".iw-head{display:flex;align-items:center;gap:12px;padding:16px 18px;background:linear-gradient(160deg,#8a6f52,#5c4a38);border-bottom:1px solid rgba(255,255,255,.1)}",
    ".iw-ava{width:42px;height:42px;border-radius:50%;object-fit:cover;background:#3a2f24;flex:none;display:flex;align-items:center;justify-content:center;font-weight:700;color:#f0e8dc;font-size:18px}",
    ".iw-hinfo{flex:1;min-width:0}",
    ".iw-name{font-weight:700;color:#fff;font-size:15px;line-height:1.2}",
    ".iw-role{font-size:12px;color:#e8dcc8;margin-top:2px}",
    ".iw-status{display:inline-flex;align-items:center;gap:5px;font-size:11px;color:#7ed99f;margin-top:3px}",
    ".iw-dot{width:6px;height:6px;border-radius:50%;background:#7ed99f}",
    ".iw-close{background:none;border:none;color:#f0e8dc;font-size:22px;cursor:pointer;padding:4px;line-height:1;opacity:.8}",
    ".iw-close:hover{opacity:1}",
    ".iw-body{flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:10px;background:#1c1712}",
    ".iw-msg{max-width:82%;padding:10px 13px;border-radius:14px;font-size:14px;line-height:1.45;word-wrap:break-word}",
    ".iw-bot{align-self:flex-start;background:rgba(255,255,255,.07);color:#f0e8dc;border-bottom-left-radius:4px}",
    ".iw-user{align-self:flex-end;background:#8a6f52;color:#fff;border-bottom-right-radius:4px}",
    ".iw-bot a{color:#e8c89a}",
    ".iw-typing{align-self:flex-start;display:flex;gap:4px;padding:12px 14px}",
    ".iw-typing span{width:7px;height:7px;border-radius:50%;background:#8a6f52;animation:iwb 1.2s infinite}",
    ".iw-typing span:nth-child(2){animation-delay:.2s}.iw-typing span:nth-child(3){animation-delay:.4s}",
    "@keyframes iwb{0%,60%,100%{opacity:.3}30%{opacity:1}}",
    ".iw-foot{padding:12px;border-top:1px solid rgba(255,255,255,.1);display:flex;gap:8px;background:#1c1712}",
    ".iw-input{flex:1;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);border-radius:12px;padding:11px 14px;color:#fff;font-size:14px;outline:none;font-family:inherit}",
    ".iw-input::placeholder{color:#a8977f}",
    ".iw-input:focus{border-color:#8a6f52}",
    ".iw-send{background:#fff;color:#1c1712;border:none;border-radius:12px;padding:0 16px;font-weight:700;cursor:pointer;font-size:14px;flex:none}",
    ".iw-send:disabled{opacity:.5;cursor:default}",
    "@media(max-width:520px){.iw-modal{right:8px;bottom:8px;width:calc(100vw - 16px);height:calc(100vh - 80px)}}"
  ].join("");
  document.head.appendChild(css);

  // ---- DOM модалки ----
  var overlay = document.createElement("div");
  overlay.className = "iw-overlay";
  var modal = document.createElement("div");
  modal.className = "iw-modal";
  modal.innerHTML =
    '<div class="iw-head">' +
      '<div class="iw-ava" id="iwAva"></div>' +
      '<div class="iw-hinfo"><div class="iw-name" id="iwName"></div><div class="iw-role" id="iwRole"></div>' +
      '<span class="iw-status"><span class="iw-dot"></span>на собеседовании</span></div>' +
      '<button class="iw-close" id="iwClose">&times;</button>' +
    '</div>' +
    '<div class="iw-body" id="iwBody"></div>' +
    '<div class="iw-foot"><input class="iw-input" id="iwInput" placeholder="Задайте вопрос кандидату..." autocomplete="off"><button class="iw-send" id="iwSend">→</button></div>';
  document.body.appendChild(overlay);
  document.body.appendChild(modal);

  var body = modal.querySelector("#iwBody");
  var input = modal.querySelector("#iwInput");
  var sendBtn = modal.querySelector("#iwSend");
  var current = { clientId: null, name: "", role: "", ava: "" };

  // ---- Утилиты ----
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function fmt(t) {
    // экранируем, чистим markdown, кликабельные ссылки, переносы
    var s = esc(t);
    s = s.replace(/\*\*(.+?)\*\*/g, "$1").replace(/__(.+?)__/g, "$1");
    s = s.replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>');
    s = s.replace(/\n/g, "<br>");
    return s;
  }
  function sessionKey(clientId) { return "interview_session_" + clientId; }
  function getSession(clientId) {
    var k = sessionKey(clientId);
    var v = localStorage.getItem(k);
    if (!v) { v = "iw_" + Math.random().toString(36).slice(2) + Date.now().toString(36); localStorage.setItem(k, v); }
    return v;
  }
  function addMsg(text, who) {
    var d = document.createElement("div");
    d.className = "iw-msg " + (who === "user" ? "iw-user" : "iw-bot");
    d.innerHTML = who === "user" ? esc(text) : fmt(text);
    body.appendChild(d);
    body.scrollTop = body.scrollHeight;
    return d;
  }
  function showTyping() {
    var t = document.createElement("div");
    t.className = "iw-typing"; t.id = "iwTyping";
    t.innerHTML = "<span></span><span></span><span></span>";
    body.appendChild(t); body.scrollTop = body.scrollHeight;
  }
  function hideTyping() { var t = body.querySelector("#iwTyping"); if (t) t.remove(); }

  // ---- Открытие / закрытие ----
  function open(cfg) {
    current = cfg;
    modal.querySelector("#iwName").textContent = cfg.name || "Кандидат";
    modal.querySelector("#iwRole").textContent = cfg.role || "";
    var ava = modal.querySelector("#iwAva");
    if (cfg.ava) { ava.innerHTML = '<img src="' + esc(cfg.ava) + '" style="width:100%;height:100%;border-radius:50%;object-fit:cover">'; }
    else { ava.textContent = (cfg.name || "?").charAt(0); }
    body.innerHTML = "";
    overlay.classList.add("open");
    modal.classList.add("open");
    setTimeout(function () { input.focus(); }, 300);
    loadHistory(cfg.clientId);
  }
  function close() {
    overlay.classList.remove("open");
    modal.classList.remove("open");
  }

  // ---- История ----
  function loadHistory(clientId) {
    var sid = getSession(clientId);
    var greeted = "Здравствуйте! Меня зовут " + (current.name || "кандидат") + ". Задайте мне любые вопросы — проведите собеседование и решите, брать ли меня в команду.";
    fetch(HISTORY_EP, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ client_token: clientId, session_id: sid })
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
          addMsg(greeted, "bot");
        }
      })
      .catch(function () { addMsg(greeted, "bot"); });
  }

  // ---- Отправка ----
  function send() {
    var text = input.value.trim();
    if (!text || !current.clientId) return;
    addMsg(text, "user");
    input.value = "";
    sendBtn.disabled = true;
    showTyping();
    var sid = getSession(current.clientId);
    fetch(CHAT_EP, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ client_token: current.clientId, message: text, session_id: sid })
    })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        hideTyping();
        var reply = data.reply || data.response || data.answer || data.message || "Извините, не расслышала. Повторите, пожалуйста.";
        addMsg(reply, "bot");
      })
      .catch(function () {
        hideTyping();
        addMsg("Связь прервалась. Попробуйте ещё раз чуть позже.", "bot");
      })
      .finally(function () { sendBtn.disabled = false; input.focus(); });
  }

  sendBtn.addEventListener("click", send);
  input.addEventListener("keydown", function (e) { if (e.key === "Enter") send(); });
  modal.querySelector("#iwClose").addEventListener("click", close);
  overlay.addEventListener("click", close);

  // ---- Привязка кнопок ----
  triggers.forEach(function (btn) {
    btn.addEventListener("click", function (e) {
      e.preventDefault();
      open({
        clientId: btn.getAttribute("data-client"),
        name: btn.getAttribute("data-name") || "Кандидат",
        role: btn.getAttribute("data-role") || "",
        ava: btn.getAttribute("data-ava") || ""
      });
    });
  });
})();
