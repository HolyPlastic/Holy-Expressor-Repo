(function () {
  "use strict";

  if (typeof Holy !== "object") {
    window.Holy = {};
  }

  document.addEventListener("DOMContentLoaded", function () {
    var cs;
    try {
      cs = new CSInterface();
    } catch (err) {
      console.warn("[QuickPanel] CSInterface unavailable", err);
    }

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

    if (Holy && Holy.MENU && typeof Holy.MENU.contextM_disableNative === "function") {
      try {
        Holy.MENU.contextM_disableNative();
      } catch (err) {
        console.warn("[QuickPanel] Failed to disable native context menu", err);
      }
    }

    if (Holy && Holy.SNIPPETS && typeof Holy.SNIPPETS.init === "function") {
      try {
        Holy.SNIPPETS.init();
      } catch (err) {
        console.error("[QuickPanel] Failed to initialize snippets", err);
      }
    } else {
      console.warn("[QuickPanel] Holy.SNIPPETS.init is not available");
    }
  });
})();
