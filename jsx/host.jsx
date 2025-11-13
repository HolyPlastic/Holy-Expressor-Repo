// #targetengine "holyExpressor"






//@include "modules/host_APPLY.jsx"
//@include "modules/host_UTILS.jsx"
//@include "modules/host_MAPS.jsx"
//@include "modules/host_GET.jsx"
//@include "modules/host_DEV.jsx"

//@include "modules/host_APPLY_test.jsx"




/*═══════════════════════════════════════════════════════
 ==============🔧🔨🔩🔧================================
>>>>>>>>>>>  >>>>>>>> EXP PICKER  🔧🔨<<<<<<<<<<
═══════════════════════════════════════════════════════ */

function NEW_log_showDialog(logText) {
    if (logText === undefined || logText === null) {
        logText = "";
    }

    var w = new Window("dialog", "Holy Expressor Log", undefined, { resizeable: true });
    w.orientation = "column";

    var txt = w.add("edittext", undefined, logText, {
        multiline: true,
        scrolling: true
    });

    txt.alignment = ["fill", "fill"];
    txt.minimumSize = [400, 200];

    var g = w.add("group");
    g.alignment = "right";
    var closeBtn = g.add("button", undefined, "Close");

    w.onResizing = w.onResize = function () {
        txt.size = [w.size[0] - 40, w.size[1] - 80];
    };

    closeBtn.onClick = function () {
        w.close();
    };

    w.show();
}


/*═══════════════════════════════════════════════════════
═══════════════════════════════════════════════════════ */





























