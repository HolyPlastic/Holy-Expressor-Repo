// ==========================================================
// Holy Expressor – host_GET.jsx
// V1 – Core path builder (Lean + Fallback + Selection Helpers)
// ==========================================================




// ==========================================================
// =🔱==== =🔱==== LEAN Path Builder Entry + Core Logic
// ==========================================================




// Entry point for the new lean builder system
// Currently uses he_GET_SelPath_Build() to process selected properties

function he_GET_SelPath_Engage(useAbsoluteComp) {
  try {
    var comp = app.project.activeItem;
    if (!comp || !(comp instanceof CompItem)) {
      return JSON.stringify({ error: "no active comp" });
    }

    var props = comp.selectedProperties;
    logToPanel("[LEAN-ENGAGE] invoked with " + props.length + " props");
    if (!props || props.length === 0) {
      return JSON.stringify({ error: "no selected properties" });
    }

    // Call the core lean builder
    var result = he_GET_SelPath_Build(props, useAbsoluteComp);

    // Log to ExtendScript console
    $.writeln("[LEAN] he_GET_SelPath_Engage invoked (" + props.length + " props)");
    return result;

  } catch (e) {
    return JSON.stringify({ error: "exception", msg: e.toString() });
  }
}



// ==========================================================
// Core logic for lean path generation
// ==========================================================

