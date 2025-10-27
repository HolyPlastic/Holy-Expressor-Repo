








// LS helpers — determine if a leaf is part of Layer Styles and whether that style is enabled was ~157-250
function he_U_Ls_1_isLayerStyleProp(p){
  try{
    if(!p) return false;
    // Walk all ancestors; LS root matchName often starts with "ADBE Layer Styles"
    for (var d = 1; d <= p.propertyDepth; d++) {
      var g = p.propertyGroup(d);
      if (!g) continue;
      var mm = ""; try { mm = g.matchName || ""; } catch(e) {}
      var nm = ""; try { nm = g.name || ""; } catch(e) {}
      if ((mm && mm.indexOf("ADBE Layer Styles") === 0) || nm === "Layer Styles") {
        return true;
      }
    }
    return false;
  }catch(e){ return false; }
}

function he_U_Ls_2_styleEnabledForLeaf(p){
  // Returns true only if the owning style group is present and enabled
  try{
    if(!he_U_Ls_1_isLayerStyleProp(p)) return true; // non-LS props should pass

    // The immediate parent of a Layer Style leaf is the style group (e.g., "Drop Shadow")
    var styleGroup = null;
    try { styleGroup = p.propertyGroup(1); } catch(e) { styleGroup = null; }
    if(!styleGroup) return false; // phantom (not instantiated) → not enabled

    // 1) Prefer the style group's own enabled (eyeball) if exposed
    try {
      if (typeof styleGroup.enabled !== 'undefined') return !!styleGroup.enabled;
    } catch (e) { /* fall through */ }

    // 2) Fallback: look for an explicit "*/enabled" child under the style group
    var prefix = "";
    var mm = ""; try { mm = p.matchName || ""; } catch(e) {}
    var idx = mm.indexOf("/");
    if (idx > 0) prefix = mm.substring(0, idx);

    for (var i=1; i<=styleGroup.numProperties; i++){
      var child = styleGroup.property(i);
      if(!child || child.propertyType !== PropertyType.PROPERTY) continue;
      var cm = ""; try { cm = child.matchName || ""; } catch(e) {}
      if ((prefix && cm === (prefix + "/enabled")) || (!prefix && cm.slice(-8) === "/enabled")){
        try { return !!child.value; } catch(e){ return false; }
      }
    }

    // No explicit enable control found → treat as not enabled (silent ignore)
    return false;
  }catch(e){ return false; }
}

// VALIDATION SEEKER
function he_U_VS_isTrulyHidden(p) {
  try {
    if (!p || !p.canSetExpression) return true;

    // Only gate on LS root for LS props
    if (he_U_Ls_1_isLayerStyleProp(p)) {
      var layer = p.propertyGroup(p.propertyDepth);
      var rootLS = layer && layer.property && layer.property("ADBE Layer Styles");
      if (rootLS && ("canSetEnabled" in rootLS) && rootLS.canSetEnabled === false) {
        return true;
      }
    }
    // Check parent groups
    for (var d = p.propertyDepth; d >= 1; d--) {
      var g = p.propertyGroup(d);
      if (g && ("enabled" in g)) {
        try {
          if (!g.enabled) return true;
        } catch (e) {}
      }
    }

    // Probe: test expression assignment
    var oldExpr = "";
    try { oldExpr = p.expression; } catch (e) {}
    try {
      p.expression = "";
      p.expression = oldExpr;
    } catch (e) {
      return true;
    }

    return false; // survived
  } catch (e) {
    return true;
  }
}




/**
 *  he_U_findFirstLeaf was ~309
 * Depth-first walker that promotes shape containers to expression-capable leaves.
 *
 * @param {PropertyBase} prop - Candidate property or container to inspect.
 * @param {number} depth - Legacy recursion depth (0 for new calls).
 * @returns {PropertyBase|null} - Resolved leaf or null.
 */
function he_P_isShapeContainer(prop) {
    if (!prop) return false;
    var mm = "";
    try { mm = prop.matchName || ""; } catch (_) {}
    var type = 0;
    try { type = prop.propertyType; } catch (_) {}
    if (!(type === PropertyType.NAMED_GROUP || type === PropertyType.INDEXED_GROUP)) {
        return false;
    }
    if (HE_SHAPE_CONTAINER_MATCHNAMES[mm]) return true;
    if (mm && mm.indexOf("ADBE Vector") === 0) return true;
    return false;
}







