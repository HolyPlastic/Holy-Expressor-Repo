if (typeof window.Holy !== "object" || window.Holy === null) {
  window.Holy = {};
}

(function () {
  "use strict";

  function safeNewCSInterface() {
    try {
      return new CSInterface();
    } catch (err) {
      console.warn("[QuickPanel] CSInterface unavailable", err);
      return null;
    }
  }

  function installLogProxy(cs) {
    if (!cs || typeof CSEvent !== "function") {
      return;
    }

    var original = {
      log: console.log ? console.log.bind(console) : function () {},
      info: console.info ? console.info.bind(console) : console.log.bind(console),
      warn: console.warn ? console.warn.bind(console) : console.log.bind(console),
      error: console.error ? console.error.bind(console) : console.log.bind(console)
    };

    var levels = ["log", "info", "warn", "error"];

    function serialise(args) {
      return Array.prototype.map.call(args, function (entry) {
        if (typeof entry === "string") {
          return entry;
        }
        try {
          return JSON.stringify(entry);
        } catch (err) {
          return String(entry);
        }
      });
    }

    levels.forEach(function (level) {
      if (typeof console[level] !== "function") {
        return;
      }

      console[level] = function () {
        original[level].apply(console, arguments);

        try {
          var evt = new CSEvent("com.holy.expressor.quickpanel.log", "APPLICATION");
          evt.data = JSON.stringify({
            level: level,
            messages: serialise(arguments),
            time: Date.now()
          });
          cs.dispatchEvent(evt);
        } catch (dispatchErr) {
          original.error("[QuickPanel] Log proxy dispatch failed", dispatchErr);
        }
      };
    });
  }

  function disableNativeContextMenu() {
    if (window.Holy && Holy.MENU && typeof Holy.MENU.contextM_disableNative === "function") {
      try {
        Holy.MENU.contextM_disableNative();
      } catch (err) {
        console.warn("[QuickPanel] Failed to disable native context menu", err);
      }
    }
  }

  function rebindSnippetsUI() {
    if (window.Holy && Holy.SNIPPETS && typeof Holy.SNIPPETS.rebindQuickAccessUI === "function") {
      try {
        Holy.SNIPPETS.rebindQuickAccessUI();
      } catch (err) {
        console.warn("[QuickPanel] Failed to rebind bank UI", err);
      }
    }
  }

  function renderSnippets() {
    if (window.Holy && Holy.SNIPPETS && typeof Holy.SNIPPETS.renderSnippets === "function") {
      try {
        Holy.SNIPPETS.renderSnippets();
      } catch (err) {
        console.warn("[QuickPanel] renderSnippets failed", err);
      }
    }
  }

  function ensurePanelPainted() {
    var doc = window.document;
    var row = doc.getElementById("snippetsRow");
    if (!row) {
      console.warn("[QuickPanel] snippetsRow missing from DOM");
      return false;
    }

    if (row.children && row.children.length) {
      return true;
    }

    renderSnippets();
    return !!(row.children && row.children.length);
  }

  function scheduleColdStartRecovery() {
    setTimeout(function () {
      if (!ensurePanelPainted()) {
        console.warn("[QuickPanel] Cold-start check #1 → forcing rebind");
        rebindSnippetsUI();
        renderSnippets();
      }
    }, 300);

    setTimeout(function () {
      if (!ensurePanelPainted()) {
        console.warn("[QuickPanel] Cold-start check #2 → requesting state sync");
        rebindSnippetsUI();
        renderSnippets();
      }
    }, 900);
  }

  function sendWarmWake(cs) {
    if (!cs || typeof CSEvent !== "function") {
      return;
    }

    try {
      var evt = new CSEvent("com.holy.expressor.quickpanel.log", "APPLICATION");
      evt.data = JSON.stringify({
        level: "info",
        messages: ["[QuickPanel] Warm wake handshake"],
        time: Date.now()
      });
      cs.dispatchEvent(evt);
    } catch (err) {
      console.warn("[QuickPanel] Warm wake dispatch failed", err);
    }
  }

  function initSnippets() {
    if (window.Holy && Holy.SNIPPETS && typeof Holy.SNIPPETS.init === "function") {
      try {
        Holy.SNIPPETS.init();
      } catch (err) {
        console.error("[QuickPanel] Failed to initialize snippets", err);
      }
    } else {
      console.warn("[QuickPanel] Holy.SNIPPETS.init is not available");
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    var doc = window.document;
    doc.body.classList.add("quick-panel");

    var cs = safeNewCSInterface();

    installLogProxy(cs);
    disableNativeContextMenu();
    initSnippets();
    rebindSnippetsUI();
    renderSnippets();
    scheduleColdStartRecovery();
    sendWarmWake(cs);

    var closeBtn = doc.getElementById("quickPanelCloseBtn");
    if (closeBtn && cs) {
      closeBtn.addEventListener("click", function () {
        try {
          cs.closeExtension();
        } catch (err) {
          console.error("[QuickPanel] Failed to close extension", err);
        }
      });
    }
  });
})();
