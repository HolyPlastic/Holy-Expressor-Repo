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

## 13. Architecture Deductions
### A. Structural Unknowns
* state sync — [unknown-structure] — The event broadcast path connecting Holy.State instances in the main and quick panels is undocumented, leaving cross-window listener scope undefined.
* quick spawn — [unknown-structure] — It remains unverified whether `cs.requestOpenExtension("com.holy.expressor.quickpanel")` launches a new CEPHtmlEngine process or reuses an existing instance.
* quick dom — [unknown-structure] — The quick panel’s first-load DOMContentLoaded timing relative to CEP readiness is unproven, so initial script execution order remains uncertain.
* ui parity — [unclear-decision] — The strategic reason for mirroring the main panel’s snippet DOM inside the quick panel has not been recorded.
* focus scope — [unclear-decision] — The choice to register focus and rehydration listeners inside specific IIFEs rather than globally lacks documented rationale.
* doc resolver — [assumed-behaviour] — Current fixes assume `cy_resolveDoc()` always returns the active CEP document, but no multi-window validation confirms that behavior.
* snippets init — [assumed-behaviour] — Recovery routines presume repeated `Holy.SNIPPETS.init()` calls are idempotent despite no verification against duplicate bindings.
* warm timer — [assumed-behaviour] — The warm-wake timeout window is treated as safe across hosts without measured benchmarks for slower environments.
* BRIDGE WIRING — [unknown-structure] — The explicit wiring between snippet button handlers in `main_SNIPPETS.js` and the host-side `holy_applySnippet()` routine lacks a documented dependency chain covering CSInterface scope and readiness.
* CSINTERFACE SCOPE — [assumed-behaviour] — Runtime assumptions state that a `CSInterface` instance is created during panel load, yet no specification clarifies whether that instance should be globally accessible.
* JSX LOAD — [unknown-structure] — Precise JSX load order enforcement after `main_DEV_INIT.js` runs remains undocumented, so the availability timing of `holy_applySnippet` is uncertain.
* RETURN CONTRACT — [unknown-structure] — The expected return payload for `holy_applySnippet()` is undefined; current behavior reveals the JavaScript layer cannot distinguish success from an arbitrary string response.
* SNIPPET ROUTING — [assumed-behaviour] — Snippet application is presumed to invoke both control reapply and expression bridges, but the conditions selecting `holy_applyControlsJSON` versus `holy_applySnippet` remain unverified.
* TOAST API — [unclear-decision] — The transition from `Holy.TOAST.show` to `Holy.UI.toast` lacks a recorded rationale, leaving ambiguity over whether the change reflects a permanent API shift or temporary fallback.
* TOAST FEEDBACK — [assumed-behaviour] — Toast notifications are treated purely as client-side status indicators without confirmed mapping to host success codes.
* MODE SWITCH WIRING — [unknown-structure] — Event bindings that connect the historical `tab-express` and `tab-search` identifiers to the new Express/Rewrite buttons are only partially documented, leaving the dependency chain inside `main_UI.js` unclear.
* SVG THEME CASCADE — [unknown-structure] — The inheritance path that feeds `currentColor` values into diamond and icon SVG elements is not charted, so the propagation of palette variables across nested containers remains uncertain.
* MODE STATE INVOCATION — [unknown-structure] — The runtime trigger points for `applyModeState()` (initialization versus click handlers) are unstated, making its activation sequence ambiguous.
* TAB LOGIC RESIDUAL — [unclear-decision] — No rationale explains why legacy tab-switch logic stays resident in `main_UI.js` after the visual tab bar was removed, resulting in overlapping state controllers.
* EXPRESS VISIBILITY — [assumed-behaviour] — It is presumed that toggling `#expressArea` with `display: none` leaves CodeMirror and event listeners unaffected, but no verification confirms downstream stability.
* OVERLAY POSITIONING — [assumed-behaviour] — Overlay buttons are believed to rely solely on CSS absolute positioning without JavaScript layout adjustments, yet no evidence confirms that assumption for every overlay variant.
* COLORPICKER SPAWN — [unknown-structure] — The exact API responsible for opening the color picker window (direct `window.open` versus `cs.requestOpenExtension`) lacks documentation on parameters and lifecycle.
* STATE PERSISTENCE — [unknown-structure] — References to “roaming” settings imply an existing persistence store, but its file paths, schema, and access layer are still undefined.
* DERIVED VARS — [unknown-structure] — `window.updateDerivedVariables()` executes during theme changes without a recorded contract outlining arguments or side effects.
* COLOR SYNC — [unclear-decision] — Maintaining both the `cs.addEventListener('holy.color.change')` binding and a secondary listener block remains unexplained, leaving redundancy motives unclear.
* PANEL GLOBALS — [assumed-behaviour] — Cross-window access to globals such as `window.updateDerivedVariables` is presumed to work despite CEP isolation, yet no proof confirms this sharing model.
* BOOT ORDER — [unknown-structure] — The startup sequencing between style bootstrapping, derived variable hydration, and persisted state replay is undocumented, obscuring timing guarantees.
* COMPOSITOR-ATTACH — [unknown-structure] — CEP compositor binding sequence within After Effects is undocumented; the timing and dependency graph controlling when a panel becomes visually paintable remain unknown.  
* COMPOSITOR-ATTACH — [unknown-structure] — Relationship between `requestOpenExtension()` and compositor initialization phase is undefined; no API specifies the precise moment a surface binds.  
* MANIFEST-DEFAULTS — [unclear-decision] — Adobe provides no rationale for defaulting `<AutoVisible>` to false on auxiliary panels; intent may be UX or legacy template inheritance.  
* MANIFEST-MODELESS — [unclear-decision] — Choice to retain `<Type>Modeless</Type>` post-fix was justified only to prevent modal blocking; long-term UX rationale undocumented.  
* COMPOSITOR-BIND — [assumed-behaviour] — `AutoVisible=true` is assumed to pre-bind GPU surfaces at startup though no formal confirmation exists.  
* REPAINT-REMOVAL — [assumed-behaviour] — Removal of resize/reflow logic is assumed safe; long-session stress not verified.  
* MODELESS-SPAWN — [unknown-structure] — CEP internal algorithm for modeless window coordinates is unexposed; presumed Chromium defaults. 
* GEOMETRY-WORKSPACE — [unknown-structure] — Timing and mechanism for AE saving panel geometry to workspace files remain undocumented.  
* JS-API-BLOCK — [unclear-decision] — Blocking of `window.moveTo()` and related APIs lacks explicit reasoning; likely sandbox security.  
* GEOMETRY-OVERRIDE — [assumed-behaviour] — Believed that workspace metadata overrides manifest geometry on reopen, but unverified by logs.  
* DEBUG-MAPPING — [unknown-structure] — CEP’s internal merge rules between `.debug` file entries and `--remote-debugging-port` flags are undefined.  
* DEBUG-FAILURE — [assumed-behaviour] — Quick Panel’s missing port activation is assumed to stem from absent ID in `.debug`, not engine fault.  



