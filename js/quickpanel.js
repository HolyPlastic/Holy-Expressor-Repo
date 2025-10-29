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

  var hostBridgeState = {
    priming: false,
    ready: false
  };

  function getSharedCSInterface(preferred) {
    if (preferred) {
      return preferred;
    }

    if (window.Holy && Holy.UI && Holy.UI.cs) {
      return Holy.UI.cs;
    }

    return safeNewCSInterface();
  }

  function primeHostBridge(preferredCs) {
    if (hostBridgeState.ready) {
      return true;
    }

    var cs = getSharedCSInterface(preferredCs);
    if (!cs) {
      return false;
    }

    if (window.Holy && Holy.DEV_INIT && typeof Holy.DEV_INIT.loadJSX === "function") {
      try {
        Holy.DEV_INIT.loadJSX();
      } catch (err) {
        console.warn("[QuickPanel] Holy.DEV_INIT.loadJSX() failed", err);
      }
    }

    if (hostBridgeState.priming) {
      return hostBridgeState.ready;
    }

    var basePath;
    try {
      basePath = cs.getSystemPath(SystemPath.EXTENSION);
    } catch (errGetPath) {
      console.warn("[QuickPanel] Unable to resolve extension path", errGetPath);
      return false;
    }

    function toAbsolute(rel) {
      return (basePath + rel).replace(/\\/g, "\\\\");
    }

    var hostModules = [
      "/jsx/modules/host_UTILS.jsx",
      "/jsx/modules/host_MAPS.jsx",
      "/jsx/modules/host_GET.jsx",
      "/jsx/modules/host_APPLY.jsx",
      "/jsx/modules/host_DEV.jsx",
      "/jsx/modules/host_FLYO.jsx",
      "/jsx/host.jsx"
    ];

    hostBridgeState.priming = true;

    try {
      hostModules.forEach(function (file) {
        cs.evalScript('$.evalFile("' + toAbsolute(file) + '")');
      });
    } catch (errEval) {
      hostBridgeState.priming = false;
      console.warn("[QuickPanel] Host module load failed", errEval);
      return false;
    }

    try {
      cs.evalScript('(typeof he_S_SS_applyExpressionToSelection)', function (res) {
        if (res === "function") {
          hostBridgeState.ready = true;
          console.log("[QuickPanel] Host bridge primed");
        } else {
          hostBridgeState.priming = false;
          console.warn("[QuickPanel] Host bridge check returned", res);
        }
      });
    } catch (verifyErr) {
      hostBridgeState.priming = false;
      console.warn("[QuickPanel] Host bridge verification failed", verifyErr);
    }

    return hostBridgeState.ready;
  }

  function ensureHostBridge(cs) {
    if (primeHostBridge(cs)) {
      return;
    }

    setTimeout(function () {
      if (!hostBridgeState.ready) {
        primeHostBridge(cs);
      }
    }, 300);

    setTimeout(function () {
      if (!hostBridgeState.ready) {
        primeHostBridge(cs);
      }
    }, 900);
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

  function scheduleColdStartRecovery(cs) {
    setTimeout(function () {
      if (!ensurePanelPainted()) {
        console.warn("[QuickPanel] Cold-start check #1 → forcing rebind");
        rebindSnippetsUI();
        renderSnippets();
        ensureHostBridge(cs);
      }
    }, 300);

    setTimeout(function () {
      if (!ensurePanelPainted()) {
        console.warn("[QuickPanel] Cold-start check #2 → requesting state sync");
        rebindSnippetsUI();
        renderSnippets();
        ensureHostBridge(cs);
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
    console.warn("[QuickPanel] Holy.SNIPPETS.init not available");
  }

  // ---------------------------------------------------------
  // 📍02 – Warm-Start Self-Heal
  // ---------------------------------------------------------
  setTimeout(function () {
    var row = document.querySelector("#snippetsRow");
    if (!row) {
      console.warn("[QuickPanel] Detected blank init → forcing redraw");
      if (window.Holy && Holy.SNIPPETS && typeof Holy.SNIPPETS.init === "function") {
        try {
          Holy.SNIPPETS.init();
        } catch (e) {
          console.warn("[QuickPanel] Self-heal reinit failed", e);
        }
      }
    }
  }, 800);
}


  document.addEventListener("DOMContentLoaded", function () {
    var doc = window.document;
    doc.body.classList.add("quick-panel");

    var cs = safeNewCSInterface();

    if (window.Holy && Holy.State && typeof Holy.State.init === "function") {
      try {
        Holy.State.init({ panel: "quick" });
      } catch (err) {
        console.warn("[QuickPanel] Holy.State.init failed", err);
      }
    }

    installLogProxy(cs);
    ensureHostBridge(cs);
    disableNativeContextMenu();
    initSnippets();
    rebindSnippetsUI();
    renderSnippets();
    if (window.Holy && Holy.State && typeof Holy.State.attachPanelBindings === "function") {
      try {
        Holy.State.attachPanelBindings();
      } catch (err) {
        console.warn("[QuickPanel] Holy.State.attachPanelBindings failed", err);
      }
    }
    scheduleColdStartRecovery(cs);
    sendWarmWake(cs);

 // ---------------------------------------------------------
  // 📍01 – Focus Rehydration Listener
  // ---------------------------------------------------------
  window.addEventListener("focus", () => {
    console.log("[Holy.State] Panel refocused → rehydrating state");
    if (window.Holy && Holy.State && typeof Holy.State.reload === "function") {
      Holy.State.reload();
    }
  });

})();


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
  
})();