// V4.0 — Lean chain builder with FriendlyMap + full merge logic
function he_GET_SelPath_Build(props, cy_useAbs) {
  var debug = { count: 0, paths: [] };
  var exprOutputAll = [];

  try {
    debug.count = props.length;

    // 🔧 rule tables
    var GROUP_TOKENS = {
      "ADBE Transform Group": "transform",
      "ADBE Layer Styles": "layerStyle",
      "ADBE Drop Shadow": "dropShadow",
      "ADBE Vector Filter - Taper": "taper",
      "ADBE Vector Filter - Trim": "trimPaths",
      "ADBE Vector Filter - RC": "roundCorners",
      "ADBE Vector Filter - Repeater": "repeater",
      "ADBE Vector Filter - Offset": "offsetPaths"
    };
    var LEAF_TOKENS = {
      "ADBE Vector Shape": ".path",
      "ADBE Vector Stroke Width": ".strokeWidth",
      "ADBE Vector Stroke Color": ".color",
      "ADBE Vector Stroke Opacity": ".opacity",
      "ADBE Vector Fill Color": ".color",
      "ADBE Vector Fill Opacity": ".opacity",
      "ADBE Vector Taper Start Length": ".startLength",
      "ADBE Vector Taper End Length": ".endLength",
      "ADBE Vector Trim Start": ".start",
      "ADBE Vector Trim End": ".end",
      "ADBE Vector Trim Offset": ".offset",
      "ADBE Vector Taper Wave Amount": ".wave.amount",
      "ADBE Vector Taper Wave Phase": ".wave.phase",
      "ADBE Vector Taper Wavelength": ".wave.wavelength",
      "ADBE Vector Taper Start Ease": ".taper.startEase",
      "ADBE Vector Taper End Ease": ".taper.endEase",
      "ADBE Vector Taper Start Width": ".taper.startWidth",
      "ADBE Vector Taper End Width": ".taper.endWidth",
      "ADBE Vector Taper Length Units": ".taper.lengthUnits",
      // 📍 V3.91 – Dash leaf cleanup
      "ADBE Vector Stroke Dash 1": ".dash",
      "ADBE Vector Stroke Dash 2": ".gap",
      "ADBE Vector Stroke Offset": ".offset"
    };
    var STRUCTURAL_SKIP = {
      "ADBE Root Vectors Group": true,
      "ADBE Vectors Group": true,
      "ADBE Vector Group": true,
      "ADBE Vector Shape - Group": true,
      "ADBE Vector Shape - Rect": true,
      "ADBE Vector Shape - Ellipse": true
    };
    var LIL_NAME_GROUPS = {
      "ADBE Vector Filter - Taper": "taper",
      "ADBE Vector Taper Wave": "wave",
      "ADBE Vector Stroke Dashes": "dash",
      "ADBE Vector Stroke Wave": "wave",
      "ADBE Vector Stroke Taper": "taper"
    };

    for (var cy_i = 0; cy_i < props.length; cy_i++) {
      var p = props[cy_i];

      // 📍 Structural Deduplication
      try {
        if (
          !p ||
          p.canSetExpression === false ||
          STRUCTURAL_SKIP[p.matchName]
        ) {
          $.writeln("⚠️ Skipping structural container: " + (p ? p.matchName : "null"));
          continue;
        }
      } catch (err) {
        $.writeln("⚠️ Dedup check error: " + err);
        continue;
      }

      // 🧱 Layer setup
      var layerName = "(Unknown Layer)";
      try { layerName = p.propertyGroup(p.propertyDepth).name; } catch (_) {}

      var base = cy_useAbs === "true"
        ? 'comp("' + app.project.activeItem.name + '").layer("' + layerName + '")'
        : 'thisComp.layer("' + layerName + '")';

      var path = base;
      var depth = 0;
      try { depth = p.propertyDepth; } catch (_) {}

      // 🔄 Parent chain climb
      for (var d = depth; d >= 1; d--) {
        if (d === depth) continue; // skip outermost layer container

        var g = null;
        try { g = p.propertyGroup(d); } catch (_) { g = null; }
        if (!g) continue;

        var mm = "", nm = "";
        try { mm = g.matchName || ""; } catch (_) {}
        try { nm = g.name || ""; } catch (_) {}

        if (STRUCTURAL_SKIP[mm] || nm === "Contents") continue;

        // 1️⃣ LIL names (wave, taper, dash)
        if (LIL_NAME_GROUPS[mm]) {
          path += "." + LIL_NAME_GROUPS[mm];
          continue;
        }

        // 2️⃣ FriendlyMap global (skip literal "contents")
        if (typeof HE_FRIENDLY_MAP !== "undefined" && HE_FRIENDLY_MAP[mm]) {
          var friendly = HE_FRIENDLY_MAP[mm];
          if (friendly !== "contents") {
            if (friendly.charAt(0) !== ".") friendly = "." + friendly;
            path += friendly;
            continue;
          }
        }

        // 3️⃣ Local group tokens
        if (GROUP_TOKENS[mm]) {
          path += "." + GROUP_TOKENS[mm];
          continue;
        }

        // 4️⃣ Fallback: explicit name
        path += '.content("' + nm + '")';
      }

      // 🌿 Leaf append
      var leafMatch = "";
      try { leafMatch = p.matchName || ""; } catch (_) {}

      if (LEAF_TOKENS[leafMatch]) {
        path += LEAF_TOKENS[leafMatch];
      } else if (HE_FRIENDLY_MAP && HE_FRIENDLY_MAP[leafMatch]) {
        var leafFriendly = HE_FRIENDLY_MAP[leafMatch];
        if (leafFriendly.charAt(0) !== ".") leafFriendly = "." + leafFriendly;
        path += leafFriendly;
      } else {
        path += '.property("' + leafMatch + '")';
      }

      exprOutputAll.push(path);
      debug.paths.push({ name: p.name, matchName: leafMatch, depth: depth, path: path });
    }

    logToPanel("[LEAN-BUILD] built " + exprOutputAll.length + " paths");
    return JSON.stringify({ ok: true, built: exprOutputAll.join("\n"), debug: debug });

  } catch (err) {
    return JSON.stringify({ error: "LEAN builder exception", msg: err.toString() });
  }
}




//=🔱==== DYNAMIC FALLBACK --GET SELECTED PATHS==BUILDER FUNCTION ⬇️➡️↘️⤵️ --------------------
//🔴🟠~🔴🟠🔴🟠~






