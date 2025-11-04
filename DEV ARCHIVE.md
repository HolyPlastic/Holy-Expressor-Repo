# 🕸️ DEV_TIMELINE.md — Project Chronicle

⚠️ **Access Rules**  
This file serves as the official Holy Expressor project chronicle.  
It records design intent, architectural evolution, and key development milestones.  

Only agents explicitly authorized as Archival Agents may modify anything outside the Development Timeline section.

---

## 📜 Development Timeline
---
---
---


## ⚗️ QUICK PANEL LOAD ISSUE ERA

The quick panel was not loading on first click, instead just a blank window.  
Ultimately it was the wrong type in manifest, but plenty was done along the way before we realized that.

---

### 🪶⛓️ Dev Notes

**2025-10-29 – gpt-5-codex:**  
Added quick panel host-bridge priming helper (see `js/quickpanel.js`) to eagerly load JSX modules and verify readiness on open.  
Includes timed retries alongside existing cold-start recovery.



**2025-10-29 – gpt-5-codex:**  
Introduced `Holy.State` shared persistence layer syncing expression and toggle state between panels.  
See `js/main_STATE.js`.



**2025-10-29 – lead-dev:**  
**Quick Panel & LiveSync Development Cycle Summary**  

**Summary:**  
Focused on resolving Quick Panel blank-load behaviour, double-click requirement, and missing LiveSync updates between panels.  
Investigation confirmed root cause tied to CEP panel caching and incomplete event propagation rather than logic faults.

#### Phase 1 – Initialization / Visibility
- Verified Quick Panel loaded but appeared blank on first open, only rendering on second click.  
- Confirmed all scripts present; added “TESTING” markup to prove DOM injection.  
- Identified asynchronous CEP load timing as core issue.

#### Phase 2 – Cache / Double-Click Issue
- Cleared AE + CEP caches, renamed extension folder, retested.  
- Behaviour consistent: blank first open, visible second open.  
- Determined CEP spawns before DOM bindings initialize; full reinit only on second call.

#### Phase 3 – Rehydration / Focus Handling
- Added focus-based listener to auto-reload panel state.  
- `[Holy.State] Panel refocused → rehydrating state` confirmed firing but without UI updates.

#### Phase 4 – Warm-Wake Self-Heal
- Introduced delayed self-check (`setTimeout`) to detect blank panels and rerun `Holy.SNIPPETS.init()`.  
- Panel redraws after short delay but still requires second trigger for full focus chain.

#### Phase 5 – Holy.State Integration
- Implemented shared persistence + CEP event broadcast across panels.  
- Expected two-way sync between Main and Quick panels; partial success.

#### Phase 6 – Testing / Verification
- State save confirmed; cross-panel events not received.  
- Focus logs consistent; CEP broadcast scope suspected.  
- UI updates only after manual reload → persistence OK, propagation missing.

#### Phase 7 – Diagnostics / Logging
- Expanded logs for dispatch / listener / rehydration.  
- ExtendScript logs confirmed invisible to DevTools; JS-side only.  
- “Initialized for panel” logs appear only during startup.

**Current Status:**  
✅ Persistence working  
✅ Warm-Wake & Focus triggers logging  
⚠️ Quick Panel blank on first open  
⚠️ LiveSync not cross-firing  
⚠️ UI not auto-refreshing post-edit

**Next Priorities:**  
- Fix initial blank-panel / double-click requirement before further sync work.  
- Confirm broadcast scope, panel identity, and delayed render handshake.

**Research-backed Notes**  
Common causes of blank CEP panels and verified approaches:
- Initialization timing / DOM delay → Delay UI rendering until DOMContentLoaded + small timeout.  
- CEPHtmlEngine cold start → Programmatically trigger focus / resize / reflow after open.  
- Browser engine / syntax mismatch → Check JS + CSS compatibility for target AE CEP version.  
- Cached instance persistence → Kill CEPHtmlEngine.exe or rename extension folder for clean load.  
- Visibility / paint issues → Force repaint via CSS toggle or reflow (offsetHeight hack).

**Recommended Test Order:**  
1️⃣ Force UI init after short delay (300–800 ms).  
2️⃣ Trigger focus / reflow on open.  
3️⃣ Validate syntax compatibility.  
4️⃣ Purge cached instances.  
5️⃣ Check for hidden DOM / paint layer issues.

---

