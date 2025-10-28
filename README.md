🕸️ Holy Expressor — CEP Extension Spine Summary
🧭 Project Overview

Holy Expressor is a modular After Effects CEP extension that enables building, editing, and applying expressions directly inside AE’s interface.
It uses a structured JS↔JSX bridge via Adobe CSInterface, and a CodeMirror-based editor for inline expression editing, snippet management, and property targeting.

🎯 Primary Goals

Simplify complex expression workflows

Consolidate expression logic and UI in one system

Replace repetitive scripting with reusable modular functions

⚙️ Current Focus

✅ Stable CEP + ExtendScript stack

⚙️ Modular JS↔JSX communication fully operational

💾 Electron & SDK layers archived

🧱 Active development focused on the CEP runtime and expression modules

🔗 For full module rules, load order logic, and export structure, see Agents.md
.

🗂️ Core Folder & File Map
📄 Root

index.html — Main CEP panel container (loads all CSS/JS modules and defines DOM).
.debug/ — Dev flags and test data.
.vscode/ — VS Code config.
assets/ — Icons, SVGs, and UI graphics.
css/ — Layout, glow, and theme variables.
fonts/ — Typefaces for UI and CodeMirror.
CSXS/ — CEP manifest folder (manifest.xml).
jsx/ — ExtendScript layer running in AE.
js/ — CEP-side logic and UI modules.

🎨 /css/

styles.css — Core layout and theme styling.

codemirror_styles.css — CodeMirror syntax and gutter overrides.

🧠 /CSXS/

manifest.xml — CEP configuration defining host apps and extension ID.

⚙️ /js/

json2.js — JSON polyfill for legacy AE engines.

main_UTILS.js — Core utilities and file/variable helpers.

main_FLYO.js — Deprecated Electron bridge (reference only).

main_MENU.js — Context menu and right-click logic.

main_UI.js — DOM wiring and CSInterface creation.

main_EXPRESS.js — Expression and CodeMirror operations.

main_BUTTON_LOGIC_1.js — Button interaction logic.

main_SNIPPETS.js — Snippet button and preset system.

main_DEV_INIT.js — Bootstrapper: loads JSX modules, initializes UI, activates CodeMirror.

main.js — Legacy placeholder, unused.

🧩 /js/codemirror/

codemirror-bundle.js — CodeMirror core build.

codemirror-init.js — Initialization and DOM mount.

🧱 /js/libs/

CSInterface.js — Adobe CEP bridge for JS↔AE communication.

🧩 /jsx/

host.jsx — Root ExtendScript controller for all AE commands.

/Modules/ — Modular host scripts for utilities, mapping, property retrieval, apply actions, and dev tools.

🔄 Execution Flow

index.html loads all JS modules sequentially →
main_DEV_INIT.js initializes the JSX bridge via CSInterface.evalScript() →
UI and CodeMirror activate once all modules register under the global Holy namespace.

🔧 Verified Load Order (2025)
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

🧱 Deprecated Components
Folder / File	Status	Notes
/flyo/	❌ Archived	Early Electron prototype
main_FLYO.js	❌ Obsolete	Reference only
helpers/	❌ Legacy	Dev scripts not used in CEP
main.js	⚠️ Placeholder	Retained for compatibility
🧭 Summary

Holy Expressor is a modular CEP-based After Effects extension centered on maintainable, expression-driven workflows.
Electron, SDK, and legacy components are retired.
All active development focuses on the CEP runtime and the CodeMirror-powered editor.