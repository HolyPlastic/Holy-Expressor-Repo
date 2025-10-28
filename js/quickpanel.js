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

  function cloneSnippetsMarkup(cs) {
    var mount = document.getElementById("quickSnippetsMount");
    if (!mount) {
      return Promise.reject(new Error("quickSnippetsMount not found"));
    }

    function injectFromDocument(doc) {
      var bar = doc.getElementById("snippetsBar");
      if (!bar) {
        throw new Error("snippetsBar not found in source document");
      }
      var menu = doc.getElementById("snippetContextMenu");

      mount.innerHTML = "";
      mount.appendChild(bar.cloneNode(true));
      if (menu) {
        mount.appendChild(menu.cloneNode(true));
      }
    }

    return loadSourceHTML(cs)
      .then(function (html) {
        var parser = new DOMParser();
        var doc = parser.parseFromString(html, "text/html");
        injectFromDocument(doc);
      })
      .catch(function (err) {
        console.warn("[QuickPanel] Failed to clone snippets from index.html, using template", err);
        var tpl = document.getElementById("quickPanelSnippetsTemplate");
        if (!tpl || !tpl.content) {
          throw err;
        }
        mount.innerHTML = "";
        mount.appendChild(tpl.content.cloneNode(true));
        return null;
      });
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