// V9.7 - Path builder with universal Contents filter and group+leaf dedup
function he_U_getSelectedPaths(useAbsoluteComp) {
  useAbsoluteComp = (String(useAbsoluteComp) === "true");

  var debug = { compActive:false, propCount:null, metaPaths:[], leafMatches:[], builtPaths:[] };

  // Purely structural groups, never emit segments for these
  var STRUCTURAL = {
    "ADBE Root Vectors Group": true,
    "ADBE Vector Group": true,
    "ADBE Vector Shape - Group": true // ✅ treat Path containers as structural only
  };

// Groups that must always be addressed with content("…")
// They cannot be dotted directly
var NAME_ONLY_GROUPS = {
  "ADBE Vector Graphic - Stroke": true,
  "ADBE Vector Graphic - Fill": true,
  "ADBE Vector Shape - Group": true,   // Path 1 container
  "ADBE Vector Shape - Rect": true,
  "ADBE Vector Shape - Ellipse": true,
  "ADBE Vector Shape - Star": true,
  "ADBE Vector Filter - Trim": true,   // Trim Paths
  "ADBE Vector Filter - RC": true,     // Round Corners
  "ADBE Vector Filter - Taper": true,  // Taper container
  "ADBE Vector Stroke Taper": true,    // Stroke taper sub-container
  "ADBE Vector Filter - Zigzag": true, // Zig Zag
  "ADBE Vector Filter - Repeater": true,
  "ADBE Vector Filter - Offset": true
};



  // V1 helper - strip a duplicated group prefix from a dotted leaf alias
  // Example: lastDotted="trimPaths", dotFrag=".trimPaths.start" -> ".start"
  function he_stripGroupPrefix(dotFrag, lastDotted) {
    try {
      if (!dotFrag || dotFrag.charAt(0) !== "." || !lastDotted) return dotFrag;
      var pref = "." + lastDotted;
      if (dotFrag.indexOf(pref + ".") === 0) return dotFrag.substring(pref.length);
      if (dotFrag === pref) return ""; // alias was only the group token itself
      return dotFrag;
    } catch (_) {
      return dotFrag;
    }
  }

  try {
    var comp = app.project.activeItem;
    if (!comp || !(comp instanceof CompItem)) {
      return JSON.stringify({ error: "no active comp", debug: debug });
    }
    debug.compActive = true;

    var props = comp.selectedProperties;
    if (!props || props.length === 0) {
      debug.propCount = 0;
      return JSON.stringify({ error: "no selected properties", debug: debug });
    }
    debug.propCount = props.length;

    for (var i = 0; i < props.length; i++) {
      var picked = props[i];
      if (!picked) continue;

      // Coerce meta array from hybrid maker
      var hybrid = null, metaArr = [];
      try {
        hybrid = he_P_MM_getExprPathHybrid(picked);
        if (hybrid && hybrid.metaPath && hybrid.metaPath instanceof Array) {
          metaArr = hybrid.metaPath;
        } else if (hybrid && hybrid._metaJSON) {
          metaArr = JSON.parse(hybrid._metaJSON);
        }
      } catch (e) {
        debug.metaPaths.push("EXC:" + e.toString());
        continue;
      }
      if (!metaArr || metaArr.length === 0) { debug.metaPaths.push("EMPTY_META"); continue; }
      debug.metaPaths.push(JSON.stringify(metaArr));

      // Leaf node info
      var leaf = metaArr[metaArr.length - 1];
      if (!leaf) continue;
      var leafMatch = leaf.matchName || "";
      debug.leafMatches.push(leafMatch);

      // Start at the layer
      var layerName = metaArr[0].name || "(Unknown)";
      var path = (useAbsoluteComp
        ? 'comp("' + comp.name + '").layer("' + layerName + '")'
        : 'thisComp.layer("' + layerName + '")');

      // Track the last dotted group token we appended to support dedup at the leaf
      var lastDotted = null;

      // Walk mid-nodes (1 .. len-2)
      for (var j = 1; j < metaArr.length - 1; j++) {
        var node = metaArr[j];
        if (!node) continue;

        // Skip structural and any visible "Contents" buckets
        if (STRUCTURAL[node.matchName] || node.name === "Contents") {
          continue;
        }

        // Prefer dotted accessor when HE_FRIENDLY_MAP says so and group is not name-only
        var friendly = node.matchName && HE_FRIENDLY_MAP[node.matchName];
        if (friendly && !NAME_ONLY_GROUPS[node.matchName]) {
          // friendly can have one or more segments, append each and remember the last segment
          var segs = String(friendly).split(".");
          for (var k = 0; k < segs.length; k++) {
            if (segs[k]) {
              path += "." + segs[k];
              lastDotted = segs[k];
            }
          }
          continue;
        }

        // Otherwise address by visible name
        path += '.content("' + (node.name || "") + '")';
        // After content("…"), do not dedup the leaf against earlier dotted groups
        lastDotted = null;
      }

      // Leaf append - alias, then friendly, else property()
      var toAppend = null;
      var leafAlias = (typeof HE_LEAF_ALIASES === "object" && HE_LEAF_ALIASES[leafMatch]) || null;
      if (leafAlias) {
        toAppend = he_stripGroupPrefix(leafAlias, lastDotted);
      } else {
        var lf = HE_FRIENDLY_MAP[leafMatch];
        if (lf) {
          var dotted = (lf.charAt && lf.charAt(0) === ".") ? lf : "." + lf;
          toAppend = he_stripGroupPrefix(dotted, lastDotted);
        } else {
          toAppend = '.property("' + leafMatch + '")';
        }
      }

      // Guard: never output Shape - Group as a leaf
      if (leafMatch === "ADBE Vector Shape - Group") {
          continue;
      }
      if (toAppend) path += toAppend;
      // Push exactly one expression per selection, ignore bogus paths ending in ".contents"
      // Guard: block bogus `.contents` or `.content("Contents").path`, allow real Path
      if (
        path &&
        !/\.contents$/.test(path) &&
        !/\.content\("Contents"\)\.path$/.test(path) &&
        !/\.property\("ADBE Vector Shape - Group"\)/.test(path)
      ) {
        debug.builtPaths.push(path);
      }
    } // <- closes the for (var i=0; i < props.length; i++) loop

    if (debug.builtPaths.length === 0) {
      return JSON.stringify({ error: "no path built", debug: debug });
    }
    return JSON.stringify({ ok: true, built: debug.builtPaths.join("\n"), debug: debug });

  } catch (e) {
    return JSON.stringify({ error: "exception", msg: e.toString(), debug: debug });
  }

  // ✅ Safety net: if we reached here without returning, emit a fallback
}