**2025-10-29 – gpt-5-codex:**  
Added readiness gating and repaint fallback in quick panel bootstrap to eliminate blank-first-open/double-click behaviour.  
**Design Intent:** Defer quick panel init until Holy modules are ready and force a repaint when the snippet row fails to draw.  
**Risks / Concerns:** Polling timeout now proceeds with degraded init, so monitor for cases where modules never hydrate and UI still stalls.

---

**2025-10-30 – gpt-5-codex:**  
Hardened quick panel paint verification with layout retries, warm-wake fallbacks, and state reload to surface snippets on the first open.  
**Design Intent:** Detect collapsed snippet rows and keep re-rendering/repainting until layout reports a non-zero height.  
**Risks / Concerns:** Extra retries and reloads may add minor startup delay or hide deeper lifecycle issues if the root cause persists.

---

**2025-10-30 – gpt-5-codex:**  
Added host-bridge readiness fencing and a double-RAF paint kick so the quick panel renders after the CEP bridge is live and snippet rows report height before binding handlers.  
**Design Intent:** Ensure initial open waits for bridge readiness and forces a fresh paint to avoid blank loads.  
**Risks / Concerns:** Bridge polling timeout falls back to degraded init, so persistent bridge failures may still need manual intervention.

---

**2025-10-29 – gpt-5-codex:**  
Added QuickPanel DOM Timing Trace (`DOMContentLoaded` / `load` / `focus` / `timeout`) to diagnose initialization order on cold start.  
No functional change.

---

**2025-10-30 – gpt-5-codex:**  
Added `ensureHostReady()` loop in `main_UI.js` to delay QuickPanel launch until host environment is confirmed.  
Resolves white/gray blank panel issue on first click.  
Polyfill omission (`json2.js`) may cause legacy AE compatibility issues.

---

## 🧩 2025-10-30 – Quick Panel Compositor Attach Fix (Final)

### 🎯 Summary
Resolved the long-standing Quick Panel blank-on-first-open bug in Holy Expressor.  
Root cause identified as an After Effects **compositor attach race** within CEPHtmlEngine on cold start.  
Panel now initializes correctly on first open using **manifest-level timing control (`AutoVisible` / `Modeless`)**, eliminating all previous repaint and refresh hacks.

---

### 🧠 Background
The Quick Panel consistently opened blank on the first click (white after cache purge, gray thereafter) and required a second click to appear.  
Logs always showed:
- DOM fully rendered and measurable  
- Bridge primed and modules loaded  
- No errors  

Despite that, AE failed to composite the panel surface on the first launch.

---

### 🔬 What We Tried (Chronologically)

| Stage | Attempt | Result |
|-------|----------|--------|
| 1 | Bridge priming + retry timers | ✅ Executed; no change |
| 2 | Double-RAF repaint kick | ✅ No change |
| 3 | Visibility toggle & reflow | ✅ No change |
| 4 | Host readiness verification loop | ✅ Host was already ready |
| 5 | JS resize & transform nudge | ✅ No change |
| 6 | `cs.resizeContent(width, height)` | ✅ Logged, no visual effect |
| 7 | `app.refreshUI()` via ExtendScript | ✅ Logged, no visual effect |
| 8 | Auto close + reopen logic | ✅ Executed, still blank |
| 9 | Flow plugin analysis (see below) | 💡 Led to manifest-level hypothesis |

---

### 📚 Flow Plugin Research
Examined Flow’s CEP bundle to compare its working multi-panel system:

- Flow’s **Preferences panel** uses `ModalDialog` with `AutoVisible=true`  
- Flow’s **Main panel** is also `AutoVisible`, ensuring both surfaces are bound at startup  
- AE therefore composites their windows before any script calls `requestOpenExtension()`  

**Takeaway:** Flow avoids the attach race entirely by letting AE pre-spawn the compositor surfaces at boot.

---

### ⚙️ Changes Implemented
**Updated `manifest.xml` for `com.holy.expressor.quickpanel`:**


<AutoVisible>true</AutoVisible>
<Type>Modeless</Type>
<Geometry>
  <Size>
    <Width>400</Width>
    <Height>300</Height>
  </Size>
</Geometry>
Removed obsolete repaint logic from main_UI.js:

window.dispatchEvent("resize")

transform reflow logic

cs.resizeContent()

app.refreshUI()