### B. Established Architectural Facts
* state storage — [confirmed-mechanism] — Both the main and quick panels independently load and persist `banks.json` after snippet or bank edits.
* quick panel — [confirmed-mechanism] — The first quick panel activation opens a blank UI, while a second activation repaints the snippet interface without restarting.
* focus wake — [confirmed-mechanism] — Focus listeners fire `Holy.State` rehydration logs yet do not trigger immediate DOM changes in the quick panel.
* cache reset — [confirmed-mechanism] — Clearing CEP caches or renaming the extension directory leaves the double-click requirement unchanged.
* runtime split — [confirmed-mechanism] — Main and quick panels operate in isolated CEP JavaScript contexts with no shared globals or localStorage.
* load order — [established-pattern] — Quick panel initialization follows the sequence CEP boot → script registration → focus rehydration → `Holy.SNIPPETS.init()`.
* dom timing — [established-pattern] — The blank-first-load symptom indicates scripts execute before the DOM is ready during the initial CEP spawn.
* warm wake — [established-pattern] — Warm-wake timers re-run `Holy.SNIPPETS.init()` when layout checks detect missing snippet markup.
* module layout — [permanent-decision] — Separate module files (`main_UI.js`, `main_SNIPPETS.js`, `quickpanel.js`, etc.) remain the chosen architecture instead of a shared runtime bundle.
* cs bridge — [permanent-decision] — The extension continues to rely exclusively on Adobe’s CSInterface bridge without supplemental relay layers.
* doc helper — [permanent-decision] — Refactoring DOM access through `cy_resolveDoc()` and scoped `doc` variables is retained as the standard multi-window safeguard.
* BRIDGE DISPATCH — [confirmed-mechanism] — Snippet apply actions dispatch `cs.evalScript("holy_applySnippet(index)")` calls from `main_SNIPPETS.js` into the ExtendScript layer.
* BRIDGE RESPONSE — [confirmed-mechanism] — An empty or non-successful ExtendScript response propagates back to JavaScript as the literal `"string"`, triggering the “Snippet error: Apply failed” toast branch.
* CSINTERFACE SCOPE — [confirmed-mechanism] — DevTools access lacks an exposed `cs` reference unless the panel explicitly binds `CSInterface` to `window`, demonstrating module-level encapsulation of the bridge instance.
* TOAST INDEPENDENCE — [confirmed-mechanism] — Toast feedback operates independently of console logging; the UI reports failures even when the console is silent.
* SNIPPET PIPELINE — [established-pattern] — Snippet processing follows a consistent pipeline: UI button → JavaScript handler → `cs.evalScript` bridge → JSX executor.
* FAILURE SIGNALING — [established-pattern] — Failure-handling logic centers on evaluating the ExtendScript return payload; absent or invalid results always surface via toast rather than silent failure.
* SNIPPET BANKS — [permanent-decision] — Each snippet bank now initializes with exactly three immutable snippet slots, disallowing runtime addition or removal.
* GLOBAL NAMESPACE — [permanent-decision] — The project persists in using the global `Holy.<MODULE>` namespace structure across modules as an intentional architectural choice.
* MODE SWITCH STATE — [confirmed-mechanism] — `applyModeState(isExpress)` manages mode toggling by updating Express/Rewrite classes and setting `expressArea.style.display` to hide the inactive panel.
* DIAMOND COLORS — [confirmed-mechanism] — `.express-active` and `.rewrite-active` classes drive the active-state fill changes for `.diamond-left` and `.diamond-right` elements on the mode switch.
* BUTTON CASCADE — [confirmed-mechanism] — The base `button {}` selector supplies default styling, so modifiers like `.btn-discreet` inherit those rules unless they explicitly override each property.
* PANEL CLASS TOGGLING — [established-pattern] — UI mode transitions are handled by adding or removing classes on `#expressArea` instead of rebuilding DOM fragments.
* OVERLAY PLACEMENT — [established-pattern] — Overlay controls, including maximize and quick-action buttons, remain children of `#expressArea` even when visually floated with absolute positioning.
* SVG COLOR SYSTEM — [established-pattern] — Inline SVG controls throughout the panel use `fill: currentColor` so their appearance tracks global theme variables.
* THEME PARITY — [permanent-decision] — Mode switch elements share the same `currentColor` palette as neighboring controls to maintain cohesive styling between Express and Rewrite views.
* EXPRESS CONTAINER — [permanent-decision] — `#expressArea` continues to anchor the editor, overlays, and mode buttons, confirming its role as the central structural container.
* COLOR EVENTS — [confirmed-mechanism] — Theme updates broadcast through `holy.color.change` CEP events and supplementary `window.postMessage` payloads that carry `{hex: "#xxxxxx"}` objects.
* EVENT PARSE — [confirmed-mechanism] — Main-panel handlers must treat `evt.data` as JSON text and only parse when `typeof evt.data === 'string'` to avoid `Unexpected token o` errors.
* CEP STORAGE — [confirmed-mechanism] — Each CEP window owns an isolated `localStorage`, preventing the color picker from sharing persisted data with the main panel.
* HUE SLIDER — [confirmed-mechanism] — The custom hue slider depends on `-webkit-appearance: none` for its gradient to render inside the CEP Chromium runtime.
* THEME CASCADE — [established-pattern] — Color application funnels through resetting the root `--G-color-1` CSS variable and then calling `updateDerivedVariables()` to refresh dependent tokens.
* STATE BRIDGE — [permanent-decision] — Cross-window and cross-session state is standardized on `cs.setPersistentData` / `getPersistentData` rather than `localStorage`.
* TOKEN DESIGN — [permanent-decision] — Visual styles intentionally lean on shared CSS tokens such as `--G-color-1` and opacity variants so runtime changes propagate automatically.
* LISTENER GUARD — [established-pattern] — CEP event listeners wrap in IIFEs with single-run guards (e.g., `if (window.__holyColorSyncAttached__) return;`) to prevent duplicate bindings during reloads.
* COMPOSITOR-FIX — [confirmed-mechanism] — Quick Panel blank-load bug originated from AE compositor attach race; manifest `AutoVisible=true` prevents it.  
* COMPOSITOR-PREBIND — [confirmed-mechanism] — Setting `AutoVisible=true` allocates and binds panel surfaces during AE UI initialization.  
* WINDOW-TYPES — [confirmed-mechanism] — `<Type>Modeless</Type>` allows interaction with AE while open; `<Type>ModalDialog</Type>` blocks host input.  
* MANIFEST-CONTROL — [established-pattern] — Manifest configuration supersedes JS repaint hacks for compositor timing fixes.  
* CSINTERFACE-BRIDGE — [established-pattern] — Cross-panel communication consistently uses CSInterface and DOM events.  
* NAMESPACE-ORDER — [established-pattern] — All modules attach via `Holy.<Module>` under global namespace and load sequentially through `index.html`.  
* COMPOSITOR-STABLE — [permanent-decision] — Quick Panel to remain `<Type>Modeless</Type>` or `<Type>Panel</Type>` with `AutoVisible=true` ensuring stability.  
* REPAINT-LEGACY — [permanent-decision] — Deprecated compositor poke logic must not be restored unless issue resurfaces.  
* SYNC-FOCUS — [permanent-decision] — Development focus transferred to panel synchronization logic once compositor issue closed.  
* GEOMETRY-PANEL — [confirmed-mechanism] — Only `<Type>Panel</Type>` extensions persist geometry in AE workspaces.  
* SANDBOX-RESTRICTION — [confirmed-mechanism] — CEP disables window coordinate APIs for security.  
* WORKSPACE-EXCLUSION — [confirmed-mechanism] — Modeless windows excluded from workspace serialization and reopen centered.  
* HEADER-RENDER — [established-pattern] — Panel headers rendered by AE outside DOM; cannot be hidden or styled.  
* HEADER-BLEND — [established-pattern] — Developers simulate frameless look with color-matched overlay bars.  
* QUICKPANEL-CONFIG — [permanent-decision] — Quick Panel manifest uses `<AutoVisible>true</AutoVisible>` with `<Type>Panel</Type>` for persistence.  
* MANIFEST-COMPATIBILITY — [established-pattern] — Verified manifest attributes conform to CEP 9.0 and AEFT `[13.0,99.9]`.  
* GEOMETRY-OVERRIDE — [confirmed-mechanism] — AE ignores manifest size when workspace data exists.  
* DEBUG-MULTIPORT — [confirmed-mechanism] — `.debug` supports multiple simultaneous ports if IDs match manifests.  
* CSS-CASCADE — [established-pattern] — Equal-specificity CSS selectors resolve by cascade order; later rules override.  
* USERAGENT-STYLE — [confirmed-mechanism] — Chromium user-agent styles always apply to native form elements; `all:unset` clears them.  
* CSS-ALIGN — [established-pattern] — Absolute positioning for bottom-right alignment uses `position:absolute; bottom:0; right:0;`.  
* MANIFEST-FLAGS — [permanent-decision] — Development builds retain CEF debug flags for visibility (`--enable-nodejs`, `--disable-web-security`, etc.).  








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
* 2025-10-31 – gpt-5-codex: Enabled hidden-layer safe Search & Replace by temporarily revealing layers during batch apply and restoring visibility within a single undo scope. Design Intent: ensure expression replacements reach hidden layers without altering final visibility. Risks / Concerns: Minimal; monitor for layer types without an exposed `enabled` toggle.
* 2025-10-31 – gpt-5-codex: Queued applied properties for post-batch "Reveal Expression" twizzle so users immediately see updated expressions without repeatedly firing menu commands. Design Intent: mirror manual EE reveal only for successful updates. Risks / Concerns: Large selections could still momentarily flash selection highlights; monitor for UI lag on very large batches.
* 2025-11-01 – gpt-5-codex: Added index-safe duplicate-name resolver and post-batch Reveal Expression routine to improve search & replace visibility.
* 2025-11-01 – gpt-5-codex: Added UI-sync delay and timeline focus for reliable visual Reveal Expression twizzling.
* 2025-11-02 – gpt-5-codex: Normalized `.btn-clearSVG` hitboxes by tightening SVG viewBoxes and centralizing stroke width variable. Design Intent: align all clear buttons on consistent stroke sizing with icon-bound click targets. Risks / Concerns: confirm expanded viewBox padding covers hover-scale strokes.

