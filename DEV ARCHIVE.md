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