Trimmed warm-wake recovery and retry code from quickpanel.js
Simplified to a single ensureHostReady() call + normal requestOpenExtension()
Added early <style> background in HTML to eliminate white flash.

✅ Outcome
✅ Quick Panel now attaches instantly on first open (no blank/white states)

✅ Works non-blocking with Modeless window type

✅ Geometry respected; no modal blocking

✅ All redundant compositor-poke code removed

🗒️ Notes
Root cause was AE creating CEP window logic before compositor bind.

AutoVisible=true ensures early compositor surface initialization.

ModalDialog also fixed it but blocks host UI — replaced by Modeless.

Panel type still functional but retains title chrome and brief flash.

Keep single install per Extension ID; duplicates can reintroduce race.

## ⚗️ END OF QUICK PANEL LOAD ISSUE ERA <3
---
---

## 🧠 TRUTH SUMMARY LOGS
### Date Unknown – Snippet Application Failure Investigation (Condensed)
_chronology uncertain_
The Holy Expressor CEP extension investigation opened with the user directing an agent to inspect the Holy-Expressor-Repo, specifically noting the importance of consulting README.md and AGENTS.md before touching code. The repository hosts a multi-panel After Effects workflow in which snippet buttons trigger ExtendScript via CSInterface bridges. Early in the session the snippet interface existed and appeared responsive, yet clicking any snippet surfaced a toast reading “Snippet error: Apply failed,” and no actionable diagnostics surfaced in the console. Initial context also confirmed the plugin architecture—JavaScript front end, JSX back end, global Holy namespace—and established that snippet banks had recently been standardized to three fixed buttons created automatically per bank after prior customization work.

Attention first centered on front-end regressions when DevTools captured an exception: `Uncaught TypeError: Cannot read properties of undefined (reading 'show')` traced to `main_SNIPPETS.js:522`. The bug emerged because new toast-handling code attempted to use `Holy.TOAST.show`, a namespace path that no longer existed in the runtime. The fix swapped these direct calls with a new `toastApplyError()` helper that guards against missing modules and falls back to `Holy.UI.toast`. After the patch, the TypeError vanished, confirming the wrapper correctly insulated the UI layer from undefined references. Despite the absence of console errors, the toast persisted, signaling the failure originated deeper in the pipeline.

Further logging expanded visibility into the CSInterface call sequence. `main_SNIPPETS.js` reported “sending to ExtendScript: holy_applySnippet(1)” followed immediately by “response from ExtendScript: string” and “Apply failed: empty or ‘fail’ response.” These logs established that the bridge function executed but returned only the literal word “string,” which the JavaScript callback treated as a falsy payload. Because the handler expects a concrete success token, empty string, or JSON, the meaningless response triggered the error toast every time. The captured behavior confirmed the snippet apply machinery—button listener, CSInterface dispatch, toast fallback—remained intact; the failure had shifted to either ExtendScript execution or the integrity of the return value.

The agent outlined several hypotheses, clearly marked as unverified, for why `holy_applySnippet` might yield an unusable response. Possibilities included the JSX bundle not loading (`host_APPLY.jsx` absent from the session), the function name having changed without corresponding JS updates, missing return statements inside the ExtendScript routine, or JavaScript misinterpreting the callback results. The reasoning favored a JSX load issue because `main_DEV_INIT.js` orchestrates host script loading, and any disruption could leave the bridge stub defined but unimplemented. However, without direct access to After Effects logs or ExtendScript console output, the theory remained speculative and properly tagged as such.

To test whether the function was even defined in the host context, the agent recommended running `cs.evalScript("typeof(holy_applySnippet)", console.log)` from DevTools. This diagnostic would instantly reveal if ExtendScript recognized the function or if the load sequence failed earlier. Executing the suggestion surfaced another barrier: `Uncaught ReferenceError: cs is not defined`. The panel’s JavaScript encapsulated its `CSInterface` instance within module scope, preventing DevTools from referencing `cs` globally. The agent clarified that the panel likely instantiates `var cs = new CSInterface();` during initialization but never assigns it to `window`, so the DevTools context cannot reach it. The temporary remedy was to execute `window.cs = new CSInterface();` manually before reissuing the diagnostic command.