// V7 - Selected props with reliable MapMaker + JSON fallback
function he_U_getSelectedProps() {
  var results = [];

  try {
    var comp = app.project.activeItem;
    if (!comp || !(comp instanceof CompItem)) return results;

    var props = comp.selectedProperties;
    if (!props || props.length === 0) return results;

    for (var i = 0; i < props.length; i++) {
      var picked = props[i];
      if (!picked) continue;

      // Walk down to a leaf
      var leaf = he_U_findFirstLeaf(picked, 0);
      if (!leaf) {
        results.push({
          expr: HE_SENTINEL_NO_EXPR,
          path: picked.name || "",
          name: picked.name || "",
          matchName: (picked.matchName || ""),
          classification: "StructuralSkip",
          pickedMatchName: (function(){ try { return picked.matchName || ""; } catch(_){ return ""; } })(),
          pickedIsLeaf: false
        });
        continue;
      }

      // Build hybrid for the resolved leaf
      var hybrid = he_P_MM_getExprPathHybrid(leaf);

      // 🔒 Fallback: parse JSON if metaPath fails
      var metaPath = [];
      try {
        if (hybrid && hybrid.metaPath && hybrid.metaPath.length > 0) {
          metaPath = hybrid.metaPath;
        } else if (hybrid && hybrid._metaJSON) {
          metaPath = JSON.parse(hybrid._metaJSON);
        }
      } catch (metaErr) {
        metaPath = [{ name: "META_ERR", matchName: "" }];
      }

      var exprPath = hybrid && hybrid.exprPath ? hybrid.exprPath : "";

      // Extract expression if available
      var expr = HE_SENTINEL_NO_EXPR;
      try {
        if (leaf.canSetExpression === true || leaf.matchName === "ADBE Vector Shape") {
          var rawExpr = leaf.expression;
          expr = (rawExpr === undefined || rawExpr === null)
            ? HE_SENTINEL_NO_EXPR
            : rawExpr;
        }
      } catch (exprErr) {
        expr = "__ERROR__:" + exprErr.toString();
      }

      // Classify
      var classification = he_P_MM_classifyProperty(metaPath);
      if (!classification) classification = "Unclassified";

      // Names
      var name = "";
      var mm = "";
      try { name = leaf.name || ""; } catch (_) {}
      try { mm = leaf.matchName || ""; } catch (_) {}

      // Push to results
      results.push({
        expr: expr,
        path: exprPath,
        name: name,
        matchName: mm,
        classification: classification,
        pickedMatchName: (function(){ try { return picked.matchName || ""; } catch(_){ return ""; } })(),
        pickedIsLeaf: (picked === leaf)
      });
    }

  } catch (err) {
    he_U_fail("Error in getSelectedProps", err);
  }

  return results;
}









