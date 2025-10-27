Perfect — I see what you mean 👀
Those `### /css/` etc. lines got accidentally wrapped *inside* code blocks because of misplaced triple backticks. I’ve cleaned that up so headers render properly in Markdown and won’t be interpreted as “shell blocks.”

Here’s the **fixed, clean version** — fully readable in GitHub or by AI agents 🧠✨

---

# 🕸️ Holy Expressor — Standalone Spine Summary

## 🧭 Project Overview

*Holy Expressor* is a modular After Effects CEP extension that provides an integrated system for building, editing, and applying expressions directly within AE’s UI.
It uses a structured JS↔JSX bridge, powered by Adobe’s CSInterface, and features a CodeMirror-based editor for inline expression editing, snippet management, and property targeting.

### 🎯 Primary Goals

* Simplify complex expression workflows
* Consolidate panel interactivity and expression logic in one clean interface
* Replace manual scripting repetition with reusable modular logic

### ⚙️ Current State

* ✅ CEP panel fully operational (CodeMirror, UI wiring, JSX bridge stable)
* ⚙️ JSX modules modularized and loaded dynamically
* 💾 Electron & SDK layers deprecated / archived
* 🧱 Project now focused solely on CEP + ExtendScript stack

---

## 🗂️ Core Folder & File Map

📄 index.html  
 Primary CEP panel HTML container. Loads CSS/JS modules and defines the DOM structure for the UI.

📁 .debug/  
 Stores dev flags and temporary environment data. Optional for testing modes.

📁 .vscode/  
 Local editor configuration for VS Code (settings.json, extensions.json).

📁 assets/  
 Icons, SVGs, button graphics used throughout the panel.

📁 cm-build/  
 Placeholder for CodeMirror build outputs. Currently inactive.

📁 css/  
 Global stylesheets controlling layout, colors, and glow effects.

📁 CSXS/  
 CEP manifest folder – defines panel name, version, permissions, and host compatibility.

📁 flyo/  
 Deprecated Electron plug-in files. Retained for historical reference only.

📁 fonts/  
 Typefaces for UI and CodeMirror editor.

📁 helpers/  
 Miscellaneous helper scripts – all legacy, not required for CEP runtime.

📁 js/  
 Core logic for CEP side (UI, snippets, menus, utilities, CodeMirror initialization).

📁 jsx/  
 ExtendScript layer executing inside AE (host logic, apply actions, property queries).

---

### 🎨 /css/

**styles.css**
 Master stylesheet defining Holy Expressor’s visual identity (glow, layout, theme tokens).

**codemirror_styles.css**
 CodeMirror syntax and gutter overrides.

---

### 🧠 /CSXS/

**manifest.xml**
 CEP configuration file defining host app targets, Node JS enablement, and extension ID.

---

### ⚙️ /js/

**json2.js**
 JSON polyfill – must load first for ExtendScript compatibility.

**main_UTILS.js**
 Shared utilities and CSS variable accessors. Used globally by all modules.

**main_UI.js**
 DOM/UI wiring layer – creates CSInterface, connects UI buttons to JSX calls.

**main_DEV_INIT.js**
 Initialization controller. Loads JSX modules via $.evalFile(), boots runtime.

**main_EXPRESS.js**
 Core expression logic – handles CodeMirror input, apply actions, and expression operations.

**main_SNIPPETS.js**
 Builds dynamic snippet buttons and presets.

**main_MENU.js**
 Manages contextual menus and right-click functions.

**main_BUTTON_LOGIC_1.js**
 Connects button interactions to JSX actions.

**main.js**
 Central bootstrap placeholder – now minimal, kept for structure consistency.

**main_FLYO.js**
 Deprecated Electron bridge – do not load.

---

### 🧩 /js/codemirror/

**codemirror-bundle.js**
 The bundled CodeMirror core (syntax, highlighting, etc.).

**codemirror-init.js**
 Initializes and embeds CodeMirror into the panel.

---

### 🧱 /js/libs/

**CSInterface.js**
 Adobe CEP communication bridge. Required for JS↔AE evaluation calls.

---

### 🧩 /jsx/

**host.jsx**
 Root ExtendScript controller – receives all commands from JS side.

**/jsx/Modules/**
 Submodules loaded via main_DEV_INIT.js. Defines modular AE actions.

---

### 🧩 /jsx/Modules/

**host_UTILS.jsx**
 Shared logging, error handling, safety wrappers.

**host_MAPS.jsx**
 Defines property matching and mapping structures.

**host_GET.jsx**
 Retrieves AE data (selected layers, properties, etc.).

**host_APPLY.jsx**
 Executes property modifications and expression applications.

**host_DEV.jsx**
 Testing utilities and mock actions.

**host_FLYO.jsx**
 Deprecated Electron plug-in script.

---

## 🔄 Execution Flow Overview

Panel launches → `index.html` loads → `main_UI.js` + `main_DEV_INIT.js`
Initialization → `main_DEV_INIT.js` runs `loadJSX()` → sequentially loads `/jsx/Modules/`
Bridge activated → `CSInterface.evalScript()` sends AE commands to `host.jsx`
AE executes → Each `host_*.jsx` handles its specific action or return data
UI updates → Returned data updates UI state and CodeMirror editor

---

## 🔧 Load Order (Critical Path)

```
json2.js → main_UTILS.js → main_UI.js → main_DEV_INIT.js → JSX Modules → main.js
```

---

## 🧾 Legacy / Deprecated

**/flyo/**
 Old Electron-based flyover system.

**main_FLYO.js**
 Obsolete bridge logic, retained for reference only.

**/helpers/launch_flyover.bat**
 Legacy Windows launcher for Electron prototype.

---

## 📊 Current Stability Snapshot

| Category       | Status     | Notes                                                       |
| -------------- | ---------- | ----------------------------------------------------------- |
| CEP Core       | ✅ Stable   | Fully functional CodeMirror + JSX bridge.                   |
| JSX Modules    | ⚙️ Mature  | Load sequence verified, minor encoding issue in APPLY logs. |
| Electron / SDK | ❌ Retired  | Not used in current build.                                  |
| Documentation  | 🧩 Partial | Standalone spine maintained for reference.                  |

---

## 🧭 Summary Statement

Holy Expressor’s CEP system is fully functional as an After Effects extension and currently serves as the core platform for all development.
All Electron and C++ SDK materials have been archived, with focus now exclusively on maintaining a modular, high-stability CEP runtime and refining expression logic modules.


