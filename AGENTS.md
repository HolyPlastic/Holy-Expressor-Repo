# ⚙️ Holy Expressor — Agents Reference (V2)

## 🧭 Purpose

Defines how AI agents interact with the **Holy Expressor** After Effects CEP extension.
Covers load order, namespace conventions, and runtime communication so generated code always integrates safely.
Humans may ignore this file.

---

## 🧩 1. Project Architecture Overview

* CEP extension for **Adobe After Effects**.
* Runtime stack:

  * CEP JavaScript (front end)
  * ExtendScript (JSX back end)
  * CSInterface bridge between them
  * CodeMirror editor embedded for expression input
* No ESModules / bundler / imports — **plain JavaScript** + global namespace (`Holy`).

---

## 🧱 2. Load Order & Execution Chain

Scripts load sequentially from `index.html`; each is an **IIFE** attaching exports to `Holy`.

```
json2.js
main_UTILS.js
main_FLYO.js
main_MENU.js
main_UI.js
main_EXPRESS.js
main_BUTTON_LOGIC_1.js
main_SNIPPETS.js
main_DEV_INIT.js
main.js
```

### Rules

* **json2.js** → must load first (ExtendScript JSON polyfill).
* **main_UTILS.js + main_UI.js** → foundation modules, must load before dependents.
* **main_DEV_INIT.js** → **true bootstrap**; loads JSX, initializes UI + CodeMirror.
* **main.js** → legacy placeholder (do not modify).
* New modules → insert before `main_DEV_INIT.js` and export via `Holy`.

---

## 🔗 3. Global Namespace Pattern (`Holy`)

Each module wraps itself in an IIFE and exports through `Holy`.

```js
if (typeof Holy !== "object") Holy = {};
(function () {
  "use strict";
  // internal logic
  Holy.UI = { cs, initTabs, toast };
})();
```

### Rules

* Always attach with `Holy.<ModuleName> = { … }`.
* Never assign to `window` or create global vars.
* Expose only what other modules need.
* Check `if (typeof Holy !== "object")` before assignment.

### Access

```js
Holy.UTILS.cy_getThemeVars();
Holy.EXPRESS.HE_applyByStrictSearch();
Holy.MENU.contextM_disableNative();
```

---

## 🧠 4. CEP ↔ JSX Communication

### Bridge

Uses Adobe’s CSInterface API:

```js
var cs = new CSInterface();
cs.evalScript("hostFunctionName(arguments)");
```

### Runtime Path

1. CEP JS calls `evalScript()`
2. JSX executes inside After Effects
3. Result returns via callback

### JSX Load Sequence

Handled by `main_DEV_INIT.js → loadJSX()`:

```
host_UTILS.jsx
host_MAPS.jsx
host_GET.jsx
host_APPLY.jsx
host_DEV.jsx
host_FLYO.jsx
host.jsx
```

Maintain this order if editing `loadJSX()`.

---

## 📡 5. Event Bus (System Events)

Internal communication uses DOM or CSInterface events.

* Register listeners via `window.addEventListener()` or `cs.addEventListener()`.
* Custom events follow namespace `com.holy.expressor.*`.
* Known examples:

  * `com.holyexpressor.debug` → host → panel debug messages
  * `com.holy.expressor.applyLog.update` → sync events

Agents may add new events under the same namespace.

---

## ⚙️ 6. Development Conventions

### General

* Pure vanilla JS, IIFE isolation.
* Exports only to `Holy`.
* Preserve `index.html` script order.
* Wrap risk operations in `try/catch`.

### Logging Rules

* Use `console.log()` → visible **only in Chrome DevTools**.
* After Effects’ old JS console is deprecated / inaccessible.
* Do not write to `$.writeln()` or AE Console targets.
* `HX_LOG_MODE` (`"verbose"` or `"quiet"`) controls log density; read from `window.HX_LOG_MODE`.

### Safety

* Never modify `CSInterface.js` or `json2.js`.
* Avoid blocking dialogs or sync alerts in CEP context.

---

## 🧩 7. Module Overview (CEP Side)