// SELECTION SUMMARIZER: Summarize current selection for Target list
function he_U_SS_getSelectionSummary() {
  try {
    var a = app.project.activeItem;
    if (!a || !(a instanceof CompItem)) return JSON.stringify({ ok:false, err:"No active comp" });

    var sel = a.selectedProperties;
    if (!sel || sel.length === 0) return JSON.stringify({ ok:false, err:"No properties selected" });

    var items = [];
    for (var i = 0; i < sel.length; i++) {
      var p = sel[i];
      if (!p) continue;
      // skip groups
      if (p.propertyType === PropertyType.INDEXED_GROUP || p.propertyType === PropertyType.NAMED_GROUP) continue;
      if (!p.canSetExpression) continue;

      var vt = he_P_TR_valueTypeOf(p);
      items.push({
        layerName:   p.propertyGroup(p.propertyDepth).name,
        displayName: p.name,
        path:        he_P_MM_getExprPath(p),
        isArray:     vt !== "OneD",
        length:      (vt==="TwoD"?2:(vt==="ThreeD"?3:(vt==="Color"?4:1)))
      });
    }
    if (!items.length) return JSON.stringify({ ok:false, err:"No applicable properties" });
    return JSON.stringify({ ok:true, items: items });
  } catch (e) {
  return JSON.stringify({ ok:false, err:"SelectionSummarizer error: " + String(e) });
  }
}










