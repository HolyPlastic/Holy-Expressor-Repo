if (typeof Holy !== "object") Holy = {};

(function () {
  "use strict";

  // 🔗 Shared instances
  var cs = new CSInterface();
  var HX_LOG_MODE = window.HX_LOG_MODE || "verbose";
  var applyLogEntries = [];
  var applyLogWindow = null;

  function formatApplyLogEntry(title, data) {
    var lines = [];

    try {
      var now = new Date();
      var stamp = typeof now.toLocaleTimeString === "function" ? now.toLocaleTimeString() : now.toISOString();
      var label = (title && typeof title === "string") ? title : "Apply";
      lines.push("[" + stamp + "] " + label);

      var raw = data;
      var parsed = null;
      if (typeof raw === "string" && raw.trim()) {
        try { parsed = JSON.parse(raw); }
        catch (err) { parsed = null; }
      } else if (raw && typeof raw === "object") {
        parsed = raw;
      }

      if (parsed && typeof parsed === "object") {
        if (typeof parsed.ok === "boolean") {
          lines.push("Status: " + (parsed.ok ? "ok" : "error"));
        }
        if (parsed.applied != null) lines.push("Applied: " + parsed.applied);
        if (parsed.skipped != null) lines.push("Skipped: " + parsed.skipped);
        if (parsed.expressionName) lines.push("Expression: " + parsed.expressionName);

        var targets = parsed.targets || parsed.paths;
        if (Array.isArray(targets) && targets.length) {
          lines.push("Targets:");
          for (var i = 0; i < targets.length; i++) {
            lines.push("- " + targets[i]);
          }
        }

        var errs = parsed.errors;
        if (errs && !Array.isArray(errs)) errs = [errs];
        if (errs && errs.length) {
          lines.push("Errors:");
          for (var j = 0; j < errs.length; j++) {
            var e = errs[j] || {};
            var path = e.path || e.target || "?";
            var errMsg = e.err || e.message || String(e);
            lines.push("- " + path + " -> " + errMsg);
          }
        }

        if (parsed.details && typeof parsed.details === "string") {
          lines.push("Details: " + parsed.details);
        }
      } else if (typeof raw === "string" && raw.trim()) {
        lines.push("Raw: " + raw.trim());
      } else if (raw != null) {
        try {
          lines.push("Raw: " + JSON.stringify(raw));
        } catch (err2) {
          lines.push("Raw: [unserializable]");
        }
      }
    } catch (err3) {
      lines.push("[Log formatting failed]");
    }

    return lines.join("\n");
  }

  function ensureLogWindowContent() {
    if (!applyLogWindow || applyLogWindow.closed) {
      applyLogWindow = null;
      return null;
    }

    var doc = applyLogWindow.document;
    if (!doc) return null;

    var pre = doc.getElementById("applyLogContent");
    if (pre) return pre;

    doc.open();
    doc.write('<!DOCTYPE html><html><head><meta charset="utf-8"><title>Holy Expressor Apply Log</title><style>body{margin:0;background:#111;color:#f0f0f0;font-family:Menlo,Consolas,monospace;font-size:12px;}header{padding:8px 12px;font-weight:bold;background:#1d1d1d;border-bottom:1px solid #2c2c2c;}pre{margin:0;padding:12px;white-space:pre-wrap;word-break:break-word;overflow-wrap:anywhere;height:calc(100vh - 40px);overflow-y:auto;box-sizing:border-box;background:#141414;}</style></head><body><header>Apply Log</header><pre id="applyLogContent">No log entries yet.</pre></body></html>');
    doc.close();
    return doc.getElementById("applyLogContent");
  }

  function renderApplyLogWindow() {
    var pre = ensureLogWindowContent();
    if (!pre) return;

    pre.textContent = applyLogEntries.length ? applyLogEntries.join("\n\n") : "No log entries yet.";
    pre.scrollTop = pre.scrollHeight;
  }

  function openApplyLogWindow() {
    if (!applyLogWindow || applyLogWindow.closed) {
      applyLogWindow = window.open("", "HolyExpressApplyLog", "width=520,height=600");
      if (!applyLogWindow) {
        console.warn("[Holy.BUTTONS] Failed to open log window (popup blocked?)");
        return;
      }
      if (typeof applyLogWindow.addEventListener === "function") {
        applyLogWindow.addEventListener("beforeunload", function () {
          applyLogWindow = null;
        });
      }
    }

    renderApplyLogWindow();
    try { applyLogWindow.focus(); } catch (err) {}
  }


  // ... module logic ...
          function wirePanelButtons() {

            /* ============================
              TARGET BUTTON 1 - Target Selected
              ============================ */
            const targetSelectedBtn = document.getElementById("targetSelectedBtn");
            if (targetSelectedBtn) {
              targetSelectedBtn.addEventListener("click", () => {
                targetSelectedBtn.classList.add("flash-orange");
                setTimeout(() => targetSelectedBtn.classList.remove("flash-orange"), 300);

                Holy.UI.onTarget();
              });
            }

            /* ============================
              TARGET BUTTON 2 - Select Target
              ============================ */
            const selectTargetBtn = document.getElementById("selectTargetBtn");
            if (selectTargetBtn) {
              selectTargetBtn.addEventListener("click", () => {
                selectTargetBtn.classList.add("stay-orange");
              });
            }

            /* ============================
              APPLY LOG WINDOW
              ============================ */
            var openLogBtn = Holy.UI.DOM("#openApplyLog");
            if (openLogBtn) {
              openLogBtn.addEventListener("click", function () {
                openApplyLogWindow();
              });
            }
          /* ============================
            BLUE APPLY HANDLER (Selection Striker with Custom Search routing)
            V4 – use editor expression for Custom Search; fallback to builder only if editor is empty
            ============================ */
          function onApply() {
            console.log("Blue Apply button clicked");

            var expr = Holy.EXPRESS.PORTAL_getCurrentExpression();
            var hasEditorExpr = !!(expr && String(expr).trim().length);
            if (!hasEditorExpr) {
              // No editor text yet, allow type-driven preset generation for convenience
              expr = "";
            }

            // Blue Apply uses strict search when Custom Search is active
            // HTML ids: checkbox = #useCustomSearch, input = #customSearch
            var csToggle = document.querySelector("#useCustomSearch");
            var csInput  = document.querySelector("#customSearch");

            var useSearch = false;
            if (csToggle && csToggle.checked) useSearch = true;
            if (!useSearch && csInput && csInput.value && csInput.value.trim().length > 0) useSearch = true;

            if (useSearch) {
              var searchVal = csInput ? csInput.value.trim() : "";
              if (!searchVal) { Holy.UI.toast("Enter a Custom Name to search"); return; }

              if (hasEditorExpr) {
                // Use the editor text exactly as authored
                Holy.EXPRESS.HE_applyByStrictSearch(expr, searchVal);
              } else if (typeof Holy.EXPRESS.buildExpressionForSearch === "function") {
                // Fallback: build from preset if user has not typed anything yet
                Holy.EXPRESS.buildExpressionForSearch(searchVal, function (expr2) {
                  Holy.EXPRESS.HE_applyByStrictSearch(expr2, searchVal);
                });
              } else {
                Holy.UI.toast("Enter or build an expression");
              }
              return; // Do not fall through to Selection Striker
            }

            // Default Blue path: direct selection apply (Selection Striker)
            try {
              var exprDirect = hasEditorExpr ? expr : "";
              if (!exprDirect) { Holy.UI.toast("Enter or build an expression"); return; }

              var payload = JSON.stringify({ expressionText: exprDirect });
              var escaped = payload.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
              Holy.UI.cs.evalScript('he_S_SS_applyExpressionToSelection("' + escaped + '")', function (report) {
                updateApplyReport("Blue Apply", report);
              });
            } catch (e) {
              console.error("Blue Apply failed:", e);
              Holy.UI.toast("Blue Apply failed");
            }
          }

          // ==========================================================
          // 🧪 DEV EXPOSE BUTTON
          // ==========================================================
          const exposeBtn = document.getElementById("exposeBtn");
          if (exposeBtn) {
            exposeBtn.addEventListener("click", function () {
              console.log("⚙️  Expose: requesting raw property info from AE...");
              Holy.UI.cs.evalScript("he_U_DEV_exposeSelectedProps()", function (response) {
                try {
                  const data = JSON.parse(response);
                  console.group("🔍 AE Raw Property Dump");
          console.log("Text snapshot:\n" + JSON.stringify(data, null, 2));
          console.log("Interactive view:", data);
          console.groupEnd();


                } catch (err) {
                  console.error("Expose parse error:", err, response);
                }
              });
            });
          }


            /* ============================
              BLUE APPLY BUTTON
              ============================ */
            var applyBtn = Holy.UI.DOM("#applyBtn");
            if (applyBtn) {
              applyBtn.addEventListener("click", onApply);
            }

            /* ============================
              ORANGE APPLY BUTTON (Target List + Custom Search)
              ============================ */
            var applyTargetBtn = Holy.UI.DOM("#applyTargetBtn");
            if (applyTargetBtn) {
              applyTargetBtn.addEventListener("click", function () {
                console.log("Apply to Target button clicked");

                var customToggle = Holy.UI.DOM("#useCustomSearch");
                var customBox    = Holy.UI.DOM("#customSearch");

                if (customToggle && customToggle.checked) {
                  // Custom Search path
                  var searchVal = (customBox && customBox.value.trim()) || "";
                  if (!searchVal) { Holy.UI.toast("Enter a property name"); return; }

                  Holy.EXPRESS.buildExpressionForSearch(searchVal, function (expr) {
                    var payload = JSON.stringify({ expressionText: expr, searchTerm: searchVal });
                  var escaped = payload.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
                    Holy.UI.cs.evalScript('he_P_SC_applyExpressionBySearch("' + escaped + '")', function (raw) {
                      var r = {}; try { r = JSON.parse(raw || "{}"); } catch (e) {}
                      if (!r.ok) {
                        Holy.UI.toast(r.err || "Custom search failed");
                        return;
                      }
                      Holy.UI.toast("Applied to " + r.applied + " properties");
                      updateApplyReport("Orange Apply (Custom Search)", r);
                    });
                  });
                } else {
                  // Target List path
                  var listEl = Holy.UI.DOM("#TargetList");
                  var items = listEl ? listEl.querySelectorAll(".target-item") : [];
                  var paths = [];
                  items.forEach(function (item) {
                    var p = item.getAttribute("data-path");
                    if (p) paths.push(p);
                  });

                  console.log("Debug Target List paths:", paths);

                  if (!paths.length) { Holy.UI.toast("No target paths defined"); return; }

                  function applyWithExpr() {
                    var expr = Holy.EXPRESS.PORTAL_getCurrentExpression();
                    if (!expr) { Holy.UI.toast("Enter or build an expression"); return; }

                    var payload = JSON.stringify({ expressionText: expr, targetPaths: paths });
                    var escaped = payload.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
                    Holy.UI.cs.evalScript('he_S_LS_applyExpressionToTargetList("' + escaped + '")', function (raw) {
                      var r = {}; try { r = JSON.parse(raw || "{}"); } catch (e) {}
                      if (!r.ok) {
                        Holy.UI.toast(r.err || "Apply to target failed");
                        return;
                      }
                      Holy.UI.toast("Applied to " + r.applied + " properties");
                      updateApplyReport("Orange Apply (Target List)", r);
                    });
                  }

                  if (paths.length > 0) {
                    applyWithExpr();
                  }
                }
              });
            }


          /* ============================PULL EXP BUTTTON*/

          // V11 – LFS: dedupe by path preferring direct picks; include ShapePath when the Path was directly selected
          var loadBtn = document.getElementById("loadFromSelectionBtn");
          if (loadBtn) {
            loadBtn.addEventListener("click", function () {
              Holy.UI.cs.evalScript('JSON.stringify(he_U_getSelectedProps())', function (raw) {
                try {
                  var items = JSON.parse(raw || "[]");
                  if (!items || !items.length) {
                    Holy.UI.toast("Nothing selected");
                    return;
                  }

                  // CHECKER: normalize and dedupe by expr path, preferring records that were directly picked
                  var byPath = Object.create(null);

                  for (var i = 0; i < items.length; i++) {
                    var it = items[i];
                    if (!it) continue;

                    var path = String(it.path || "");
                    if (!path) continue;

                    var current = byPath[path];

                    // Choose "better" candidate for the same path:
                    // 1) Prefer direct pick (pickedIsLeaf === true)
                    // 2) Prefer one that has an expression over one that does not
                    // 3) Otherwise keep the existing one
                    if (!current) {
                      byPath[path] = it;
                    } else {
                      var aDirect = !!(it.pickedIsLeaf);
                      var bDirect = !!(current.pickedIsLeaf);
                      if (aDirect && !bDirect) {
                        byPath[path] = it;
                      } else if (aDirect === bDirect) {
                        var aHasExpr = !!(it.expr && it.expr !== "__NO_EXPRESSION__");
                        var bHasExpr = !!(current.expr && current.expr !== "__NO_EXPRESSION__");
                        if (aHasExpr && !bHasExpr) {
                          byPath[path] = it;
                        }
                      }
                    }
                  }

                  // CHECKER: scan whether any non-Path candidate with an expression exists
                  var hasNonPath = false;
                  for (var k in byPath) {
                    if (!Object.prototype.hasOwnProperty.call(byPath, k)) continue;
                    var probe = byPath[k];
                    if (!probe || !probe.expr || probe.expr === "__NO_EXPRESSION__") continue;

                    var mmProbe = String(probe.matchName || "");
                    var clsProbe = String(probe.classification || "");
                    var isPathProbe = (clsProbe === "ShapePath") || (mmProbe === "ADBE Vector Shape");
                    if (!isPathProbe) { hasNonPath = true; break; }
                  }

                  // CHECKER: build final list with Path rule
                  var exprs = [];
                  var seenPathKeys = Object.create(null);

                  for (var p in byPath) {
                    if (!Object.prototype.hasOwnProperty.call(byPath, p)) continue;
                    var it2 = byPath[p];
                    if (!it2) continue;

                    var expr = it2.expr;
                    if (!expr || expr === "__NO_EXPRESSION__") continue;

                    var mm   = String(it2.matchName || "");
                    var cls  = String(it2.classification || "");
                    var isPath = (cls === "ShapePath") || (mm === "ADBE Vector Shape");

                    if (isPath) {
                      // ALLOW Path if:
                      //  A) no non-Path expressions exist, OR
                      //  B) this Path was directly picked (pickedIsLeaf true), OR
                      //  C) pickedMatchName explicitly equals ADBE Vector Shape
                      var allowPath =
                        (!hasNonPath) ||
                        !!it2.pickedIsLeaf ||
                        (String(it2.pickedMatchName || "") === "ADBE Vector Shape");

                      if (!allowPath) continue;

                      // DEDUPE: guard against multiple entries with the same Path key
                      if (seenPathKeys[p]) continue;
                      seenPathKeys[p] = true;
                    }

                    exprs.push(String(expr));
                  }

                  if (!exprs.length) {
                    Holy.UI.toast("No expression on the selected property");
                    return;
                  }

                  var joined = exprs.join("\n");
                  Holy.EXPRESS.EDITOR_insertText(joined);

                  Holy.UI.toast(
                    "Loaded " +
                    exprs.length +
                    " expression" +
                    (exprs.length > 1 ? "s" : "") +
                    " from selection"
                  );
                } catch (e) {
                  console.error("Load From Selection failed:", e);
                  Holy.UI.toast("Failed to load from selection");
                }
              });
            });
          }













































          /*
          // ==========================================================
          // GLOBAL: JSX Log Relay  🧠 moved up for single registration
          // ==========================================================
          Holy.UI.cs.addEventListener("com.holyexpressor.log", (event) => {
            try {
              const data = event.data;
              console.log("[JSX LOG]", data);
            } catch (err) {
              console.warn("[LOG HANDLER ERROR]", err);
            }
          });
          */


          // ==========================================================
          // GLOBAL: JSX Log Relay 💬 (emoji-safe)
          // ==========================================================
          Holy.UI.cs.addEventListener("com.holyexpressor.log", (event) => {
            try {
              const decoded = decodeURIComponent(event.data || "");
              console.log("[JSX LOG]", decoded);
            } catch (err) {
              console.warn("[LOG HANDLER ERROR]", err);
            }
          });





          // ==========================================================
          // LOAD PATH BUTTON logic  (Lean ↔ Fallback switch)
          // ==========================================================
          window.USE_FALLBACK_DYNAMIC_PATH = false;

          const loadPathBtn = document.getElementById("loadPathFromSelectionBtn");
          if (loadPathBtn) {
            loadPathBtn.addEventListener("click", function () {
              const useAbs = document.getElementById("useAbsoluteComp")?.checked || false;

              if (!window.USE_FALLBACK_DYNAMIC_PATH) {
                // 💡 Lean builder mode
                console.log("⚙️ Lean path builder will handle this call (dynamic fallback disabled).");

                Holy.UI.cs.evalScript(`he_GET_SelPath_Engage("${useAbs}")`, function (raw) {
                  try {
                    const parsed = JSON.parse(raw || "{}");
                    if (parsed.error) return Holy.UI.toast("JSX error: " + parsed.error);

                    if (parsed.built) {
                      Holy.EXPRESS.EDITOR_insertText(parsed.built);
                      Holy.UI.toast("Lean builder path inserted");
                    } else Holy.UI.toast("No path returned from lean builder");
                  } catch (err) {
                    console.error("Lean builder parse error:", err, raw);
                    Holy.UI.toast("Parse error");
                  }
                });

              } else {
                // 💡 Fallback (MapMaker-based) mode
                console.groupCollapsed("⚙️ Running fallback dynamic path builder");
                Holy.UI.cs.evalScript(`he_U_getSelectedPaths("${useAbs}")`, function (raw) {
                  try {
                    const parsed = JSON.parse(raw);
                    console.log("%c[interactive]", "color:#03A9F4;font-weight:bold;");
                    console.dir(parsed);

                    // --- Safe extract built paths ---
                    let builtStr = "";
                    if (parsed.built) builtStr = parsed.built;
                    else if (parsed.debug?.builtPaths)
                      builtStr = parsed.debug.builtPaths.join("\n");

                    if (builtStr) {
                      Holy.EXPRESS.EDITOR_insertText(builtStr);
                      console.log(
                        "%c[Inserted built string]",
                        "color:#9C27B0;font-weight:bold;",
                        builtStr
                      );
                    } else Holy.UI.toast("No built string returned");
                  } catch (e) {
                    console.error("Parse fail:", e, raw);
                    Holy.UI.toast("Parse error");
                  }
                  console.groupEnd();
                });
              }
            }); // ← end click handler
          }






            /* ============================
              TOGGLE: CUSTOM SEARCH BOX
              ============================ */
            var customToggle = Holy.UI.DOM("#useCustomSearch");
            var customBox = Holy.UI.DOM("#customSearch");
            var targetBox = Holy.UI.DOM("#TargetBox");
            if (customToggle && customBox && targetBox) {
              customToggle.addEventListener("change", function () {
                if (customToggle.checked) {
                  customBox.disabled = false;
                  targetBox.style.opacity = "0.5";
                  targetBox.style.pointerEvents = "none";
                } else {
                  customBox.disabled = true;
                  customBox.value = "";
                  targetBox.style.opacity = "1";
                  targetBox.style.pointerEvents = "auto";
                }
              });
            }

            /* ============================
              RELOAD BUTTON
              ============================ */
            var reloadBtn = Holy.UI.DOM("#reloadPanel");
            if (reloadBtn) {
              reloadBtn.addEventListener("click", function () { location.reload(); });
            }

            var reloadSettingsBtn = Holy.UI.DOM("#reloadPanelSettings");
            if (reloadSettingsBtn) {
              reloadSettingsBtn.addEventListener("click", function () { location.reload(); });
            }



            /* ============================
              DEVTOOLS BUTTON
              ============================ */
            var devBtn = Holy.UI.DOM("#openDevtools");
            if (devBtn) {
              devBtn.addEventListener("click", function () {
                try { Holy.UI.cs.openURLInDefaultBrowser("http://localhost:6904"); } catch (e) {}
              });
            }

          }







// ======================================
//  Apply Report Helper (backward-compatible)
// Accepts updateApplyReport(result)  or  updateApplyReport(title, result)
// ======================================
function updateApplyReport(arg1, arg2) {
  var title = (arguments.length === 2 && typeof arg1 === "string") ? arg1 : "";
  var data  = (arguments.length === 2 && typeof arg1 === "string") ? arg2 : arg1;

  var entry = formatApplyLogEntry(title, data);
  if (!entry) entry = "[No apply data]";

  applyLogEntries.push(entry);

  var box = document.getElementById("applyReport");
  if (box) {
    box.textContent = entry;
  }

  renderApplyLogWindow();
}





// ---------------------------------------------------------
// 🚀 MODULE EXPORT
// ---------------------------------------------------------
Holy.BUTTONS = {
  cs: cs,
  HX_LOG_MODE: HX_LOG_MODE,
  wirePanelButtons: wirePanelButtons,
  updateApplyReport: updateApplyReport,
  openApplyLogWindow: openApplyLogWindow
};

})();
