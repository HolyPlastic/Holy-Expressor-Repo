
if (typeof Holy !== "object") Holy = {};

(function () {
  "use strict";

var cs = new CSInterface();


// -----------------------------------------------------------
// 🧭 Global log mode switch: set "verbose" or "silent"
window.HX_LOG_MODE = "verbose";
// -----------------------------------------------------------






 // ------------- UI helpers -------------
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
  
  
// V2 — External Flyover Trigger via JSX bridge
document.addEventListener("DOMContentLoaded", () => {
  const flyoBtn = document.getElementById("flyoLaunchBtn");
  if (flyoBtn) {
    flyoBtn.addEventListener("click", () => {
      console.log("UI: Flyover button clicked (external bridge mode)");

      // ⚙️ Call the JSX bridge to launch the .bat file
      try {
        const cs = new CSInterface();
        cs.evalScript("he_launchFlyover()");
      } catch (err) {
        console.error("UI: Failed to call JSX bridge →", err);
      }
    });
  }

  const editorMaxBtn = document.getElementById("editorMaximizeBtn");
  if (editorMaxBtn) {
    const srLabel = editorMaxBtn.querySelector(".sr-only");

    function applyMaximizeState(isMaximized) {
      const label = isMaximized ? "Restore editor size" : "Maximize editor";
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

    editorMaxBtn.addEventListener("click", () => {
      const nextState = !document.body.classList.contains("editor-maximized");
      applyMaximizeState(nextState);
    });
  }
});

  
  // ------------- Tabs -------------
  function initTabs() {
    allDOM(".tab-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        allDOM(".tab-btn").forEach(function (b) { b.classList.remove("active"); });
        btn.classList.add("active");
        var id = btn.getAttribute("data-tab");
        allDOM(".tab").forEach(function (t) { t.classList.remove("active"); });
        DOM("#" + id).classList.add("active");
      });
    });
  }


  
  // ------------- TARGET -------------
  function onTarget() {
    cs.evalScript("he_U_SS_getSelectionSummary()", function (raw) {
      var r = {};
      try { r = JSON.parse(raw || "{}"); } catch (e) {}
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
})();