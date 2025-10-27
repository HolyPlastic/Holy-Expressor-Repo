if (typeof Holy !== "object") Holy = {};

(function () {
  "use strict";

  // 🔗 Shared instances
  var cs = new CSInterface();
  var HX_LOG_MODE = window.HX_LOG_MODE || "verbose";









// Debug messages from host.jsx
Holy.UI.cs.addEventListener("com.holyexpressor.debug", (evt) => {
    if (window.HX_LOG_MODE === "verbose") {
  console.log("[host]", evt.data);
}

});








  // ---------------------------------------------------------
  // 🚀 Load JSON2 + HostJSX
  // ---------------------------------------------------------
function loadJSX() {
  // Base path to extension
  var base = Holy.UI.cs.getSystemPath(SystemPath.EXTENSION);

  // Path helper (escapes backslashes for Windows)
  function p(rel) {
    return (base + rel).replace(/\\/g, "\\\\");
  }

  // Load JSON polyfill first (required for legacy AE engines)
  Holy.UI.cs.evalScript('$.evalFile("' + p("/jsx/json2.js") + '")');

  // Explicitly load all host modules in correct order
  var hostModules = [
    "/jsx/modules/host_UTILS.jsx",
    "/jsx/modules/host_MAPS.jsx",
    "/jsx/modules/host_GET.jsx",
    "/jsx/modules/host_APPLY.jsx",
    "/jsx/modules/host_DEV.jsx",
      "/jsx/modules/host_FLYO.jsx", // 🆕 added for flyover launcher
    "/jsx/host.jsx" // load main host last
  ];

  hostModules.forEach(function (file) {
    Holy.UI.cs.evalScript('$.evalFile("' + p(file) + '")');
  });

  // Console pings to confirm ExtendScript linkage
  Holy.UI.cs.evalScript('(typeof he_U_SS_getSelectionSummary)', function (res) {
    console.log("he_U_SS_getSelectionSummary typeof:", res);
  });

  Holy.UI.cs.evalScript('(typeof he_U_getSelectedPaths)', function (res) {
    console.log("he_U_getSelectedPaths typeof:", res);
  });

  console.log("✅ loadJSX(): All host modules loaded into ExtendScript.");
}

  







function init() {
    loadJSX();
    Holy.UI.initTabs();
    Holy.EXPRESS.initPresets();
    Holy.BUTTONS.wirePanelButtons();

    // ---------------------------------------------------------
    // 🧩 SNIPPETS MODULE INIT
    // ---------------------------------------------------------
    if (Holy.SNIPPETS && typeof Holy.SNIPPETS.init === "function") {
        // 💡 CHECKER: run dynamic snippet button rendering
        Holy.SNIPPETS.init();
        console.log("[Holy.SNIPPETS] init() called from DEV_INIT");
    } else {
        // 💡 CHECKER: prevent crash if SNIPPETS failed to load
        console.warn("[Holy.SNIPPETS] init unavailable at boot");
    }


  Holy.MENU.contextM_disableNative();
    console.log("Holy Expressor ready");
}


  Holy.UI.cs.addEventListener("com.adobe.csxs.events.SDKEventMessage", function(evt) {
    if (evt && evt.data && evt.data.indexOf("HE_LOG::") === 0) {
      var msg = evt.data.replace("HE_LOG::", "");
      var out = document.querySelector("#applyOutput");
      if (out) {
        out.textContent += "\n" + msg;
      }
      console.log("HE_LOG", msg);
    }
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
  






// --- CodeMirror setup ---	
window.addEventListener("DOMContentLoaded", () => {	
console.log("CodeMirror global:", window.codemirror);	

// ✅ Corrected guard: only continue if CodeMirror is loaded
if (!window.codemirror || !window.codemirror.EditorState) {
console.warn("⚠️ CodeMirror bundle missing or not ready");
return;
}

const startState = window.codemirror.EditorState.create({
doc: "// Type your expression here...",
extensions: [
window.codemirror.basicSetup,
window.codemirror.javascript(),
window.codemirror.oneDark,
window.codemirror.EditorView.lineWrapping // ✅ word wrap
]
});

window.editor = new window.codemirror.EditorView({
state: startState,
parent: document.getElementById("codeEditor")
});

// ✅ V2 - Clear placeholder on focus/click
if (window.editor && window.editor.contentDOM) {
window.editor.contentDOM.addEventListener("focus", () => {
try {
const full = window.editor.state.doc.toString();
if (full === "// Type your expression here...") {
window.editor.dispatch({
changes: { from: 0, to: full.length, insert: "" }
});
console.log("Placeholder cleared on contentDOM focus");
}
} catch (e) {
console.error("Placeholder clear failed:", e);
}
});
}

console.log("✅ CodeMirror editor mounted");
});
  
  




// ---------------------------------------------------------
// 🚀 MODULE EXPORT
// ---------------------------------------------------------
Holy.DEV_INIT = {
  cs: cs,
  HX_LOG_MODE: HX_LOG_MODE,
  loadJSX: loadJSX,
  init: init
};

})();