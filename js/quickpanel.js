console.log("[QuickPanel] Reload check: ", new Date().toLocaleTimeString());
location.reload(true);

(function () {
  "use strict";

  if (typeof window.Holy !== "object" || window.Holy === null) {
    window.Holy = {};
  }

  function safeNewCSInterface() {
    try {
      return new CSInterface();
    } catch (err) {
      console.warn("[QuickPanel] CSInterface unavailable", err);
      return null;
    }
  }

  function readIndexHTML(cs) {
    return new Promise(function (resolve, reject) {
      if (!cs || typeof cs.getSystemPath !== "function") {
        return reject(new Error("CSInterface unavailable for path lookup"));
      }

      if (!window.cep || !window.cep.fs || typeof window.cep.fs.readFile !== "function") {
        return reject(new Error("CEP FS API unavailable"));
      }

      try {
        var root = cs.getSystemPath(SystemPath.EXTENSION);
        if (!root) {
          throw new Error("extension path not resolved");
        }

        var normalized = (root + "/index.html").replace(/\\/g, "/");
        var result = window.cep.fs.readFile(normalized);
        if (result.err) {
          throw new Error("fs.readFile error " + result.err);
        }

        resolve(result.data || "");
      } catch (err) {
        reject(err);
      }
    });
  }

  function loadSourceHTML(cs) {
    return readIndexHTML(cs).catch(function (fsErr) {
      console.warn("[QuickPanel] CEP fs read failed, falling back to fetch", fsErr);
      return fetch("index.html").then(function (res) {
        if (!res.ok) {
          throw new Error("HTTP " + res.status);
        }
        return res.text();
      });
    });
  }
// V TEST — cloneSnippetsMarkup (disabled snippet prep so panel can render)
function cloneSnippetsMarkup(cs) {
  try {
    // ✅ Test-only: clear body and show a visible button
    console.log("[QuickPanel] Test mode active — showing button only");

    const mount = document.body; // use entire body as target
    mount.innerHTML = ""; // clear any leftover markup

    const btn = document.createElement("button");
    btn.textContent = "TEST BUTTON (Quick Panel)";
    btn.style.padding = "10px 20px";
    btn.style.margin = "40px";
    btn.style.fontSize = "16px";
    btn.style.background = "#3fa9f5";
    btn.style.color = "#fff";
    btn.style.border = "none";
    btn.style.borderRadius = "6px";
    btn.style.cursor = "pointer";

    mount.appendChild(btn);
  } catch (err) {
    console.error("[QuickPanel] Test render failed", err);
  }

  // Return a resolved Promise so the rest of quickpanel.js continues cleanly
  return Promise.resolve();
}

  function disableNativeContextMenu() {
    if (window.Holy && Holy.MENU && typeof Holy.MENU.contextM_disableNative === "function") {
      try {
        Holy.MENU.contextM_disableNative();
      } catch (err) {
        console.warn("[QuickPanel] Failed to disable native context menu", err);
      }
    }
  }

  function rebindSnippetsUI() {
    if (window.Holy && Holy.SNIPPETS && typeof Holy.SNIPPETS.rebindQuickAccessUI === "function") {
      try {
        Holy.SNIPPETS.rebindQuickAccessUI();
      } catch (err) {
        console.warn("[QuickPanel] Failed to rebind bank UI", err);
      }
    }
  }

  function initSnippets() {
    if (window.Holy && Holy.SNIPPETS && typeof Holy.SNIPPETS.init === "function") {
      try {
        Holy.SNIPPETS.init();
      } catch (err) {
        console.error("[QuickPanel] Failed to initialize snippets", err);
      }
    } else {
      console.warn("[QuickPanel] Holy.SNIPPETS.init is not available");
    }
  }

  function installLogProxy(cs) {
    if (!cs || typeof CSEvent !== "function") {
      return;
    }

    var original = {
      log: console.log ? console.log.bind(console) : function () {},
      info: console.info ? console.info.bind(console) : console.log.bind(console),
      warn: console.warn ? console.warn.bind(console) : console.log.bind(console),
      error: console.error ? console.error.bind(console) : console.log.bind(console)
    };

    var levels = ["log", "info", "warn", "error"];

    function serialise(args) {
      return Array.prototype.map.call(args, function (entry) {
        if (typeof entry === "string") {
          return entry;
        }
        try {
          return JSON.stringify(entry);
        } catch (e) {
          return String(entry);
        }
      });
    }

    levels.forEach(function (level) {
      if (typeof console[level] !== "function") {
        return;
      }

      console[level] = function () {
        original[level].apply(console, arguments);

        try {
          var evt = new CSEvent("com.holy.expressor.quickpanel.log", "APPLICATION");
          evt.data = JSON.stringify({
            level: level,
            messages: serialise(arguments),
            time: Date.now()
          });
          cs.dispatchEvent(evt);
        } catch (dispatchErr) {
          original.error("[QuickPanel] Log proxy dispatch failed", dispatchErr);
        }
      };
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    var cs = safeNewCSInterface();

    installLogProxy(cs);

    var closeBtn = document.getElementById("quickPanelCloseBtn");
    if (closeBtn && cs) {
      closeBtn.addEventListener("click", function () {
        try {
          cs.closeExtension();
        } catch (err) {
          console.error("[QuickPanel] Failed to close extension", err);
        }
      });
    }

    cloneSnippetsMarkup(cs)
      .then(function () {
        disableNativeContextMenu();
        rebindSnippetsUI();
        initSnippets();
      })
      .catch(function (err) {
        console.error("[QuickPanel] Failed to prepare snippets UI", err);
      });
  });
})();


// ---------------------------------------------------------
// 🧠 QuickPanel cold-start stabilizer
// ---------------------------------------------------------
window.addEventListener("DOMContentLoaded", () => {
  console.log("[QuickPanel] DOMContentLoaded – verifying test UI");

  // wait until body is really available (some builds delay this)
  setTimeout(() => {
    const testBtn = document.querySelector(".tab-btn");
    if (!testBtn) {
      console.warn("[QuickPanel] UI missing on first render, forcing redraw...");
      document.body.innerHTML = '<button class="tab-btn">TESTING (forced redraw)</button>';
    } else {
      console.log("[QuickPanel] UI verified OK on load.");
    }
  }, 500); // tweak delay if needed
});
