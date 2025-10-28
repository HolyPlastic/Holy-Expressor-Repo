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

  function cloneSnippetsMarkup() {
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

    return fetch("index.html")
      .then(function (res) {
        if (!res.ok) {
          throw new Error("HTTP " + res.status);
        }
        return res.text();
      })
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

  document.addEventListener("DOMContentLoaded", function () {
    var cs = safeNewCSInterface();

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

    cloneSnippetsMarkup()
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