// OLD FALLBACK OR SMT V5 – MAP MAKER HYBRID: stricter filter, no Path container in metaPath
function he_P_MM_getExprPathHybrid(prop) {
  var result = { exprPath: "", metaPath: [], _metaJSON: "[]" };

  // Structural-only nodes: containers that never form valid expression segments
  var STRUCTURAL = {
    "ADBE Root Vectors Group": true,
    "ADBE Vector Group": true,
    "ADBE Vector Shape - Group": true // 🚫 treat Path container as structural
  };

                          try {
                            if (!prop) return result;

                            var names = [];
                            var meta = [];

                            // Collect parent groups
                            var depth = prop.propertyDepth || 0;
                            var groups = [];
                            for (var d = 1; d <= depth; d++) {
                              var grp = prop.propertyGroup(d);
                              if (grp) groups.push(grp);
                            }



                            // Add group chain (root → leaf), but skip structural nodes
                            for (var i = groups.length - 1; i >= 0; i--) {
                              var g = groups[i];
                              var gName = "", gMatch = "";
                              try { gName = g.name || ""; } catch (_) {}
                              try { gMatch = g.matchName || ""; } catch (_) {}

                              if (STRUCTURAL[gMatch]) {
                                continue; // 🚫 skip containers like Path 1 group

                                // PATCH A: Skip structural/container groups at source
                                if (MAPMAKER_SKIP[gMatch]) {
                                  continue;
                                }
                                      }




                              meta.push({
                                name: gName,
                                matchName: gMatch,
                                lilName: (gName ? gName.toLowerCase().replace(/\s+/g, "") : "")
                              });
                              names.push(gName);
                            }

                            // Add the property itself (leaf only)
                            var propName = "", propMatch = "";
                            try { propName = prop.name || ""; } catch (_) {}
                            try { propMatch = prop.matchName || ""; } catch (_) {}

                            meta.push({
                              name: propName,
                              matchName: propMatch,
                              lilName: (propName ? propName.toLowerCase().replace(/\s+/g, "") : "")
                            });
                            names.push(propName);

                            // Guarantee metaPath never empty
                            if (meta.length === 0) {
                              meta.push({ name: "(Unknown)", matchName: "", lilName: "unknown" });
                              names.push("(Unknown)");
                            }

                            result.exprPath = names.join(" > ");
                            result.metaPath = meta.slice();
                            result._metaJSON = JSON.stringify(result.metaPath);

                          } 


                        
      
      catch (err) {
        var fallback = [{ name: "ERROR", matchName: "", lilName: "error" }];
        result.exprPath = "ERROR";
        result.metaPath = fallback;
        result._metaJSON = JSON.stringify(fallback);
      }

/*
      try {
  // 🧪 DEBUG LOGGER: send pretty JSON to DevTools
  var pretty = JSON.stringify(result.metaPath, null, 2); // adds \n and indentation
  var payload =
    "META TRACE >> " +
    (prop.name || "(unnamed)") +
    "\n" +
    pretty +                       // line breaks included
    "\n-----------------------------";

  var evt = new CSXSEvent();
  evt.type = "com.holyexpressor.debug";
  evt.data = payload;
  evt.dispatch();
} catch (logErr) {
  $.writeln("Logging failed: " + logErr);
}

*/


return result;
  
}

// PATCH A: Groups we never want in metaPath
var MAPMAKER_SKIP = {
  "ADBE Root Vectors Group": true,
  "ADBE Vector Group": true,
  "ADBE Vector Shape - Group": true
};



/* 
🌐
[MOVED] Friendly maps and aliases now live in host_MAPS.jsx

var HE_FRIENDLY_MAP
var HE_GROUP_ALIASES = {};

var HE_LEAF_ALIASES = 
*/


// Legacy helper: retain string path access for existing callers

function he_P_MM_getExprPath(prop) {

    var hybrid = he_P_MM_getExprPathHybrid(prop);

    return hybrid.exprPath;

}






// [V1] Build friendly expression path from metaPath
// PLACE directly after the alias tables.
function he_U_buildFriendlyExprPath(metaArr, useAbsoluteComp, layerName) {
  // VALIDATOR: Require at least [LayerName, ..., Leaf]
  if (!metaArr || metaArr.length === 0) return "";

  var base = useAbsoluteComp
    ? 'comp("' + app.project.activeItem.name + '").layer("' + layerName + '")'
    : 'thisComp.layer("' + layerName + '")';

  // Walk all nodes except the first (layer) and handle groups
  for (var i = 1; i < metaArr.length - 1; i++) {
    var node = metaArr[i] || {};
    var m = String(node.matchName || "");
    var n = String(node.name || "");
    if (HE_GROUP_ALIASES.hasOwnProperty(m)) {
      base += HE_GROUP_ALIASES[m];               // e.g. .transform
    } else {
      base += '.content("' + n + '")';           // general group name
    }
  }

  // Leaf
  var leaf = metaArr[metaArr.length - 1] || {};
  var leafMatch = String(leaf.matchName || "");
  if (HE_LEAF_ALIASES.hasOwnProperty(leafMatch) && HE_LEAF_ALIASES[leafMatch]) {
    base += HE_LEAF_ALIASES[leafMatch];          // may append compound like .taper.startLength
  } else if (HE_GROUP_ALIASES.hasOwnProperty(leafMatch)) {
    base += HE_GROUP_ALIASES[leafMatch];
  } else {
    base += '.property("' + leafMatch + '")';    // fallback
  }

  return base;
}