function he_U_findFirstLeaf(prop, depth) {// V2 deterministic DFS for first animatable leaf

  // FILTER: quick guards
  if (!prop) return null;

  // CHECKER: is this a valid leaf for expressions
  function _isGoodLeaf(p) {
    if (!p) return false;
    try {
      if (p.propertyType !== PropertyType.PROPERTY) return false;
    } catch (_) { return false; }

    // VALIDATOR: skip disabled Layer Styles
    try {
      if (he_U_Ls_1_isLayerStyleProp(p) && !he_U_Ls_2_styleEnabledForLeaf(p)) return false;
    } catch (_) {}

    // VALIDATOR: skip truly hidden or phantom leaves
    try {
      if (he_U_VS_isTrulyHidden(p)) return false;
    } catch (_) {}

    try { return p.canSetExpression === true; } catch (_) { return false; }
  }

  // FAST PATH: selected node is already a good leaf
  if (_isGoodLeaf(prop)) return prop;

  // FILTER: only descend into containers
  var pt = 0;
  try { pt = prop.propertyType; } catch (_) { pt = 0; }
  if (!(pt === PropertyType.NAMED_GROUP || pt === PropertyType.INDEXED_GROUP)) return null;

  // WALKER: explicit stack for preorder DFS
  var stack = [];
  function _pushChildren(node) {
    var n = 0;
    try { n = node.numProperties || 0; } catch (_) { n = 0; }
    for (var i = n; i >= 1; i--) { // push reverse so we pop in natural order
      var c = null; try { c = node.property(i); } catch (_) { c = null; }
      if (c) stack.push(c);
    }
  }

  _pushChildren(prop);

  while (stack.length) {
    var node = stack.pop();
    if (_isGoodLeaf(node)) return node;

    var t = 0;
    try { t = node.propertyType; } catch (_) { t = 0; }
    if (t === PropertyType.NAMED_GROUP || t === PropertyType.INDEXED_GROUP) {
      _pushChildren(node);
    }
  }

  return null;
}


function he_U_findLeaf(prop, depth) {
    return he_U_findFirstLeaf(prop, depth);
}







function he_U_buildSelectionKey(prop, hybrid) {
    try {
        var path = (hybrid && hybrid.exprPath) ? hybrid.exprPath : "";
        var matchName = "";
        try { matchName = prop.matchName || ""; } catch (_) {}
        var layerPrefix = "";
        try {
            var layer = prop.propertyGroup(prop.propertyDepth);
            if (layer && typeof layer.index === "number") {
                layerPrefix = "#" + layer.index + "::";
            }
        } catch (_) {}
        return layerPrefix + path + "::" + matchName;
    } catch (err) {
        return "";
    }
}










