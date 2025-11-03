
if (typeof Holy !== "object") Holy = {};

(function () {
  "use strict";

  var cs = new CSInterface();


  // -----------------------------------------------------------
  // 🧭 Global log mode switch: set "verbose" or "silent"
  window.HX_LOG_MODE = "verbose";
  // -----------------------------------------------------------






  // ------------- UI helpers -------------
  function ensureHostReady(callback, attempts = 0) {
    const maxAttempts = 15;
    const interval = 300;
    const env = cs && cs.hostEnvironment ? cs.hostEnvironment : {};

    if (env.appName && env.appName.length) {
      console.log("[UI] Host environment ready, proceeding with callback.");
      callback();
      return;
    }

    if (attempts >= maxAttempts) {
      console.warn("[UI] Host environment never became ready after", attempts, "attempts");
      callback(); // fallback to proceed anyway
      return;
    }

    console.log("[UI] Host not ready, retrying...", attempts);
    setTimeout(() => ensureHostReady(callback, attempts + 1), interval);
  }

  var DOM = function (sel) { return document.querySelector(sel); };
  var allDOM = function (sel) { return Array.prototype.slice.call(document.querySelectorAll(sel)); };
  function toast(msg) {
    var el = DOM("#toast");
    if (!el) return;
    el.textContent = msg;
    el.style.display = "block";
    clearTimeout(el._t);
    el._t = setTimeout(function () { el.style.display = "none"; }, 1600);
  }


  document.addEventListener("DOMContentLoaded", function () {
    // V2 — External Flyover Trigger via JSX bridge
    var flyoBtn = document.getElementById("flyoLaunchBtn");
    if (flyoBtn) {
      flyoBtn.addEventListener("click", function () {
        console.log("UI: Flyover button clicked (external bridge mode)");

        try {
          cs.evalScript("he_launchFlyover()");
        } catch (err) {
          console.error("UI: Failed to call JSX bridge →", err);
        }
      });
    }

    // ---------------------------------------------------------
    // ⚡ Quick Access Panel Launcher (with Warm-Wake Fix)
    // ---------------------------------------------------------
    var quickAccessBtn = document.getElementById("quickAccessLaunchBtn");
    if (quickAccessBtn) {
      quickAccessBtn.addEventListener("click", function () {
        try {
          console.log("[UI] Opening quick access panel");
          console.log("[UI] Checking host readiness before launching QuickPanel...");
          ensureHostReady(() => {
            cs.requestOpenExtension("com.holy.expressor.quickpanel");
          });

          setTimeout(function () {
            try {
ensureHostReady(() => {
  cs.requestOpenExtension("com.holy.expressor.quickpanel");
});
            } catch (e) {
              console.warn("[UI] QuickPanel Warm-Wake dispatch failed", e);
            }

          }, 800);

          cs.evalScript("app.activeViewer && app.activeViewer.setActive();");
        } catch (err) {
          console.error("[UI] Failed to open quick access panel →", err);
        }
      });
    }


    var editorMaxBtn = document.getElementById("editorMaximizeBtn");
    if (editorMaxBtn) {
      var srLabel = editorMaxBtn.querySelector(".sr-only");

      function applyMaximizeState(isMaximized) {
        var label = isMaximized ? "Restore editor size" : "Maximize editor";
        document.body.classList.toggle("editor-maximized", isMaximized);
        editorMaxBtn.classList.toggle("is-active", isMaximized);
        editorMaxBtn.setAttribute("aria-pressed", String(isMaximized));
        editorMaxBtn.setAttribute("aria-label", label);
        editorMaxBtn.setAttribute("title", label);
        if (srLabel) srLabel.textContent = label;

        if (window.editor) {
          try {
            if (typeof window.editor.requestMeasure === "function") {
              window.editor.requestMeasure();
            } else if (window.editor.dom && typeof window.editor.dom.getBoundingClientRect === "function") {
              window.editor.dom.getBoundingClientRect();
            }
          } catch (err) {
            if (window.HX_LOG_MODE === "verbose") {
              console.warn("Editor resize refresh failed", err);
            }
          }
        }
      }

      editorMaxBtn.addEventListener("click", function () {
        var nextState = !document.body.classList.contains("editor-maximized");
        applyMaximizeState(nextState);
      });
    }

    var tabContent = document.getElementById("mainTabContent");
    var tabButtons = document.querySelectorAll(".modeSwitchBar [data-tab]");
    if (tabContent && tabButtons.length) {
      var tabPanels = tabContent.querySelectorAll(".panel");
      var expressArea = document.getElementById("expressArea");
      var searchPanel = document.getElementById("searchReplacePanel");
      var btnModeSwitch = document.getElementById("btnModeSwitch");
      var tabExpressBtn = document.getElementById("tab-express");
      var tabSearchBtn = document.getElementById("tab-search");
      var btnExpressMode = tabExpressBtn;
      var btnRewriteMode = tabSearchBtn;

      function applyModeState(isExpress) {
        if (!expressArea) return;

expressArea.classList.toggle("express-active", isExpress);
expressArea.classList.toggle("rewrite-active", !isExpress);

const modeSwitchBar = document.querySelector(".modeSwitchBar");
if (modeSwitchBar) {
  modeSwitchBar.classList.toggle("express-active", isExpress);
  modeSwitchBar.classList.toggle("rewrite-active", !isExpress);
}


        if (btnExpressMode) {
          btnExpressMode.classList.toggle("active", isExpress);
          btnExpressMode.setAttribute("aria-pressed", isExpress ? "true" : "false");
        }

        if (btnRewriteMode) {
          btnRewriteMode.classList.toggle("active", !isExpress);
          btnRewriteMode.setAttribute("aria-pressed", !isExpress ? "true" : "false");
        }

        if (btnModeSwitch) {
          var switchLabel = isExpress ? "Switch to rewrite mode" : "Switch to express mode";
          btnModeSwitch.setAttribute("aria-label", switchLabel);
          btnModeSwitch.setAttribute("title", switchLabel);
        }

        if (tabExpressBtn) {
          tabExpressBtn.classList.toggle("active", isExpress);
          tabExpressBtn.setAttribute("aria-selected", isExpress ? "true" : "false");
        }

        if (tabSearchBtn) {
          tabSearchBtn.classList.toggle("active", !isExpress);
          tabSearchBtn.setAttribute("aria-selected", !isExpress ? "true" : "false");
        }

        if (searchPanel) {
          searchPanel.setAttribute("aria-hidden", isExpress ? "true" : "false");
        }
      }

      function activateTab(targetId) {
        Array.prototype.forEach.call(tabButtons, function (btn) {
          var isTarget = btn.getAttribute("data-tab") === targetId;
          btn.classList.toggle("active", isTarget);
          btn.setAttribute("aria-selected", isTarget ? "true" : "false");
        });

        Array.prototype.forEach.call(tabPanels, function (panel) {
          var panelId = panel.id;

          if (panelId === "expressArea") {
            panel.classList.remove("hidden");
            return;
          }

          if (panelId === "searchReplacePanel") {
            panel.classList.toggle("hidden", targetId !== "searchReplacePanel");
            return;
          }

          var isTarget = panelId === targetId;
          panel.classList.toggle("hidden", !isTarget);
        });

        if (targetId === "searchReplacePanel") {
          if (searchPanel) {
            searchPanel.classList.remove("hidden");
          }
          applyModeState(false);
          return;
        }

        if (targetId === "expressArea") {
          if (searchPanel) {
            searchPanel.classList.add("hidden");
          }
          applyModeState(true);
        }
      }

      Array.prototype.forEach.call(tabButtons, function (btn) {
        btn.addEventListener("click", function () {
          var target = btn.getAttribute("data-tab");
          if (!target) return;
          activateTab(target);
        });
      });

      function setMode(mode) {
        if (mode === "rewrite") {
          activateTab("searchReplacePanel");
        } else {
          activateTab("expressArea");
        }
      }

      if (btnExpressMode) {
        btnExpressMode.addEventListener("click", function () {
          setMode("express");
        });
      }

      if (btnRewriteMode) {
        btnRewriteMode.addEventListener("click", function () {
          setMode("rewrite");
        });
      }

      if (btnModeSwitch) {
        btnModeSwitch.addEventListener("click", function () {
          var isExpress = expressArea ? expressArea.classList.contains("express-active") : true;
          setMode(isExpress ? "rewrite" : "express");
        });
      }

      activateTab("expressArea");
    }
  });

  // ✅ REWRITE – QuickPanel Log Listener (safe for object or string payload)
  function quickPanelLogListener(evt) {
    if (!evt) return;

    let payload = evt.data;
    try {
      // CEP >=6.1 sends already-parsed objects; handle both cases
      if (typeof payload === "string") {
        payload = JSON.parse(payload || "{}");
      } else if (typeof payload !== "object" || payload === null) {
        payload = {};
      }
    } catch (err) {
      console.warn("[Holy.UI] Failed to parse quick panel log payload", err, evt.data);
      return;
    }

    const level = payload.level || "log";
    const messages = payload.messages || [];
    const target = console[level] || console.log;

    try {
      target.apply(console, ["[QuickPanel]"].concat(messages));
    } catch (dispatchErr) {
      console.log.apply(console, ["[QuickPanel]"].concat(messages));
      console.warn("[Holy.UI] Quick panel log relay failed", dispatchErr);
    }
  }

  // ✅ Keep listener registration as-is
  if (!document.body || !document.body.classList.contains("quick-panel")) {
    cs.addEventListener("com.holy.expressor.quickpanel.log", quickPanelLogListener);
  }



  // ------------- Tabs -------------
  function initTabs() {
    allDOM(".tab-btn").forEach(function (btn) {
      var tabId = btn.getAttribute("data-tab");
      if (!tabId) return;

      btn.addEventListener("click", function () {
        allDOM(".tab-btn").forEach(function (b) { b.classList.remove("active"); });
        btn.classList.add("active");
        allDOM(".tab").forEach(function (t) { t.classList.remove("active"); });
        var target = DOM("#" + tabId);
        if (!target) {
          if (window.HX_LOG_MODE === "verbose") {
            console.warn("[Holy.UI] Tab target not found for", tabId);
          }
          return;
        }
        target.classList.add("active");
      });
    });
  }



  // ------------- TARGET -------------
  function onTarget() {
    cs.evalScript("he_U_SS_getSelectionSummary()", function (raw) {
      var r = {};
      try { r = JSON.parse(raw || "{}"); } catch (e) { }
      var out = DOM("#TargetList");
      if (!out) return;

      if (!r.ok) {
        out.textContent = "Error: " + (r.err || "unknown");
        return;
      }
      if (!r.items || !r.items.length) {
        out.textContent = "No properties selected";
        return;
      }
      out.innerHTML = ""; // clear old entries
      r.items.forEach(function (it, i) {
        var div = document.createElement("div");
        div.className = "target-item";
        div.setAttribute("data-path", it.path);
        div.textContent = (i + 1) + ". " + it.layerName + " | " + it.displayName + " | " + it.path + " | type=" + (it.isArray ? ("Array[" + it.length + "]") : "OneD");
        out.appendChild(div);
      });
    });
  }

  // ---------------------------------------------------------
  // 🚀 MODULE EXPORT
  // ---------------------------------------------------------
  Holy.UI = {
    cs: cs,
    HX_LOG_MODE: HX_LOG_MODE,
    DOM: DOM,
    allDOM: allDOM,
    toast: toast,
    initTabs: initTabs,
    onTarget: onTarget
  };


  // ---------------------------------------------------------
  // 📍01 – Focus Rehydration Listener
  // ---------------------------------------------------------
  window.addEventListener("focus", () => {
    console.log("[Holy.State] Panel refocused → rehydrating state");
    if (window.Holy && Holy.State && typeof Holy.State.reload === "function") {
      Holy.State.reload();
    }
  });
  // ---------------------------------------------------------
  // 📍V4.2 – LiveSync listener (Main Panel)
  // ---------------------------------------------------------
  try {

    cs.addEventListener("com.holy.expressor.stateChanged", function (evt) {
      try {
        var payload = typeof evt.data === "object" ? evt.data : JSON.parse(evt.data);
        console.log("[Holy.State] LiveSync event received →", payload);

        // 💡 Re-init snippets when any other panel updates state
        if (payload.type === "banksChanged" && window.Holy && Holy.SNIPPETS) {
          Holy.SNIPPETS.init();
        }
      } catch (parseErr) {
        console.warn("[Holy.State] LiveSync parse error", parseErr);
      }
    });
  } catch (listenerErr) {
    console.warn("[Holy.State] Failed to attach LiveSync listener", listenerErr);
  }

})();
