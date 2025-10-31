# ⚙️ Holy Expressor — Agents Reference (V3)

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

````

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
````

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

Section currently unused.

---

## 🪶 Agent Notes Directive

* Every agent must add a short, factual entry to the **🪶⛓️ Dev Notes** section of `AGENTS.md` when finishing a task.
* Each note should summarise what changed or was discovered — **1 to 3 sentences max**.
* Include the **date** and **agent ID** (e.g. `2025-10-30 – gpt-5-codex:`).
* If **no functional change** occurred, record: “no functional change – analysis only.”
* If a **functional change** occurred, also include:

  * **Design Intent:** One sentence describing the goal of the change.
  * **Risks / Concerns:** One line noting any potential issues or trade-offs (only if applicable).
* Notes are **append-only** — never edit or remove earlier entries.
* These notes serve as the **active working log**. Once a change is approved or merged, maintainers or Archival Agents may migrate the entry into the official development timeline file.

---

## 🪶⛓️ Dev Notes

* 2025-10-29 - Manifest-level fix confirmed for Quick Panel compositor attach issue. `<AutoVisible>true</AutoVisible>` + `<Type>Modeless</Type>` resolve blank-first-open behaviour. Design Intent: ensure stable compositor binding on AE startup. Risks / Concerns: none observed; monitor over long sessions.
* 2025-10-29 – lead-dev: Current focus shifted to cross-panel snippet/bank synchronization. Next agents to implement shared event-driven sync layer or direct Holy.State persistence mirror between Main and Quick panels.

*pausing syncronisity dev. while we implement snippet controls (sliders etc) saving/loading.

* 2025-10-30 – gpt-5-codex: Added snippet-controls scaffolding and active-snippet helper. Design Intent: normalize snippet records so future AE control snapshots can persist with banks. Risks / Concerns: Monitor for legacy banks missing `id` fields; normalization assumes each record carries a stable identifier.
* 2025-10-30 – gpt-5-codex: Wired Save Controls button to invoke JSX capture stub and persist snippet controls JSON. Design Intent: enable snippet editors to store AE control snapshots ahead of Step 3 host implementation. Risks / Concerns: Depends on upcoming `holy_captureControlsJSON` returning valid payloads; legacy contexts without CSInterface support may warn.

* 2025-10-30 – gpt-5-codex: Implemented ExtendScript capture function for snippet controls returning effect metadata JSON. Design Intent: supply Save Controls pipeline with AE layer effect snapshots; Risks / Concerns: ensure property filter excludes unsupported property types.
* 2025-10-30 – gpt-5-codex: Added control reapply bridge so snippet playback restores saved effects before expressions. Design Intent: honor saved controls when running snippets for full snapshot↔restore loop. Risks / Concerns: repeated runs duplicate effects; consider future dedupe.

* 2025-10-30 – gpt-5-codex: Tightened CodeMirror gutter padding to trim right-side whitespace while nudging numbers off the left edge. Design Intent: balance the editor gutter without breaking dynamic width scaling. Risks / Concerns: Watch for overflowing digits in very long documents.
* 2025-10-30 – gpt-5-codex: Further narrowed gutter padding and extended the active-line highlight to span the gutter width. Design Intent: keep focus styling aligned while halving the right-side gap. Risks / Concerns: Ensure negative gutter margins render cleanly across themes.
* 2025-10-30 – gpt-5-codex: Tightened gutter padding again and replaced the active-line highlight with a full-width pseudo-element. Design Intent: eliminate remaining gutter gap and ensure the focus stripe matches standard rows. Risks / Concerns: Verify pseudo-element layering in legacy themes.

* 2025-10-30 – gpt-5-codex: Swapped the clear-editor control to an inline SVG button tied to theme variables. Design Intent: align the clear control with the new iconography system while keeping existing editor-clear logic intact. Risks / Concerns: None observed; monitor for any theming overrides that expect `.btn-discreet`.

* 2025-10-30 – gpt-5-codex: Replaced the snippets bank selector with a CSS-driven inline SVG using `.btn-clearSVG`. Design Intent: match the dropdown trigger icon to the theme palette without disturbing existing bindings. Risks / Concerns: Verify shared `.btn-clearSVG` rules continue to satisfy other buttons.

* 2025-10-30 – gpt-5-codex: Replaced load-from-selection buttons with inline SVG controls applying existing `.btn-clearSVG` styling. Design Intent: unify loader actions with the themed icon button set without altering behavior. Risks / Concerns: None observed; monitor icon contrast across themes.

---

✅ **Agents.md is the single source of truth** for module behavior and load rules.
If conflicts arise, assume this file overrides individual code comments.

---

* 2025-10-30 – gpt-5-codex: Implemented literal Search & Replace across selected-layer expressions using new Holy.EXPRESS helpers and host batch apply bridge. Design Intent: reuse selection traversal and safe-apply infrastructure for expression rewrites triggered from the panel. Risks / Concerns: Batch updates rely on expression path resolution; unexpected path misses will be reported but skip replacements.
* 2025-10-31 – gpt-5-codex: Extended Search & Replace to walk shape layer contents, added literal-safe quoting, and a match-case toggle. Design Intent: ensure vector properties participate in replacements while providing safer literal substitution controls. Risks / Concerns: Regex-based scanning touches every expression string; watch for slowdowns on very large comps.
* 2025-10-31 – gpt-5-codex: Simplified Search & Replace literal handling and filtered benign AE expression warnings. Design Intent: keep replacements predictable while eliminating noisy "Expression Disabled" logs. Risks / Concerns: Benign-warning filter keys off specific phrases; expand if AE surfaces new wording.