/*~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~#####~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/
/*~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~#####~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/
/*READERS 🔎🔎🔎🔎🔎🔎🔎🔎🔎🔎🔎🔎🔎🔎🔎🔎🔎🔎🔎🔎🔎🔎🔎🔎🔎🔎*/
/*~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~#####~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/
/*~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~#####~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/




// Shape Reader: resolve a strict token path into an 
// expression-capable leaf under a Shape Layer.
// tokens example: ["Shape Layer 2", "Contents", "Shape 1", "Stroke 1", "Stroke Width"]
function he_P_shapeReader(tokens, layer) {
    if (!tokens || !tokens.length || !layer) return null;

    var current = layer;                 // start at the shape layer
    var metaPath = [];                   // [{name, matchName}, ...]
    var exprSegments = [];               // names-only for expression addressing

    // Walk tokens after the layer name
    for (var i = 1; i < tokens.length; i++) {
        var wanted = tokens[i];
        if (!wanted) continue;

        // Always skip structural "Contents" token
        if (wanted === "Contents") continue;

        // Find child that strictly matches by name or matchName
        var found = null;
        for (var j = 1; j <= current.numProperties; j++) {
            var child = current.property(j);
            if (!child) continue;

            // Strict match by .name or .matchName
            var childName = "";
            var childMM = "";
            try { childName = child.name || ""; } catch (_) {}
            try { childMM   = child.matchName || ""; } catch (_) {}

            if (childName === wanted || childMM === wanted) {
                found = child;
                break;
            }
        }
        if (!found) return null;

        // Record step
        var foundName = "";
        var foundMM = "";
        try { foundName = found.name || ""; } catch (_) {}
        try { foundMM   = found.matchName || ""; } catch (_) {}
        metaPath.push({ name: foundName, matchName: foundMM });
        exprSegments.push(foundName);

        // If this node is a known structural-only container, we continue traversal
        // but never treat it as a leaf.
        // Structural containers: Contents, Vector Group, Transform groups
        if (HE_STRUCTURAL_MATCHNAMES[foundMM]) {
            current = found;
            continue;
        }

        // Graphic containers like Stroke/Fill are groups, not leaves.
        // They are not structural-only, so we allow traversal into them.
        // Leaves will be their children (Width, Opacity, Color, etc.)
        current = found;
    }

    // At the end, decide if current is an expression-capable leaf
    if (he_P_leafReader(current, metaPath)) {
        return {
            exprPath: exprSegments.join(" > "),
            metaPath: metaPath,
            leaf: current
        };
    }

    return null;
}

// Leaf Reader: returns true if prop is an expression-capable leaf.
// Uses stable matchNames from Adobe docs; falls back to .canSetExpression.
function he_P_leafReader(prop, metaPath) {
    if (!prop) return false;

    var mm = "";
    try { mm = prop.matchName || ""; } catch (_) {}

    // Known leaves under shape graphics and transforms.
    // 1 = definite leaf, 0 = container.
    var leafMatchNames = {
        // Transform (shape-level)
        "ADBE Vector Position": 1,
        "ADBE Vector Rotation": 1,
        "ADBE Vector Scale": 1,
        "ADBE Vector Group Opacity": 1,

        // Fill
        "ADBE Vector Graphic - Fill": 0,
        "ADBE Vector Fill Color": 1,
        "ADBE Vector Fill Opacity": 1,

        // Stroke
        "ADBE Vector Graphic - Stroke": 0,
        "ADBE Vector Stroke Color": 1,
        "ADBE Vector Stroke Opacity": 1,
        "ADBE Vector Stroke Width": 1,

        // Gradient Fill
        "ADBE Vector Graphic - G-Fill": 0,
        "ADBE Vector Grad Colors": 1,
        "ADBE Vector Grad Opacity": 1,
        "ADBE Vector Grad Start Pt": 1,
        "ADBE Vector Grad End Pt": 1,
        "ADBE Vector Grad HiLite Angle": 1,
        "ADBE Vector Grad HiLite Length": 1,
        "ADBE Vector Grad HiLite Center": 1,

        // Gradient Stroke
        "ADBE Vector Graphic - G-Stroke": 0,
        "ADBE Vector Grad Stroke Colors": 1,
        "ADBE Vector Grad Stroke Opacity": 1,
        "ADBE Vector Grad Stroke Start Pt": 1,
        "ADBE Vector Grad Stroke End Pt": 1,
        "ADBE Vector Grad Stroke Width": 1,

        // Path
        "ADBE Vector Shape - Group": 0,
        "ADBE Vector Shape": 1,
        "ADBE Vector Shape Direction": 1,

        // Dashes
        "ADBE Vector Stroke Dashes": 0,
        "ADBE Vector Stroke Dash 1": 1,
        "ADBE Vector Stroke Gap 1": 1,
        "ADBE Vector Stroke Offset": 1,

        // Trim Paths
        "ADBE Vector Filter - Trim": 0,
        "ADBE Vector Trim Start": 1,
        "ADBE Vector Trim End": 1,
        "ADBE Vector Trim Offset": 1,

        // Round Corners
        "ADBE Vector Filter - RC": 0,
        "ADBE Vector RoundCorner Radius": 1,

        // Taper
        "ADBE Vector Filter - Taper": 0,
        "ADBE Vector Stroke Taper": 0,
        "ADBE Vector Taper Start": 1,
        "ADBE Vector Taper End": 1,
        "ADBE Vector Taper Length": 1,
        "ADBE Vector Taper Start Length": 1,
        "ADBE Vector Taper Start Width": 1,
        "ADBE Vector Taper End Length": 1,
        "ADBE Vector Taper End Width": 1,
        "ADBE Vector Taper Start Ease": 1,
        "ADBE Vector Taper End Ease": 1,
        "ADBE Vector Taper Length Units": 1
    };

    // Case 1: Directly mapped in table
    if (leafMatchNames.hasOwnProperty(mm)) {
        if (leafMatchNames[mm] === 1) {
            return true; // definite leaf
        } else {
            // Container → deep walk to inspect children
            try {
                var numProps = prop.numProperties || 0;
                for (var i = 1; i <= numProps; i++) {
                    var child = prop.property(i);
                    if (he_P_leafReader(child, metaPath.concat([mm]))) {
                        return true;
                    }
                }
            } catch (_) {}
            return false;
        }
    }

    // Case 2: No mapping → fall back to AE flag
    var canExpr = false;
    try { canExpr = (prop.canSetExpression === true); } catch (_) {}
    return canExpr;
}


// TRANSLATOR: classify a property's value type safely
function he_P_TR_valueTypeOf(prop) {
    try {
        var t = prop.propertyValueType;
        if (t === PropertyValueType.OneD)   return "OneD";
        if (t === PropertyValueType.TwoD)   return "TwoD";
        if (t === PropertyValueType.ThreeD) return "ThreeD";
        if (t === PropertyValueType.COLOR)  return "Color";
        return "Unsupported"; // shape, text, marker, etc.
    } catch (e) {
        return "Unsupported";
    }
}





// PHANTOM BLOCKER: detect phantom (inactive) Layer Style props
function he_U_PB_isPhantomLayerStyleProp(p) {
  try {
    if (!p) return false;

    // Does this property belong to a Layer Styles group?
    var isLayerStyle = false;
    for (var d = 1; d <= p.propertyDepth; d++) {
      var g = p.propertyGroup(d);
      if (g && g.matchName && g.matchName.indexOf("ADBE Layer Styles") === 0) {
        isLayerStyle = true;
        break;
      }
      if (g && g.name && g.name === "Layer Styles") {
        isLayerStyle = true;
        break;
      }
    }
    if (!isLayerStyle) return false;

    // Phantom detection heuristic:
    // if parent group has no actual sub-properties, it's a ghost
    var parent = p.propertyGroup(p.propertyDepth - 1);
    if (parent && parent.numProperties === 0) {
      return true; // phantom Layer Style
    }

    // Otherwise treat as real style
    return false;
  } catch (e) {
    return false;
  }
}





// V5.1 – Classifier hardened against structural leaves
function he_P_MM_classifyProperty(metaPath) {
    try {
        if (!metaPath || !metaPath.length) return "Unclassified";
        var leaf = metaPath[metaPath.length - 1] || {};
        var matchName = leaf.matchName || "";

        switch (matchName) {
            case "ADBE Position": return "TransformPosition";
            case "ADBE Scale": return "TransformScale";
            case "ADBE Rotate Z":
            case "ADBE Rotation": return "TransformRotation";
            case "ADBE Opacity": return "TransformOpacity";

            // 🎯 SHAPE STROKE/FILL
            case "ADBE Vector Stroke Width": return "StrokeWidth";
            case "ADBE Vector Stroke Opacity": return "StrokeOpacity";
            case "ADBE Vector Stroke Color": return "StrokeColor";
            case "ADBE Vector Fill Opacity": return "FillOpacity";
            case "ADBE Vector Fill Color": return "FillColor";

            // 🎯 DASHES & TRIMS
            case "ADBE Vector Stroke Dash Offset":
            case "ADBE Vector Stroke Offset": return "DashOffset";
            case "ADBE Vector Trim Start": return "TrimStart";
            case "ADBE Vector Trim End": return "TrimEnd";
            case "ADBE Vector Trim Offset": return "TrimOffset";

            // 🎯 SHAPE TRANSFORM
            case "ADBE Vector Position": return "ShapeGroupPosition";
            case "ADBE Vector Scale": return "ShapeGroupScale";
            case "ADBE Vector Rotation": return "ShapeGroupRotation";
            case "ADBE Vector Group Opacity": return "ShapeGroupOpacity";

            // 🎯 SHAPE PATH
            case "ADBE Vector Shape": return "ShapePath";
            // 🚫 Block containers
            case "ADBE Root Vectors Group":
            case "ADBE Vector Group":
            case "ADBE Vector Shape - Group":
                return "SkipStructural";

            // 🎯 FILTERS
            case "ADBE Vector Filter - Repeater": return "Repeater";
            case "ADBE Vector Filter - Offset": return "OffsetPaths";
            case "ADBE Vector Filter - RC": return "RoundCorners";
            case "ADBE Vector RoundCorner Radius": return "RoundCornerRadius";
            case "ADBE Vector Taper Start Length": return "TaperStartLength";
            case "ADBE Vector Taper End Length": return "TaperEndLength";
            case "ADBE Vector Taper Start Width": return "TaperStartWidth";
            case "ADBE Vector Taper End Width": return "TaperEndWidth";
            case "ADBE Vector Filter - Trim": return "TrimPaths";

            default: return "Unclassified";
        }
    } catch (err) {
        return "Unclassified";
    }
}




try {
  logToPanel("✅ host_UTILS.jsx Loaded ⛓️");
} catch (e) {}


