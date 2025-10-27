if (typeof Holy !== "object") Holy = {};

(function () {
  "use strict";

  // 🔗 Shared instances
  var cs = new CSInterface();
  var HX_LOG_MODE = window.HX_LOG_MODE || "verbose";








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

            /* ============================
              TOGGLE: APPLY REPORT VISIBILITY
              ============================ */
            var toggleReport = Holy.UI.DOM("#toggleReport");
            if (toggleReport) {
              toggleReport.addEventListener("change", function (e) {
                const box = document.getElementById("applyReportContainer");
                box.style.display = e.target.checked ? "block" : "none";
              });
            }
          }







// ======================================
//  Apply Report Helper (backward-compatible)
// Accepts updateApplyReport(result)  or  updateApplyReport(title, result)
// ======================================
function updateApplyReport(arg1, arg2) {
  const box = document.getElementById("applyReport");
  const container = document.getElementById("applyReportContainer");
  if (!box || !container) return;

  const toggle = document.getElementById("toggleReport");
  container.style.display = (toggle && toggle.checked) ? "block" : "none";
  if (!toggle || !toggle.checked) return;

  var title = (arguments.length === 2 && typeof arg1 === "string") ? arg1 : "";
  var data  = (arguments.length === 2 && typeof arg1 === "string") ? arg2 : arg1;

  try {
    var parsed = (typeof data === "string") ? JSON.parse(data) : (data || {});
    if (!parsed.ok) {
      box.textContent = "Error: " + (parsed.err || "Unknown");
      return;
    }

    var errs = parsed.errors;
    if (errs && !Array.isArray(errs)) errs = [errs];

    var lines = [];
    if (title) lines.push(title);
    lines.push("Applied: " + (parsed.applied || 0));
    lines.push("Skipped: " + (parsed.skipped || 0));
    if (errs && errs.length) {
      lines.push("Errors:");
      for (var i = 0; i < errs.length; i++) {
        var e = errs[i] || {};
        lines.push("- " + (e.path || "?") + " -> " + (e.err || String(e)));
      }
    }
    box.textContent = lines.join("\n");
  } catch (e) {
    box.textContent = "Failed to parse report";
  }
}





// ---------------------------------------------------------
// 🚀 MODULE EXPORT
// ---------------------------------------------------------
Holy.BUTTONS = {
  cs: cs,
  HX_LOG_MODE: HX_LOG_MODE,
  wirePanelButtons: wirePanelButtons,
  updateApplyReport: updateApplyReport
};

})();