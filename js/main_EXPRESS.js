if (typeof Holy !== "object") Holy = {};

(function () {
  "use strict";

  // 🔗 Shared instances
  var cs = new CSInterface();
  var HX_LOG_MODE = window.HX_LOG_MODE || "verbose";








// ============================================================
//  Expression Source Portal
// Central place to fetch the current expression text.A
// Later: can switch sources depending on active tab/mode.
// ============================================================
function PORTAL_getCurrentExpression() {
  if (window.editor && window.editor.state && window.editor.state.doc) {
    try {
      var cmText = window.editor.state.doc.toString();

      // CHECKER: treat placeholder as empty
      if (cmText === "// Type your expression here...") return "";

      if (typeof cmText === "string") {
        var trimmed = cmText.trim();
        if (trimmed.length) return trimmed;
      }
    } catch (_) {}
  }
  var exprBox = Holy.UI.DOM("#exprInput");
  return exprBox ? exprBox.value.trim() : "";
}



// V4 - CM6 editor insertion with placeholder cleanup
// V1 – EDITOR_insertText with sanitation + logging
function EDITOR_insertText(str) {
  if (!window.editor) {
    console.warn("EDITOR_insertText – window.editor is missing");
    return;
  }
  var cm = window.editor;
  try {
    var state = cm.state;
    var full = state.doc.toString();

    // CHECKER: clear placeholder if it is the only content
    if (full === "// Type your expression here...") {
      cm.dispatch({ changes: { from: 0, to: full.length, insert: "" } });
      state = cm.state; // refresh state
    }

    // 🔎 Sanitize the incoming string
    var raw = String(str || "");
    var sanitized = raw.trim();

    // Strip wrapping quotes if JSON stringified
    if ((sanitized.startsWith('"') && sanitized.endsWith('"')) ||
        (sanitized.startsWith("'") && sanitized.endsWith("'"))) {
      sanitized = sanitized.slice(1, -1);
    }

    // Collapse double-escaped quotes
    sanitized = sanitized.replace(/\\"/g, '"');

    // Log before/after
if (window.HX_LOG_MODE === "verbose") {
  console.log("EDITOR_insertText raw:", raw);
  console.log("EDITOR_insertText sanitized:", sanitized);
}

    var docLength = state.doc.length;

    // If editor is focused, insert at current selection
    var isFocused = document.activeElement && document.activeElement.closest("#codeEditor");
    var sel = state.selection && state.selection.main
      ? state.selection.main
      : { from: docLength, to: docLength };

    var from = isFocused ? sel.from : docLength;
    var to   = isFocused ? sel.to   : docLength;

    cm.dispatch({
      changes: { from: from, to: to, insert: sanitized }
    });
    if (window.HX_LOG_MODE === "verbose") {
  console.log("📺 CODEMIRROR DISPLAY", { from, to, insert: sanitized });
}

  } catch (e) {
    console.error("EDITOR_insertText failed:", e);
  }
}






// V3 - apply expression by strict search within selection scope (used by Blue when Custom Search is active)
function HE_applyByStrictSearch(expr, searchVal) {
  var q = (searchVal || "").trim();
  if (!q) { Holy.UI.toast("Enter a Custom Name to search"); return; }

  // Build and escape JSON for evalScript
  var payload = JSON.stringify({ expressionText: String(expr), searchTerm: q, strictMode: true });
  var escaped = payload.replace(/\\/g, "\\\\").replace(/"/g, '\\"');

  Holy.UI.cs.evalScript('he_P_SC_applyExpressionBySearch("' + escaped + '")', function (report) {
    // Title first, then the JSON result from host
    Holy.BUTTONS.updateApplyReport("Blue Apply by Custom Search", report);
  });
}







  // ------------- Presets -------------
  var PRESETS = [
    {
      id: "wiggle_auto",
      name: "Wiggle - auto dimension",
      variants: {
        OneD:   "wiggle(freq, amp)",
        TwoD:   "[wiggle(freq, amp)[0], wiggle(freq, amp)[1]]",
        ThreeD: "wiggle(freq, amp)",
        Color:  "wiggle(freq, amp)"
      },
      params: { freq: 2, amp: 20 }
    }
  ];

  function initPresets() {
    var sel = Holy.UI.DOM("#presetSelect");
    if (!sel) return;
    PRESETS.forEach(function (p) {
      var opt = document.createElement("option");
      opt.value = p.id;
      opt.textContent = p.name;
      sel.appendChild(opt);
    });
  }

  function buildExpressionForSelection(cb) {
    Holy.UI.cs.evalScript("he_U_TS_peekSelectionType()", function (raw) {
      var r = {};
      try { r = JSON.parse(raw || "{}"); } catch (e) {}
      if (!r.ok) {
        Holy.UI.toast(r.err || "No selection");
        return;
      }
      var presetId = (Holy.UI.DOM("#presetSelect") && Holy.UI.DOM("#presetSelect").value) || PRESETS[0].id;
      var preset = PRESETS.find(function (p) { return p.id === presetId; }) || PRESETS[0];
      var vt = r.valueType || "OneD";
      var variant = preset.variants[vt] || preset.variants.OneD;
      var expr = variant
        .replace(/freq/g, String(preset.params.freq))
        .replace(/amp/g, String(preset.params.amp));
      cb(expr);
    });
  }
  
function buildExpressionForSearch(searchTerm, cb) {
  var payload = JSON.stringify({ searchTerm: searchTerm });
  var escaped = payload.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  Holy.UI.cs.evalScript('he_U_TP_peekTypeForSearch("' + escaped + '")', function (raw) {
    var r = {};
    try { r = JSON.parse(raw || "{}"); } catch (e) {}
    var presetId = (Holy.UI.DOM("#presetSelect") && Holy.UI.DOM("#presetSelect").value) || PRESETS[0].id;
    var preset   = PRESETS.find(function (p) { return p.id === presetId; }) || PRESETS[0];
    var vt       = r.valueType || "OneD";             // graceful fallback for layer-only selection
    var variant  = preset.variants[vt] || preset.variants.OneD;
    var expr = variant
      .replace(/freq/g, String(preset.params.freq))
      .replace(/amp/g,  String(preset.params.amp));
    cb(expr);
  })
}













// ---------------------------------------------------------
// 🚀 MODULE EXPORT
// ---------------------------------------------------------
Holy.EXPRESS = {
  cs: cs,
  HX_LOG_MODE: HX_LOG_MODE,
  PORTAL_getCurrentExpression: PORTAL_getCurrentExpression,
  EDITOR_insertText: EDITOR_insertText,
  HE_applyByStrictSearch: HE_applyByStrictSearch,
  buildExpressionForSelection: buildExpressionForSelection,
  buildExpressionForSearch: buildExpressionForSearch,
  initPresets: initPresets
};
})();