No follow-up evidence confirmed whether the `typeof` probe succeeded, leaving the ExtendScript status unresolved. Consequently, the investigation concluded with the system still emitting the failure toast after each snippet click, DevTools showing the bridge returning the placeholder string, and no proof that `holy_applySnippet` executes to completion. The verified facts captured the flow: UI inputs fire correctly, the JavaScript bridge issues calls, the response path equates an empty or invalid payload with failure, and the toast mechanism surfaces that state. Outstanding uncertainties include the actual load state of `host_APPLY.jsx`, the return contract expected by the snippet apply function, and whether recent architectural changes altered the bridge handshake. Further progress requires validating the host script loading sequence and ensuring `holy_applySnippet` returns a definitive success token recognizable by the JavaScript layer.

### Date Unknown – Express/Rewrite Mode Redesign (Condensed)
_chronology uncertain_
The Holy Expressor conversation opened with the main panel already hosting a functional Express editor and a Search-and-Replace utility, each backed by buttons that swapped DOM sections inside `#expressArea`. The user’s new goal was a compact, typographic toggle that mimicked design mockups showing “Express ▸ Rewrite” rendered as text flanking a diamond divider. The existing layout still contained large panel buttons, and although the switching logic worked, the older controls consumed space and clashed visually with the latest theme. The user supplied two diamond SVG snippets, requested the `fill` attribute rely on `currentColor`, and insisted the control live inside `expressArea` so CodeMirror and ancillary overlays remained siblings in the DOM.

Initial experiments replaced the button bar with custom markup containing `<div class="modeSwitchBar f18-c">` and button elements labelled Express and Rewrite. However, the JavaScript still pointed to legacy IDs (`tab-express`, `tab-search`). When the original buttons were removed, the new controls stopped toggling because `main_UI.js` listeners were bound to the old IDs. The fix was to reuse the historical identifiers on the new elements, restoring the event bridge without rewriting the controller. Once the ID alignment was handled, the mode toggles triggered again, but visual regressions followed. The diamond indicator, expected to change color according to the active mode, remained gray after the markup moved. CSS rules driving the color states targeted `.express-active .diamond-left` and `.rewrite-active .diamond-right` under the `#expressArea` selector. Relocating the buttons outside that container broke the descendant selectors, so the assistant recommended either reverting the elements back into `expressArea` or adjusting the selectors. Stripping the `#expressArea` prefix did not immediately help because the class toggles still occurred on that container. Ultimately, the markup stayed inside `expressArea`, preserving the original CSS cascade.

After syncing the markup and selectors, the next issue appeared when the Rewrite view left Express controls visible. Although the toggle updated button styling, it never hid the entire Express block. Investigation showed `applyModeState(isExpress)` already contained logic to add `.express-active` and `.rewrite-active` classes, so the helper was expanded with `expressArea.style.display = isExpress ? "" : "none";`. A merge conflict surfaced because two branches modified the same function: one retained the old behavior while the other introduced the display toggle. The user manually removed the conflict markers and kept the version containing the display line. With that applied, rewriting triggered a clean handoff where Express content fully disappeared, and the user confirmed the corrected state (“Cool, I did that. And that worked.”).

Attention shifted to the editor’s maximize control. The button previously sat inline and borrowed the generic `button {}` styling, causing it to inherit padding and chrome inconsistent with the overlay style used elsewhere. The requirement was to float the maximize toggle like `.express-editor-overlay` while keeping it inside `#expressArea` so scripting logic continued to query it with `expressArea.querySelector`. A DevTools inspection exposed that `.btn-discreet` failed to override the base `button` rule, so the assistant suggested introducing `all: unset;` (followed by explicit resets) within `.btn-discreet` to neutralize the inherited properties without disturbing other button variants. Although the CSS changes were only proposed in discussion, the plan established a clear route: absolutely position the maximize button and rely on `currentColor` for theme coherence.

Finally, the user wanted the textual arrow glyphs inside `#editorMaximizeBtn` replaced with an inline SVG arrow. They provided markup for a bidirectional chevron composed of 18-point lines and a diamond center, reiterating that stroke attributes should be removed in favor of `fill="currentColor"`. The agent composed a Codex-ready prompt, detailing the DOM replacement steps, DOM targets, and SVG cleanup instructions while promising not to alter CSS. The session closed with the Express/Rewrite toggle functioning, Express content hidden when Rewrite is active, and a design plan in place to modernize the maximize button. Outstanding tasks involve executing the CSS reset, floating the button overlay, and embedding the supplied SVG, but the structural groundwork for the panel redesign is now verified and recorded.
