
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

    var modePanel = document.getElementById("modePanel");
    var modeExpressBtn = document.getElementById("modeExpressBtn");
    var modeRewriteBtn = document.getElementById("modeRewriteBtn");
    var modeViewExpress = document.getElementById("modeViewExpress");
    var modeViewRewrite = document.getElementById("modeViewRewrite");
    var codeEditor = document.getElementById("codeEditor");
    var expressOverlay = document.querySelector(".express-editor-overlay");
    var useAbsoluteComp = document.getElementById("useAbsoluteComp");
    var loadPathFromSelectionBtn = document.getElementById("loadPathFromSelectionBtn");
    var loadFromSelectionBtn = document.getElementById("loadFromSelectionBtn");
    var editorClearBtn = document.getElementById("editorClearBtn");

    var expressOnlyElements = [];

    if (codeEditor) {
      expressOnlyElements.push(codeEditor);
    }

    if (expressOverlay) {
      expressOnlyElements.push(expressOverlay);
    }

    if (useAbsoluteComp && useAbsoluteComp.parentElement) {
      expressOnlyElements.push(useAbsoluteComp.parentElement);
    }

    [loadPathFromSelectionBtn, loadFromSelectionBtn, editorClearBtn].forEach(function (btn) {
      if (btn) {
        expressOnlyElements.push(btn);
      }
    });

    if (modePanel && modeExpressBtn && modeRewriteBtn && modeViewExpress && modeViewRewrite) {
      function setMode(mode) {
        var isExpress = mode === "express";

        modeViewExpress.hidden = !isExpress;
        modeViewRewrite.hidden = isExpress;
        modeViewExpress.classList.toggle("is-hidden", !isExpress);
        modeViewRewrite.classList.toggle("is-hidden", isExpress);
        modeViewExpress.setAttribute("aria-hidden", String(!isExpress));
        modeViewRewrite.setAttribute("aria-hidden", String(isExpress));

        modeExpressBtn.classList.toggle("is-active", isExpress);
        modeRewriteBtn.classList.toggle("is-active", !isExpress);
        modeExpressBtn.setAttribute("aria-selected", String(isExpress));
        modeRewriteBtn.setAttribute("aria-selected", String(!isExpress));

        modePanel.dataset.mode = isExpress ? "express" : "rewrite";

        expressOnlyElements.forEach(function (el) {
          if (!el) return;
          el.hidden = !isExpress;
          el.classList.toggle("is-hidden", !isExpress);
          el.setAttribute("aria-hidden", String(!isExpress));
        });

        if (isExpress && window.editor) {
          try {
            if (typeof window.editor.requestMeasure === "function") {
              window.editor.requestMeasure();
            } else if (typeof window.editor.refresh === "function") {
              window.editor.refresh();
            }
          } catch (refreshErr) {
            if (window.HX_LOG_MODE === "verbose") {
              console.warn("[UI] Failed to refresh editor after showing express mode", refreshErr);
            }
          }
        }
      }

      modeExpressBtn.addEventListener("click", function () {
        setMode("express");
      });

      modeRewriteBtn.addEventListener("click", function () {
        setMode("rewrite");
      });
// Center diamond button toggles between modes
var btnModeSwitch = document.getElementById("btnModeSwitch");
if (btnModeSwitch) {
  btnModeSwitch.addEventListener("click", function () {
    var isExpress = modePanel.dataset.mode === "express";
    setMode(isExpress ? "rewrite" : "express");
  });
}

      setMode("express");
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





// 🔗 Open Full Editor Window
window.addEventListener("DOMContentLoaded", function () {
  const btn = document.getElementById("openFullEditorBtn");
  if (!btn) return;

  btn.addEventListener("click", function () {
    const cs = new CSInterface();

    // 🧩 1️⃣ hide the embedded editor
    const expressArea = document.getElementById("expressArea");
    if (expressArea) expressArea.style.display = "none";

    // 🧩 2️⃣ broadcast current CodeMirror contents before opening
    if (window.Holy && Holy.EXPRESS && typeof Holy.EXPRESS.broadcastEditorText === "function") {
      Holy.EXPRESS.broadcastEditorText();
    }

    // 🧩 3️⃣ open the full editor panel
    cs.requestOpenExtension("com.holy.expressor.fulleditor");
    console.log("[Holy.UI] Full editor opened + content broadcasted");
  });

// 🧠 When full editor loses focus or closes, restore main editor visibility
window.addEventListener("focus", function () {
  const expressArea = document.getElementById("expressArea");
  if (expressArea) expressArea.style.display = "";
});


});




})();
