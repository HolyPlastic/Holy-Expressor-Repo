if (typeof Holy !== "object") Holy = {};

(function () {
  "use strict";

  function getFieldValue(selector) {
    var el = document.querySelector(selector);
    return el ? el.value : "";
  }

  function setButtonState(btn, isBusy) {
    if (!btn) return;
    btn.disabled = !!isBusy;
    btn.classList.toggle("is-busy", !!isBusy);
  }

  function runSearchReplace() {
    var searchVal = getFieldValue("#searchField");
    var replaceVal = getFieldValue("#replaceField");
    var button = document.querySelector("#runSearchReplace");

    setButtonState(button, true);

    return Holy.EXPRESS.cy_replaceInExpressions(searchVal, replaceVal)
      .then(function (summary) {
        setButtonState(button, false);
        if (summary && summary.message) {
          console.log(summary.message);
        }
        if (summary && summary.replacements > 0) {
          if (Holy.UI && typeof Holy.UI.toast === "function") {
            Holy.UI.toast("Search & Replace complete");
          }
        } else if (Holy.UI && typeof Holy.UI.toast === "function") {
          Holy.UI.toast("No matches found");
        }
        return summary;
      })
      .catch(function (err) {
        setButtonState(button, false);
        var msg = (err && err.userMessage) ? err.userMessage : "Search & Replace failed";
        console.error("[Holy.SEARCH] runSearchReplace error", err);
        if (Holy.UI && typeof Holy.UI.toast === "function") {
          Holy.UI.toast(msg);
        }
        throw err;
      });
  }

  function init() {
    var btn = document.querySelector("#runSearchReplace");
    if (!btn) return;
    if (!btn.dataset.cySearchBound) {
      btn.dataset.cySearchBound = "true";
      btn.addEventListener("click", function () {
        runSearchReplace();
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  Holy.SEARCH = {
    init: init,
    runSearchReplace: runSearchReplace
  };
})();