* 2025-11-02 – gpt-5-codex: Floated clear/path/expression load buttons on an overlay anchored to the Express panel. Design Intent: keep quick actions visually attached to the editor while tracking dynamic height changes. Risks / Concerns: Monitor the panel’s `overflow` override for any unexpected bleed with other layered elements.

* 2025-11-04 – gpt-5-codex: no functional change – repositioned architecture deduction subject tags ahead of identifiers per updated formatting guidance.

* 2025-11-03 – gpt-5-codex: Added Theme button and live color picker modal to let users retune `--G-color-1` from the panel footer. Design Intent: expose quick theme tweaks without leaving the Expressor UI. Risks / Concerns: Canvas gradient rendering may tax very old CEP runtimes; watch for pointer-capture quirks on high-DPI displays.

* 2025-11-03 – gpt-5-codex: Introduced Express/Search top-level tabs with hidden-panel CSS to preserve editor state while switching views. Design Intent: Provide a primary toggle between editing and search utilities without reinitializing CodeMirror. Risks / Concerns: Verify hidden panels stay non-interactive so overlays don't accidentally capture clicks.

* 2025-11-03 – gpt-5-codex: Added modeless color picker panel plus shared panel_state persistence for color and quick panels. Design Intent: deliver a floating hue picker with window memory and live theme syncing. Risks / Concerns: CEP may block move/resize persistence on some hosts; monitor for permission warnings.