// EXPLORER: resolve a breadcrumb path back to a property (strict-only)
function he_P_EX_findPropertyByPath(comp, pathString) {
  if (!comp || !(comp instanceof CompItem)) return null;
  if (!pathString) return null;

  var parts = pathString.split(" > ");
  if (parts.length < 2) return null;

  var layer = comp.layer(parts[0]);
  if (!layer) return null;

  var current = layer;
  for (var i = 1; i < parts.length; i++) {
    var wanted = parts[i];
    var found = null;

    for (var j = 1; j <= current.numProperties; j++) {
      var child = current.property(j);
      if (!child) continue;

      // ✅ exact-only: child.name or child.matchName must equal wanted
      if (child.name === wanted || child.matchName === wanted) {
        found = child;
        break;
      }
    }

    if (!found) return null;
    current = found;
  }
  return current;
}







// GROUP SCOUTS - TOKEN-BASED & helpers: recursive search by token path (starts anywhere)
function he_P_GS1_collectGroupsByTokenDeep(group, token, out) {
  for (var i = 1; i <= group.numProperties; i++) {
    var pr = group.property(i);
    if (!pr) continue;
    if (pr.propertyType === PropertyType.INDEXED_GROUP || pr.propertyType === PropertyType.NAMED_GROUP) {
      if (pr.name === token || pr.matchName === token) out.push(pr);
      he_P_GS1_collectGroupsByTokenDeep(pr, token, out); // self-call
    }
  }
}

function he_P_GS2_collectPropsByTokenDeep(group, token, out) {
  for (var i = 1; i <= group.numProperties; i++) {
    var pr = group.property(i);
    if (!pr) continue;
    if (pr.propertyType === PropertyType.PROPERTY) {
      if (pr.canSetExpression && (pr.name === token || pr.matchName === token)) out.push(pr);
    } else if (pr.propertyType === PropertyType.INDEXED_GROUP || pr.propertyType === PropertyType.NAMED_GROUP) {
      he_P_GS2_collectPropsByTokenDeep(pr, token, out); // self-call
    }
  }
}

function he_P_GS3_findPropsByTokenPath(anchor, tokens, depth, out) {
  var last = tokens.length - 1;
  if (depth > last) return;
  if (depth === last) {
    he_P_GS2_collectPropsByTokenDeep(anchor, tokens[depth], out); // use GS2
    return;
  }
  var groups = [];
  he_P_GS1_collectGroupsByTokenDeep(anchor, tokens[depth], groups); // use GS1
  for (var i = 0; i < groups.length; i++) {
    he_P_GS3_findPropsByTokenPath(groups[i], tokens, depth + 1, out); // self-call
  }
}













function holy_captureControlsJSON(snippetId) {
  var result = {};
  try {
    var comp = app.project.activeItem;
    if (!(comp && comp instanceof CompItem)) throw "No active comp";
    if (comp.selectedLayers.length === 0) throw "No layer selected";

    var layer = comp.selectedLayers[0];
    var fxGroup = layer.property("ADBE Effect Parade");
    if (!fxGroup || fxGroup.numProperties === 0) throw "No effects found";

    var controls = [];

    for (var i = 1; i <= fxGroup.numProperties; i++) {
      var fx = fxGroup.property(i);
      var entry = {
        name: fx.name,
        matchName: fx.matchName,
        properties: []
      };

for (var p = 1; p <= fx.numProperties; p++) {
    var prop = fx.property(p);
    if (prop.canSetExpression || prop.propertyValueType === PropertyValueType.OneD) {
        var propData = {
            name: prop.name,
            matchName: prop.matchName,
            value: prop.value
        };

        if (prop.canSetExpression && prop.expressionEnabled && prop.expression !== "") {
            propData.expression = prop.expression;
        }

        entry.properties.push(propData);
    }
}

      controls.push(entry);
    }

    result.effects = controls;
  } catch (err) {
    result.error = String(err);
  }
  return JSON.stringify(result);
}

try {
    logToPanel("✅ host_GET.jsx Loaded ⛓️");
} catch (e) {}