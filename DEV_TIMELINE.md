# 🕸️ **DEV_TIMELINE.md — Project Chronicle**

## ⚠️ Access Rules

> This file serves as the **official Holy Expressor project chronicle**.
> It records design intent, architectural evolution, and key development milestones.
>
> * Only agents explicitly authorized as **Archival Agents** may modify anything outside the **Development Timeline** section.
> * All other agents (standard coding agents) may **only append new entries** to the **Development Timeline** when instructed or as part of an approved task.
> * Entries must be **non-destructive and append-only** — no edits or deletions to prior history.
> * Each entry should include:
>
>   * **Date + Title**
>   * **Design Intent** (one sentence)
>   * **3 – 6 bullet points** summarizing technical actions or outcomes
>   * **Next Target** (one line)
>   * **Risks / Concerns** (one line)
>
> If a new development supersedes or invalidates an earlier one, the entry should explicitly reference the prior date/title and note the change.

---

## 🧭 Project Overview

Holy Expressor is a modular After Effects CEP extension that enables building, editing, and applying expressions directly inside AE’s UI.
It connects CEP (JavaScript) and ExtendScript (JSX) through Adobe CSInterface, with a CodeMirror-powered editor for real-time expression editing and snippet management.
Development focuses on a lightweight, modular CEP + ExtendScript stack; all Electron and SDK components have been archived.

---

## 📜 Development Timeline  *(append-only section)*

### 2025-10-28 — Quick Panel Reconstruction

**Design Intent:** Enable the quick-access panel to operate independently of the main panel while sharing Holy modules.

* Rebuilt quick panel HTML to load core Holy modules and render Snippet Bank.
* Initial omission of `main_DEV_INIT.js` identified by Codex P1 badge.
* Established baseline for standalone quick panel operation.
  **Next Target:** Integrate `main_DEV_INIT.js` for full JSX bootstrapping.
  **Risks / Concerns:** Standalone panel may fail to load host JSX if opened before the main panel.

---

### 2025-10-29 — Host-Bridge Priming

**Design Intent:** Eliminate first-click latency by pre-loading the ExtendScript stack.

* Added quick panel host-bridge priming helper to eagerly load JSX modules.
* Introduced timed retries during cold-start recovery.
* Verified readiness of ExtendScript bridge before first interaction.
  **Next Target:** Merge priming with unified load sequence for both panels.
  **Risks / Concerns:** Polyfill omission (`json2.js`) may cause legacy AE compatibility issues.

---

### 2025-10-29 — Shared State Layer

**Design Intent:** Persist and synchronize editor and toggle states between panels.

* Added `Holy.State` module for JSON-based state persistence.
* Hooked main panel and CodeMirror editor into shared state layer.
* Loaded state listener in quick panel for one-way sync and event rebroadcast.
* Documented new module in `AGENTS.md`.
  **Next Target:** Implement real-time bidirectional sync (`feature/state-sync-v2-realtime`).
  **Risks / Concerns:** Disk write frequency and event duplication under heavy use.

---

## 🔮 Forward Trajectory

* **Short Term:** Real-time cross-panel sync, expand `Holy.State` coverage, integrate better event throttling.
* **Mid Term:** Build developer-visible logging for state changes.
* **Long Term:** Evolve Holy Expressor into a base framework for all Holy-series tools.

---

## 🪶 Archival Notes

This section may be expanded **only by an Archival Agent**.
It captures design philosophy, major directional shifts, or context that transcends individual code changes.

---