| Module                 | Responsibility                     |
| ---------------------- | ---------------------------------- |
| main_UTILS.js          | Utility + I/O helpers              |
| main_UI.js             | DOM binding + CSInterface creation |
| main_MENU.js           | Context menu management            |
| main_EXPRESS.js        | Expression + CodeMirror logic      |
| main_BUTTON_LOGIC_1.js | Button → JSX handlers              |
| main_SNIPPETS.js       | Snippet buttons + preset logic     |
| main_DEV_INIT.js       | Bootstrap (init UI + load JSX)     |
| main_FLYO.js           | Deprecated Electron bridge         |
| main.js                | Legacy placeholder                 |

---

## 🧩 8. Module Overview (JSX Side)

| Module         | Responsibility                |
| -------------- | ----------------------------- |
| host_UTILS.jsx | Logging and error wrappers    |
| host_MAPS.jsx  | Property mappings             |
| host_GET.jsx   | Retrieves AE selection / data |
| host_APPLY.jsx | Applies expressions           |
| host_DEV.jsx   | Dev utilities                 |
| host_FLYO.jsx  | Deprecated                    |
| host.jsx       | Root coordinator              |

---

## 🚫 9. Deprecated Elements

| Component                            | Status          | Notes                         |
| ------------------------------------ | --------------- | ----------------------------- |
| flyo/**                              | Archived        | Electron prototype            |
| flyo_RENDERER.js & electron_entry.js | Legacy          | Safe to ignore if encountered |
| main_FLYO.js                         | Obsolete        | Kept for reference            |
| main.js                              | Legacy          | Do not extend                 |
| helpers/**                           | Old dev scripts | Not loaded in CEP             |

---

## 🧩 10. Appendix — Reference Schemas

### A. Holy Object Tree (typical)

```js
Holy = {
  UTILS: {},
  UI: {},
  MENU: {},
  EXPRESS: {},
  SNIPPETS: {},
  BUTTONS: {},
  DEV_INIT: {}
};
```

### B. UI Initialization Sequence

```
Holy.UI.initTabs()
→ Holy.EXPRESS.initPresets()
→ Holy.BUTTONS.wirePanelButtons()
→ Holy.SNIPPETS.init()
```

---

## ✅ 11. Agent Directives (Summary)

1. Respect the global namespace (`Holy`).
2. Preserve script order when adding files.
3. Avoid Node / Electron / import syntax.
4. Use DevTools for logs — AE console is deprecated.
5. Follow event namespacing `com.holy.expressor.*`.
6. Document exports clearly at file end.
7. Do not touch archived flyo modules.

---

## 🧩 12. Current Development Era
 ### 12.1 Objective
  Develop quickpanel that shows snippet buttons/banks and main apply button. 
  Updates in real time betrween the quickpanel and main panel if changes are made to snippets/banks.
 
 ### 12.2 Active Quirks / Known Behaviors
  **Quick Panel Bootstrap Timing**
  * The quick access panel (`quickpanel.html`) now includes `main_DEV_INIT.js` to load the JSX stack when opened standalone.
  * Current behavior: panel requires a short focus cycle (~1–2 s) before first button press executes correctly. Second press then works normally.
  * Cause: timing gap during CSInterface and JSX bridge initialization on cold start.
  * Status: non-blocking; logged for optimization.
  * Future agents: investigate a lightweight readiness check or deferred `loadJSX()` trigger to ensure first interaction is valid.

---

## 🪶 Agent Notes Directive

- Every agent must add a short, factual entry to the **🪶⛓️ Dev Notes** section of `AGENTS.md` when finishing a task.  
- Each note should summarise what changed or was discovered — **1 to 3 sentences max**.  
- Include the **date** and **agent ID** (e.g. `2025-10-30 – gpt-5-codex:`).  
- If **no functional change** occurred, record: “no functional change – analysis only.”  
- If a **functional change** occurred, also include:  
  - **Design Intent:** One sentence describing the goal of the change.  
  - **Risks / Concerns:** One line noting any potential issues or trade-offs (only if applicable).  
- Notes are **append-only** — never edit or remove earlier entries.  
- These notes serve as the **active working log**. Once a change is approved or merged, maintainers or Archival Agents may migrate the entry into the official development timeline file.  

---

## 🪶⛓️ Dev Notes

* 2025-10-29 – gpt-5-codex: Added quick panel host-bridge priming helper (see `js/quickpanel.js`) to eagerly load JSX modules and verify readiness on open. Includes timed retries alongside existing cold-start recovery.
* 2025-10-29 – gpt-5-codex: Introduced `Holy.State` shared persistence layer syncing expression and toggle state between panels; see `js/main_STATE.js`.

* 2025-10-29 – lead-dev: **Quick Panel & LiveSync Development Cycle Summary**

  **Summary:**
  Focused on resolving Quick Panel blank-load behaviour, double-click requirement, and missing LiveSync updates between panels. Investigation confirmed root cause tied to CEP panel caching and incomplete event propagation rather than logic faults.

  **Phase 1 – Initialization / Visibility**

  * Verified Quick Panel loaded but appeared blank on first open, only rendering on second click.
  * Confirmed all scripts present; added “TESTING” markup to prove DOM injection.
  * Identified asynchronous CEP load timing as core issue.

  **Phase 2 – Cache / Double-Click Issue**

  * Cleared AE + CEP caches, renamed extension folder, retested.
  * Behaviour consistent: blank first open, visible second open.
  * Determined CEP spawns before DOM bindings initialize; full reinit only on second call.

  **Phase 3 – Rehydration / Focus Handling**

  * Added focus-based listener to auto-reload panel state.
  * `[Holy.State] Panel refocused → rehydrating state` confirmed firing but without UI updates.

  **Phase 4 – Warm-Wake Self-Heal**

  * Introduced delayed self-check (`setTimeout`) to detect blank panels and rerun `Holy.SNIPPETS.init()`.
  * Panel redraws after short delay but still requires second trigger for full focus chain.

  **Phase 5 – Holy.State Integration**

  * Implemented shared persistence + CEP event broadcast across panels.
  * Expected two-way sync between Main and Quick panels; partial success.

  **Phase 6 – Testing / Verification**

  * State save confirmed; cross-panel events not received.
  * Focus logs consistent; CEP broadcast scope suspected.
  * UI updates only after manual reload → persistence OK, propagation missing.

  **Phase 7 – Diagnostics / Logging**

  * Expanded logs for dispatch / listener / rehydration.
  * ExtendScript logs confirmed invisible to DevTools; JS-side only.
  * “Initialized for panel” logs appear only during startup.

  **Current Status**
  ✅ Persistence working
  ✅ Warm-Wake & Focus triggers logging
  ⚠️ Quick Panel blank on first open
  ⚠️ LiveSync not cross-firing
  ⚠️ UI not auto-refreshing post-edit

  **Next Priorities**

  * Fix initial blank-panel / double-click requirement before further sync work.
  * Confirm broadcast scope, panel identity, and delayed render handshake.

  **Research-backed Notes**
  *Common causes of blank CEP panels and verified approaches:*

  * **Initialization timing / DOM delay** → Delay UI rendering until `DOMContentLoaded` + small timeout.
  * **CEPHtmlEngine cold start** → Programmatically trigger focus / resize / reflow after open.
  * **Browser engine / syntax mismatch** → Check JS + CSS compatibility for target AE CEP version.
  * **Cached instance persistence** → Kill `CEPHtmlEngine.exe` or rename extension folder for clean load.
  * **Visibility / paint issues** → Force repaint via CSS toggle or reflow (`offsetHeight` hack).

  **Recommended Test Order**
  1️⃣ Force UI init after short delay (300–800 ms).
  2️⃣ Trigger focus / reflow on open.
  3️⃣ Validate syntax compatibility.
  4️⃣ Purge cached instances.
  5️⃣ Check for hidden DOM / paint layer issues.

* 2025-10-29 – gpt-5-codex: Added readiness gating and repaint fallback in quick panel bootstrap to eliminate blank-first-open/double-click behaviour. Design Intent: Defer quick panel init until Holy modules are ready and force a repaint when the snippet row fails to draw. Risks / Concerns: Polling timeout now proceeds with degraded init, so monitor for cases where modules never hydrate and UI still stalls.
* 2025-10-30 – gpt-5-codex: Hardened quick panel paint verification with layout retries, warm-wake fallbacks, and state reload to surface snippets on the first open. Design Intent: Detect collapsed snippet rows and keep re-rendering/repainting until layout reports a non-zero height. Risks / Concerns: Extra retries and reloads may add minor startup delay or hide deeper lifecycle issues if the root cause persists.



---

✅ **Agents.md is the single source of truth** for module behavior and load rules.
If conflicts arise, assume this file overrides individual code comments.

---