* 2025-11-03 – gpt-5-codex: Floated the editor maximize control onto a top overlay anchored to the Express panel. Design Intent: keep the maximize toggle accessible without disturbing the panel layout as the editor resizes. Risks / Concerns: Ensure overlay stacking stays clear of future header controls.

* 2025-11-03 – gpt-5-codex: Added fallback `holy_applySnippet` bridge when control loads are disabled. Design Intent: ensure snippets still apply expressions via host bridge when controls aren't requested. Risks / Concerns: Fallback coexists with existing `cy_evalApplyExpression`; monitor for double-apply paths.

* 2025-11-03 – gpt-5-codex: Injected temporary logging around `holy_applySnippet` bridge. Design Intent: capture ExtendScript responses while diagnosing snippet apply failures. Risks / Concerns: Verbose logs until removed.

* 2025-11-04 – gpt-5-codex: no functional change – annotated Section 13 architecture deductions with lowercase tags and subject prefixes for clarity.

🧱 Verified Architectural Notes (2025-11)

The entire codebase operates under a single global namespace:
Holy.<MODULE> (e.g., Holy.SNIPPETS, Holy.EXPRESS, Holy.UTILS).

Each main_*.js file is wrapped in an IIFE that attaches exports to this global namespace.

The front-end (CEP) communicates with the host side (ExtendScript) exclusively through cs.evalScript().

No ESModules, imports, or bundlers are used anywhere in the runtime.

Host-side scripts follow a strict naming convention:

he_P_ → Apply layer functions

he_U_ → Utility layer functions

This naming structure is consistent across all JSX host modules (host_APPLY.jsx, host_UTILS.jsx, host_GET.jsx, etc.).

These points are deductively verified from the codebase and reflect core structural truths of the project.

