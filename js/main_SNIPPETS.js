// V1.4 – Holy.SNIPPETS: uses global Holy.MENU.contextM_menuBuilder utility
// Summary: Delegates context menu positioning and hiding to Holy.MENU.contextM_menuBuilder.
// ---------------------------------------------------------
// 🧩 SNIPPET BANK DEFINITION
// ---------------------------------------------------------
if (typeof Holy !== "object") Holy = {};
if (!Holy.SNIPPETS) Holy.SNIPPETS = {};
Holy.SNIPPETS.banks = [
  {
    id: 1,
    name: "Default",
    snippets: [
      { id: 1, name: "Wiggle", expr: "wiggle(2,20)", controls: {} },
      { id: 2, name: "Loop", expr: "loopOut('cycle')", controls: {} },
      { id: 3, name: "Random", expr: "random(0,100)", controls: {} },
      { id: 4, name: "Ease", expr: "ease(time,0,1,0,100)", controls: {} }
    ]
  },
  {
    id: 2,
    name: "Secondary",
    snippets: [
      { id: 1, name: "Bounce", expr: "n=Math.sin(time*3)*30", controls: {} },
      { id: 2, name: "Blink", expr: "Math.sin(time*10)>0?100:0", controls: {} }
    ]
  }
];




(function () {
  "use strict";

  var cs = new CSInterface();
  var HX_LOG_MODE = window.HX_LOG_MODE || "verbose";


  // V2 – Scoped document resolver for multi-panel safety
  function cy_resolveDoc() {
    try {
      return window.document;
    } catch (e) {
      console.warn("[Holy.SNIPPETS] cy_resolveDoc fallback to window.document", e);
      return document;
    }
  }


  // ---------------------------------------------------------
  // 🧱 Data normalization helpers
  // ---------------------------------------------------------
  function cy_normalizeSnippet(snippet) {
    if (!snippet || typeof snippet !== "object") return null;
    if (typeof snippet.controls !== "object" || snippet.controls === null) {
      snippet.controls = {};
    }
    return snippet;
  }

  function cy_normalizeBanksCollection(banks) {
    if (!Array.isArray(banks)) return;
    banks.forEach((bank) => {
      if (!bank || typeof bank !== "object") return;
      if (!Array.isArray(bank.snippets)) return;
      bank.snippets.forEach(cy_normalizeSnippet);
    });
  }


  // -==-=-++++++*...................((((((((((((((())))>>>>
  // -==-=-+++++++TIME FOR BANK 🏦🪙++++0000((((((((((((((((())))
  // -==-=-++++++🏦🪙🏦🪙🪙🏦🪙🏦🪙++++0000((((((((((((((((())))




  // V1 — multiple banks scaffold
  Holy.SNIPPETS.banks = [
    {
      id: 1,
      name: "Default",
      snippets: [
        { id: 1, name: "Wiggle", expr: "wiggle(2,20)", controls: {} },
        { id: 2, name: "Loop", expr: "loopOut('cycle')", controls: {} },
        { id: 3, name: "Random", expr: "random(0,100)", controls: {} },
        { id: 4, name: "Ease", expr: "ease(time, 0, 1, 0, 100)", controls: {} }
      ]
    }
  ];

  cy_normalizeBanksCollection(Holy.SNIPPETS.banks);

  // active bank pointer
  Holy.SNIPPETS.activeBankId = 1;

  // helper to resolve current bank
  function cy_getActiveBank() {
    const id = Holy.SNIPPETS.activeBankId;
    const b = Holy.SNIPPETS.banks.find(x => x.id === id);
    const fallback = b || Holy.SNIPPETS.banks[0];
    if (fallback && Array.isArray(fallback.snippets)) {
      fallback.snippets.forEach(cy_normalizeSnippet);
    }
    return fallback;
  }
  // 🌍 Make it globally accessible
  window.cy_getActiveBank = cy_getActiveBank;

  // V1.0 – setActiveBank utility
  function cy_setActiveBank(id) {
    const bank = Holy.SNIPPETS.banks.find(b => b.id === id);
    if (!bank) {
      console.warn("[Holy.SNIPPETS] cy_setActiveBank: invalid id", id);
      return;
    }
    Holy.SNIPPETS.activeBankId = id;
    cy_saveBanksToDisk();
    renderBankHeader();
    renderSnippets();
    console.log(`[Holy.SNIPPETS] Active bank switched → ${bank.name}`);
  }

  // expose for cross-module safety
  window.cy_setActiveBank = cy_setActiveBank;


  // V1 — attempt to load user banks from disk
  (function cy_loadBanksFromDisk() {
    try {
      const { file } = Holy.UTILS.cy_getBanksPaths();
      const loaded = Holy.UTILS.cy_readJSONFile(file);
      if (loaded && Array.isArray(loaded.banks) && loaded.banks.length) {
        Holy.SNIPPETS.banks = loaded.banks;
        Holy.SNIPPETS.activeBankId = loaded.activeBankId || loaded.banks[0].id;
        console.log("[Holy.SNIPPETS] Loaded banks from disk:", { count: loaded.banks.length });
      } else {
        // first-run: persist the in-memory defaults
        cy_saveBanksToDisk();
      }
    } catch (e) {
      console.warn("[Holy.SNIPPETS] load banks failed, using defaults", e);
    }
  })();

  cy_normalizeBanksCollection(Holy.SNIPPETS.banks);







  // V1 — persist current banks to disk
  function cy_saveBanksToDisk() {
    const { file } = Holy.UTILS.cy_getBanksPaths();
    const payload = {
      version: 1,
      activeBankId: Holy.SNIPPETS.activeBankId,
      banks: Holy.SNIPPETS.banks
    };
    const res = Holy.UTILS.cy_writeJSONFile(file, payload);
    if (res.err) console.warn("[Holy.SNIPPETS] save banks failed:", res);
    else console.log("[Holy.SNIPPETS] Banks saved:", file);
  }

  // V2.1 — renderBankHeader (scoped DOM-safe version)
  function renderBankHeader() {
    const doc = cy_resolveDoc(); // 🧩 ensure correct document context (main vs quick panel)
    const bank = cy_getActiveBank();

    const labelEl = doc.getElementById("bankNameLabel");
    if (!labelEl) {
      console.warn("[Holy.SNIPPETS] bankNameLabel not found in this panel");
      return;
    }

    labelEl.textContent = bank.name;

    const menu = doc.getElementById("bankSelectMenu");
    if (!menu) {
      console.warn("[Holy.SNIPPETS] bankSelectMenu not found in this panel");
      return;
    }

    menu.innerHTML = "";
    Holy.SNIPPETS.banks.forEach(b => {
      const li = doc.createElement("li");
      const btn = doc.createElement("button");
      btn.textContent = b.name;
      btn.dataset.bankId = b.id;
      li.appendChild(btn);
      menu.appendChild(li);
    });
  }


  function bankBinder() {
    const doc = cy_resolveDoc();
    const labelEl = doc.getElementById("bankNameLabel");
    const selBtn = doc.getElementById("bankSelectBtn");
    const menu = doc.getElementById("bankSelectMenu");

    if (!labelEl || !selBtn || !menu) {
      if (HX_LOG_MODE === "verbose") {
        console.warn("[Holy.SNIPPETS] bankBinder skipped — elements missing", {
          hasLabel: !!labelEl,
          hasButton: !!selBtn,
          hasMenu: !!menu
        });
      }
      return;
    }

    if (!labelEl.dataset.cyRenameBound) {
      labelEl.dataset.cyRenameBound = "1";

      // 🧩 Inline rename behaviour
      labelEl.addEventListener("click", () => {
        const bank = cy_getActiveBank();
        const input = doc.createElement("input");
        input.type = "text";
        input.value = bank.name;
        labelEl.replaceWith(input);
        input.focus();

        input.addEventListener("blur", () => {
          const newName = input.value.trim();
          if (newName) {
            bank.name = newName;
            cy_saveBanksToDisk();
          }
          input.replaceWith(labelEl);
          renderBankHeader();
        });

        input.addEventListener("keydown", (e) => {
          if (e.key === "Enter") input.blur();
        });
      });
    }

    if (!selBtn.dataset.cySelectBound) {
      selBtn.dataset.cySelectBound = "1";

      // 🧩 Bank selection dropdown
      selBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();

        const docCtx = cy_resolveDoc();
        const menuEl = docCtx.getElementById("bankSelectMenu");

        if (!menuEl) {
          console.warn("[Holy.SNIPPETS] bankSelectMenu not found");
          return;
        }

        // rebuild menu dynamically
        menuEl.innerHTML = "";
        Holy.SNIPPETS.banks.forEach(b => {
          const li = docCtx.createElement("li");
          li.style.display = "flex";
          li.style.justifyContent = "space-between";
          li.style.alignItems = "center";

          // name button (select)
          const nameBtn = docCtx.createElement("button");
          nameBtn.textContent = b.name + (b.id === Holy.SNIPPETS.activeBankId ? " ✓" : "");
          nameBtn.dataset.action = "select";
          nameBtn.dataset.bankId = b.id;
          nameBtn.classList.add("bank-name-btn");
          li.appendChild(nameBtn);

          // delete button (only for banks beyond #1)
          if (b.id !== 1) {
            const delBtn = docCtx.createElement("button");
            delBtn.textContent = "−";
            delBtn.title = "Delete bank";
            delBtn.classList.add("menu-side-btn");
            delBtn.dataset.action = "delete";
            delBtn.dataset.bankId = b.id;
            li.appendChild(delBtn);
          }

          menuEl.appendChild(li);
        });

        // divider + new bank
        const divider = docCtx.createElement("hr");
        divider.classList.add("menu-divider");
        menuEl.appendChild(divider);

        const liNew = docCtx.createElement("li");
        const btnNew = docCtx.createElement("button");
        btnNew.textContent = "+ New Bank";
        btnNew.dataset.action = "new";
        liNew.appendChild(btnNew);
        menuEl.appendChild(liNew);

        Holy.MENU.contextM_menuBuilder(e, menuEl, {
          anchorEl: selBtn,
          onSelect: (action, ev) => {
            const target = ev && ev.target;
            const bankId = target ? target.dataset.bankId : undefined;
            contextM_BANKS_actionHandler(action, bankId);
          }
        });
      });
    }
  }



  // __________************++++0000((((((((((((((((())))
  // -==-=-++++++*********endbank***********((((((((((((((())))>>>>



  // V3 — snippet rhombus using flexible width variant
  function createRhombusButton(labelText) {
    const doc = cy_resolveDoc();
    const btn = doc.createElement("button");
    btn.className = "btn-rhombus2-flex f21 snippet-btn";

    btn.innerHTML = `
<div>
 <span class="label">${labelText}</span>
  <div class="rhombus-wrap">
    <svg class="rhombus-left" xmlns="http://www.w3.org/2000/svg"
         viewBox="0 0 7.47 18.58">
      <path d="M7.47,18.08h-3.69c-2.24,0-3.82-2.19-3.11-4.32L4.36,2.74
               c.45-1.34,1.7-2.24,3.11-2.24"
            fill="var(--btn-Rs-fill)" stroke="var(--btn-Rs-stroke)" stroke-miterlimit="10" />
    </svg>

    <svg class="rhombus-mid" xmlns="http://www.w3.org/2000/svg"
         viewBox="0 0 46.8 18.58" preserveAspectRatio="none">
      <rect x="0" y="0" 
            width="100%" height="95%" fill="var(--btn-Rs-fill)" stroke="none" />
      <line x1="0" y1=".5" x2="46.8" y2=".5"
            fill="none" stroke="var(--btn-Rs-stroke)" stroke-miterlimit="10" stroke-width="1" />
      <line x1="0" y1="18.08" x2="46.8" y2="18.08"
            fill="none" stroke="var(--btn-Rs-stroke)" stroke-miterlimit="10" stroke-width="1" />
    </svg>

    <svg class="rhombus-right" xmlns="http://www.w3.org/2000/svg"
         viewBox="0 0 7.47 18.58">
      <path d="M0,.5h3.69c2.24,0,3.82,2.19,3.11,4.32l-3.69,11.02
               C2.66,17.18,1.41,18.08,0,18.08"
            fill="var(--btn-Rs-fill)" stroke="var(--btn-Rs-stroke)" stroke-miterlimit="10" />
    </svg>
  </div>

 
</div>

  `;
    return btn;
  }



  // ---------------------------------------------------------
  // 🧠 Global state
  // ---------------------------------------------------------
  let snippet_ID = null;  // globally tracked active snippet


  function cy_getActiveSnippet() {
    const bank = cy_getActiveBank();
    if (!bank || !Array.isArray(bank.snippets)) return null;
    if (snippet_ID == null) return null;

    const targetId = snippet_ID;
    const activeSnippet = bank.snippets.find((snip) => {
      if (!snip) return false;
      // compare by string to support number ↔ string ids
      return String(snip.id) === String(targetId);
    }) || null;

    if (activeSnippet) cy_normalizeSnippet(activeSnippet);
    return activeSnippet;
  }




  // ---------------------------------------------------------
  // 🧩 Render Snippets 
  // (V4) — Multi-Bank aware + dataset ID + open token tracking
  // ---------------------------------------------------------
  function renderSnippets() {
    const doc = cy_resolveDoc();
    const bar = doc.getElementById("snippetsRow");
    if (!bar) return console.warn("[Holy.SNIPPETS] snippetsRow not found");

    // 🔁 pivot to active bank
    const _bank = cy_getActiveBank();
    const source = _bank?.snippets || [];

    // 🧹 clear previous buttons
    bar.innerHTML = "";

    // 🧱 fail-safe guard
    if (!Array.isArray(source) || source.length === 0) {
      const emptyMsg = doc.createElement("div");
      emptyMsg.textContent = "No snippets in this bank";
      emptyMsg.style.opacity = "0.5";
      emptyMsg.style.fontSize = "12px";
      bar.appendChild(emptyMsg);
      return;
    }

    // 🎨 build each snippet button
    source.forEach((snippet) => {
      cy_normalizeSnippet(snippet);
      const snippetId = snippet.id; // closure-safe capture
      const btn = createRhombusButton(snippet.name);
      btn.dataset.id = snippetId; // keep only this

      // 🖱 Left-click → apply expression
      btn.addEventListener("click", () => {
        const loadCheckbox = doc.getElementById("snipLoadControls");
        const shouldApplyControls = !!(loadCheckbox && loadCheckbox.checked);

        if (shouldApplyControls && cs && typeof cs.evalScript === "function") {
          const idLiteral = typeof snippetId === "number" && isFinite(snippetId)
            ? snippetId
            : JSON.stringify(String(snippetId));

          const jsxCommand = `holy_applyControlsJSON(${idLiteral}, true)`;
          cs.evalScript(jsxCommand, (response) => {
            if (typeof response !== "string" || !response.trim()) {
              console.warn("[Holy.SNIPPETS] Apply Controls returned empty response", response);
              return;
            }

            let payload = null;
            try {
              payload = JSON.parse(response);
            } catch (err) {
              console.warn("[Holy.SNIPPETS] Apply Controls invalid JSON", err, response);
              return;
            }

            if (payload && payload.error) {
              console.warn(`[Holy.SNIPPETS] Apply Controls error for snippet ${snippet.name}:`, payload.error);
              return;
            }

            if (payload && payload.ok) {
              console.log(`[Holy.SNIPPETS] Applied controls for snippet "${snippet.name}"`);
            } else if (payload && payload.skipped) {
              console.log(`[Holy.SNIPPETS] Apply Controls skipped for snippet "${snippet.name}"`);
            }
          });
        } else if (shouldApplyControls) {
          console.warn("[Holy.SNIPPETS] Apply Controls skipped: CSInterface unavailable");
        }

        cy_evalApplyExpression(snippet.expr, (res) => {
          if (Holy.BUTTONS && typeof Holy.BUTTONS.updateApplyReport === "function") {
            Holy.BUTTONS.updateApplyReport(`Snippet: ${snippet.name}`, res);
          }
          if (res && res.ok) Holy.UI.toast(`Applied: ${snippet.name}`);
          else Holy.UI.toast(`Snippet error: ${res?.err || "Apply failed"}`);
        });
      });

      // 🖱 Right-click → open context menu (Edit / Express)
      btn.addEventListener(
        "mousedown",
        (e) => {
          if (e.button !== 2) return;
          e.preventDefault();
          e.stopImmediatePropagation();
          e.stopPropagation();

          const docCtx = cy_resolveDoc();
          const menuEl = docCtx.getElementById("snippetContextMenu");

          if (!menuEl) {
            console.warn("[Holy.SNIPPETS] Context menu element not found");
            return;
          }

          // ✅ store ID BEFORE opening menu
          snippet_ID = snippetId;
          console.log(`[Holy.SNIPPETS] Stored snippet ID ${snippetId}`);

          // 💾 also carry the ID + token via dataset for safer retrieval
          menuEl.dataset.snipId = snippetId;
          menuEl.dataset.token = Date.now();
          console.log(
            `[Holy.SNIPPETS] Menu open token ${menuEl.dataset.token} for ID ${snippetId}`
          );

          // Show the context menu (ensuring the ID remains until menu click)
          Holy.MENU.contextM_menuBuilder(e, menuEl, {
            anchorEl: btn,
            onSelect: (action, ev, menu) => {
              console.log(`[Holy.SNIPPETS] onSelect from menu: ${action}`);
              contextM_SNIPPETS_actionHandler(action);
            }
          });

        },
        true
      );

      bar.appendChild(btn);
    });

    // 💾 persist banks after creation (Patch 4)
    cy_saveBanksToDisk();

    console.log(
      `[Holy.SNIPPETS] Rendered ${source.length} snippets from bank: ${_bank.name}`
    );
  }







  // ---------------------------------------------------------
  // 💾 Save Snippet — Foreground Panel version (multi-bank aware)
  // ---------------------------------------------------------
  document.addEventListener("DOMContentLoaded", () => {
    const doc = cy_resolveDoc();
    const saveBtn = doc.getElementById("saveSnip");

    if (saveBtn) {
      saveBtn.addEventListener("click", () => {
        const name = doc.getElementById("snipName")?.value || "";
        const expr = doc.getElementById("snipExpr")?.value || "";

        const bank = cy_getActiveBank();
        const snip = bank.snippets.find(s => s.id === snippet_ID);

        if (snip) {
          cy_normalizeSnippet(snip);
          snip.name = name.trim() || snip.name;
          snip.expr = expr.trim() || snip.expr;
          renderSnippets();
          Holy.UI.toast(`Snippet updated in bank: ${bank.name}`);
        } else {
          console.warn("[Holy.SNIPPETS] saveSnip: snippet not found");
        }
      });
    } else {
    }
  });




  // ---------------------------------------------------------
  // 💡 Host bridge: apply expression via ExtendScript
  // ---------------------------------------------------------
  function cy_evalApplyExpression(exprText, cb) {
    try {
      var payload = { expressionText: String(exprText || "") };
      var js = 'he_S_SS_applyExpressionToSelection(' + JSON.stringify(JSON.stringify(payload)) + ')';
      cs.evalScript(js, function (res) {
        var out = {};
        try { out = JSON.parse(res || "{}"); } catch (e) { }
        if (typeof cb === "function") cb(out);
      });
    } catch (err) {
      console.error("[Holy.SNIPPETS] eval failed:", err);
      if (Holy.UI && Holy.UI.toast) Holy.UI.toast("Snippet apply failed");
    }
  }

  // ---------------------------------------------------------
  // 💡 Helper: send expression to CodeMirror editor
  // ---------------------------------------------------------
  function cy_sendToExpressArea(exprText) {
    if (!Holy.EXPRESS || !Holy.EXPRESS.EDITOR_insertText) {
      console.warn("[Holy.SNIPPETS] EXPRESS.insertText unavailable");
      return;
    }
    Holy.EXPRESS.EDITOR_insertText(exprText);
    if (Holy.UI && Holy.UI.toast) Holy.UI.toast("Sent to Express Area");
  }















  // ---------------------------------------------------------
  // 💡 Context menu system (delegated to Holy.UTILS)
  // ---------------------------------------------------------


  // ---------------------------------------------------------
  // 🧩 Snippet Edit UI — Foreground Panel version (multi-bank ready)
  // ---------------------------------------------------------
  function openSnippetEditUI(snipId) {
    const bank = cy_getActiveBank();
    const snip = bank.snippets.find(s => s.id === snipId);
    if (!snip) return console.warn("[Holy.SNIPPETS] snippet not found in active bank:", snipId);
    cy_normalizeSnippet(snip);

    // 🪶 Create Foreground Panel dynamically
    const panel = Holy.UTILS.cy_createForegroundPanel("foregroundSnippetEditor", {
      title: `Edit Snippet – ${snip.name}`,

      innerHTML: `
      <div class="snippet-editor-form">
        <label for="fgSnipName">Name</label>
        <input id="fgSnipName" type="text" value="${snip.name}" class="snippet-editor-input">

        <label for="fgSnipExpr">Expression</label>
        <textarea id="fgSnipExpr" class="snippet-editor-textarea">${snip.expr}</textarea>

        <div class="snippet-editor-buttons">
          <button id="fgSaveSnip" class="btn snippet-editor-save">Save</button>
          <button id="fgSaveControls" class="button">Save Controls</button>
          <button id="fgCancelSnip" class="button">Cancel</button>
        </div>
      </div>
    `
    });

    const saveControlsBtn = panel.querySelector("#fgSaveControls");
    if (saveControlsBtn && !saveControlsBtn.dataset.cyBound) {
      saveControlsBtn.dataset.cyBound = "true";
      saveControlsBtn.addEventListener("click", function () {
        const snippetResolver = Holy?.SNIPPETS?.cy_getActiveSnippet;
        if (typeof snippetResolver !== "function") {
          console.warn("[Holy.SNIPPETS] Save Controls aborted: resolver missing");
          return;
        }

        const snippet = snippetResolver();
        if (!snippet) {
          console.warn("[Holy.SNIPPETS] Save Controls aborted: no active snippet");
          return;
        }

        if (!cs || typeof cs.evalScript !== "function") {
          console.warn("[Holy.SNIPPETS] Save Controls aborted: CSInterface unavailable");
          return;
        }

        const rawId = snippet.id;
        if (rawId === undefined || rawId === null) {
          console.warn("[Holy.SNIPPETS] Save Controls aborted: snippet missing id", snippet);
          return;
        }

        const idLiteral = (typeof rawId === "number" && isFinite(rawId))
          ? rawId
          : JSON.stringify(String(rawId));

        const jsxCommand = `holy_captureControlsJSON(${idLiteral})`;

        cs.evalScript(jsxCommand, function (response) {
          if (typeof response !== "string" || !response.trim() || response === "undefined") {
            console.warn("[Holy.SNIPPETS] Save Controls returned empty response", response);
            return;
          }

          let payload = null;
          try {
            payload = JSON.parse(response);
          } catch (err) {
            console.warn("[Holy.SNIPPETS] Save Controls invalid JSON", err, response);
            return;
          }

          if (!payload || typeof payload !== "object") {
            console.warn("[Holy.SNIPPETS] Save Controls returned non-object payload", payload);
            return;
          }

          if (payload.error) {
            console.warn("[Holy.SNIPPETS] Save Controls reported error:", payload.error);
            return;
          }

          snippet.controls = payload;

          if (typeof Holy?.SNIPPETS?.cy_saveBanksToDisk === "function") {
            Holy.SNIPPETS.cy_saveBanksToDisk();
          } else {
            cy_saveBanksToDisk();
          }

          console.log(`[Holy.SNIPPETS] Saved controls for snippet: ${snippet.name}`);
        });
      });
    }

    // 🧩 Retrieve field references
    const nameInput = panel.querySelector("#fgSnipName");
    const exprInput = panel.querySelector("#fgSnipExpr");
    const saveBtn = panel.querySelector("#fgSaveSnip");
    const cancelBtn = panel.querySelector("#fgCancelSnip");

    // ✅ Preserve CodeMirror isolation
    if (exprInput) {
      exprInput.removeEventListener("focus", Holy.EXPRESS?.attachListeners);
      exprInput.removeEventListener("input", Holy.EXPRESS?.EDITOR_insertText);
    }

    // ✅ Prefill + track global ID
    nameInput.value = snip.name;
    exprInput.value = snip.expr;
    snippet_ID = snip.id;

    // 💾 Save handler
    saveBtn.onclick = () => {
      const newName = nameInput.value.trim();
      const newExpr = exprInput.value.trim();
      snip.name = newName || snip.name;
      snip.expr = newExpr || snip.expr;

      renderSnippets();
      // 💾 persist updated bank state to disk (Patch 3)
      cy_saveBanksToDisk();
      panel.remove();
      Holy.UI?.toast?.(`Updated: ${snip.name}`);
      console.log(`[Holy.SNIPPETS] Foreground panel updated snippet →`, snip);
    };

    // ❌ Cancel handler
    cancelBtn.onclick = () => {
      panel.remove();
      console.log(`[Holy.SNIPPETS] Edit cancelled for: ${snip.name}`);
    };

    console.log(`[Holy.SNIPPETS] Foreground edit panel opened for: ${snip.name}`);
  }




















  // ---------------------------------------------------------
  // 💡 Main button wiring
  // ---------------------------------------------------------
  // V2.1 — cy_wireSingleButton (scoped DOM + safe container)
  function cy_wireSingleButton() {
    const doc = cy_resolveDoc(); // 🧩 ensure correct document (main vs quick panel)
    const btn = doc.getElementById("he_snippet_wiggle");
    if (!btn) {
      console.warn("[Holy.SNIPPETS] Wiggle button not found in this panel");
      return;
    }

    // 💡 Left-click → Apply expression immediately
    btn.addEventListener("click", () => {
      const expr = "wiggle(2, 20)";
      cy_evalApplyExpression(expr, (res) => {
        if (Holy.BUTTONS && typeof Holy.BUTTONS.updateApplyReport === "function") {
          Holy.BUTTONS.updateApplyReport("Snippet: wiggle(2, 20)", res);
        }

        if (res && res.ok) {
          Holy.UI?.toast?.("Applied: wiggle(2, 20)");
        } else {
          Holy.UI?.toast?.("Snippet error: " + (res?.err || "Apply failed"));
        }
      });
    });

    // 🖱 Right-click → Show global context menu
    btn.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      e.stopPropagation();

      const menu = doc.querySelector(".context-menu");
      if (!menu) {
        console.warn("[Holy.SNIPPETS] Context menu element not found in this panel");
        return;
      }

      // Use new global utility for consistent alignment
      Holy.MENU.contextM_menuBuilder(e, menu, {
        container: doc.getElementById("snippetsBar"),
        anchorEl: btn,
        onSelect: (action, ev, menuEl) => {
          contextM_SNIPPETS_actionHandler(action);
        },
      });
    });
  }





  // ---------------------------------------------------------
  // ⚡ Context-menu action dispatcher (V3 — multi-bank)
  // ---------------------------------------------------------
  function contextM_SNIPPETS_actionHandler(action) {
    console.log(`[Holy.SNIPPETS] Context action triggered: ${action}`);
    console.log(`[Holy.SNIPPETS] Current stored ID:`, snippet_ID);

    const bank = cy_getActiveBank();

    switch (action) {
      case "edit":
        if (snippet_ID != null) {
          console.log(`[Holy.SNIPPETS] Opening edit UI for ID ${snippet_ID}`);
          openSnippetEditUI(snippet_ID);
        } else {
          console.warn("[Holy.SNIPPETS] No snippet ID stored for edit");
        }
        break;

      case "express": {
        const snip = bank.snippets.find(s => s.id === snippet_ID);
        if (!snip) {
          console.warn("[Holy.SNIPPETS] No snippet found for Express action");
          return;
        }

        cy_normalizeSnippet(snip);

        cy_sendToExpressArea(snip.expr);
        Holy.UI?.toast?.(`Sent ${snip.name} to Express Area (Bank: ${bank.name})`);
        console.log(`[Holy.SNIPPETS] Expressed snippet ${snip.id}: ${snip.expr}`);
        break;
      }

      default:
        console.warn("[Holy.SNIPPETS] Unknown context action:", action);
    }
  }


  // V1.0 – bank context-menu router
  function contextM_BANKS_actionHandler(action, bankId) {
    switch (action) {
      case "select":
        if (!bankId) return;
        cy_setActiveBank(Number(bankId));
        break;

      case "new": {
        const newId = Math.max(...Holy.SNIPPETS.banks.map(b => b.id)) + 1;
        const newBank = {
          id: newId,
          name: `Bank ${newId}`,
          snippets: []
        };

        Holy.SNIPPETS.banks.push(newBank);
        Holy.SNIPPETS.activeBankId = newId;
        cy_saveBanksToDisk();
        renderBankHeader();
        renderSnippets();

        Holy.UI.toast(`Created new bank: ${newBank.name}`);
        console.log(`[Holy.SNIPPETS] Created new bank →`, newBank);
        break;
      }

      case "delete":
        if (!bankId || Number(bankId) === 1) {
          Holy.UI.toast("Bank 1 cannot be deleted");
          break;
        }
        Holy.SNIPPETS.banks = Holy.SNIPPETS.banks.filter(b => b.id !== Number(bankId));
        Holy.SNIPPETS.activeBankId = Holy.SNIPPETS.banks[0].id;
        cy_saveBanksToDisk();
        renderBankHeader();
        renderSnippets();
        Holy.UI.toast("Bank deleted");
        break;


      default:
        console.warn("[Holy.SNIPPETS] Unknown bank menu action:", action);
    }
  }




  // ---------------------------------------------------------
  // ⚡ Context-menu action dispatcher (V3 — multi-bank)
  // ---------------------------------------------------------
  function contextM_SNIPPETS_actionHandler(action) {
    console.log(`[Holy.SNIPPETS] Context action triggered: ${action}`);
    console.log(`[Holy.SNIPPETS] Current stored ID:`, snippet_ID);

    const bank = cy_getActiveBank();

    switch (action) {
      case "edit":
        if (snippet_ID != null) {
          console.log(`[Holy.SNIPPETS] Opening edit UI for ID ${snippet_ID}`);
          openSnippetEditUI(snippet_ID);
        } else {
          console.warn("[Holy.SNIPPETS] No snippet ID stored for edit");
        }
        break;

      case "express": {
        const snip = bank.snippets.find(s => s.id === snippet_ID);
        if (!snip) {
          console.warn("[Holy.SNIPPETS] No snippet found for Express action");
          return;
        }

        cy_normalizeSnippet(snip);

        cy_sendToExpressArea(snip.expr);
        Holy.UI?.toast?.(`Sent ${snip.name} to Express Area (Bank: ${bank.name})`);
        console.log(`[Holy.SNIPPETS] Expressed snippet ${snip.id}: ${snip.expr}`);
        break;
      }

      default:
        console.warn("[Holy.SNIPPETS] Unknown context action:", action);
    }
  }















  // ---------------------------------------------------------
  // 💡 Init (V3 — uses active bank abstraction)
  // ---------------------------------------------------------
    function init() {
      console.log("[Holy.SNIPPETS] init() invoked");

      try {
        rebindQuickAccessUI();
      } catch (err) {
        console.warn("[Holy.SNIPPETS] init → rebindQuickAccessUI failed", err);
      }

      try {
        renderSnippets();
      } catch (err2) {
        console.warn("[Holy.SNIPPETS] init → renderSnippets failed", err2);
      }

    }



  function rebindQuickAccessUI() {
    try {
      bankBinder();
    } catch (err) {
      console.warn("[Holy.SNIPPETS] bankBinder failed during rebind", err);
    }

    try {
      renderBankHeader();
    } catch (err) {
      console.warn("[Holy.SNIPPETS] renderBankHeader failed during rebind", err);
    }
  }

  // ---------------------------------------------------------
  // ⚙️ Activate interactive context menu actions
  // ---------------------------------------------------------
  document.addEventListener("DOMContentLoaded", () => {
    try {
      console.log("[Holy.SNIPPETS] DOMContentLoaded → Context menu actions initialized ✅");
      bankBinder();       // ✅ corrected name — attaches rename + select listeners
      renderBankHeader(); // render menu entries and label
    } catch (err) {
      console.warn("[Holy.SNIPPETS] Context menu init failed:", err);
    }
  });
  // ---------------------------------------------------------
  // 🚀 MODULE EXPORT (Preserve existing Holy.SNIPPETS.bank)
  // ---------------------------------------------------------
  if (!Holy.SNIPPETS) Holy.SNIPPETS = {};

  Holy.SNIPPETS.init = init;
  Holy.SNIPPETS.cy_evalApplyExpression = cy_evalApplyExpression;
  Holy.SNIPPETS.cy_wireSingleButton = cy_wireSingleButton;

  Holy.SNIPPETS.cy_sendToExpressArea = cy_sendToExpressArea;
  Holy.SNIPPETS.openSnippetEditUI = openSnippetEditUI;

  Holy.SNIPPETS.contextM_SNIPPETS_actionHandler = contextM_SNIPPETS_actionHandler;

  Holy.SNIPPETS.renderSnippets = renderSnippets;
  Holy.SNIPPETS.rebindQuickAccessUI = rebindQuickAccessUI;


  Holy.SNIPPETS.cy_getActiveBank = cy_getActiveBank;
  Holy.SNIPPETS.cy_getActiveSnippet = cy_getActiveSnippet;


})();
