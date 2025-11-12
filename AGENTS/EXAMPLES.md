## SVG elements

### Rules

* All SVGs provided are exported directly from **Adobe Illustrator**.  
  These should be treated as the source of truth for structure and attribute data such as  
  `stroke-linecap`, `stroke-linejoin`, and `stroke-miterlimit`.  
  Codex should preserve these attributes exactly as given, with the exception of `fill`, `stroke`, and `stroke-width`, clarified in the rules below.

* `btn-icon` goes in the SVG class.  

* Lines do not require fills.  
  Elements that do should use `currentColor`.  
  If the user specifies that the element should have a transparent background,  
  then `fill` should be set to `none` where appropriate.  

* `stroke-width` and `stroke` should never be used in the HTML.  
  The color and width of the stroke will be handled exclusively in CSS.

* Code structure and formatting should match the layout shown in the examples exactly.  
  Maintain the same indentation, line breaks, and element spacing so that each attribute, tag, and nested element appears on its own line where demonstrated.  
  Do not condense multiple tags or attributes onto a single line — readability and visual hierarchy take priority over file size.

* Coordinate attributes (such as `x`, `y`, `width`, `height`, or `d`) should remain compact:
  - Keep all coordinate data for a single shape on **one line**.
  - Only split into multiple lines when defining **two or more distinct coordinate sets** (e.g., multiple `<line>` or `<path>` elements).
  - Do not separate a single coordinate sequence across several lines.
  - This maintains both readability and Illustrator's intended vector structure.


* `btn-clearSVG` is the main class used for SVG buttons.  
  CSS rules for this class should not be edited directly.  
  If further rules are required, add another class and create an appendage for it  
  in the CSS **below** the existing `btn-clearSVG` block.  
  Example CSS Appendage:
  ```css
  .btn-clearSVG .new-class-example {
    example contents
  }
  ```
---

  ### EXAMPLES

    #### EXAMPLE 1 (Button):

      ```html
      <button 
      id="[insert appropriate content]" 
      class="btn-clearSVG" 
      type="button"
      title="[brief summary of what the button does, to display on tooltip]"
      aria-label="[insert appropriate content]" 
      >
        <svg 
        class="btn-icon"
        viewBox="[insert appropriate content]"
        >
          
          <path 
            d="[insert path coordinates here on one line]"
            fill="currentColor"
            stroke-miterlimit="[insert relevant]">
          </path>

          <line class="inner-contents" 
            [insert line coordinates here on one line] 
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          <line class="inner-contents" 
            [insert line coordinates here on one line] 
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          <line class="inner-contents" 
            [insert line coordinates here on one line]  
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </button>
  ```

    #### EXAMPLE 2 (Button):

      ```html
      <button 
      id="[insert appropriate content]" 
      class="btn-clearSVG" 
      type="button"
      title="[brief summary of what the button does, to display on tooltip]"
      aria-label="[insert appropriate content]" 
      >

        <svg 
        class="btn-icon"
        viewBox="[insert appropriate content]"
        >
          <path
            d="[insert path coordinates here on one line]"
            fill="currentColor"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          
          <line class="inner-contents"
            [insert line coordinates here on one line]
            stroke-linecap="round"
            stroke-linejoin="round" 
          />

          <circle class="inner-contents"
            [insert circle coordinates here on one line]
            fill="currentColor"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </button>
      ```

    #### EXAMPLE 3 (Checkbox):

      ```html
      <label class="[appropriate class]">
        <input 
        id="[insert appropriate id]"
        type="checkbox" 
        >
        <svg 
        class="btn-icon" 
        viewBox="[insert appropriate content]"
        >

          <rect 
          d="[insert shape data]" 
          fill="currentColor" 
          stroke-miterlimit="[insert relevant]" 
          />
        </svg>
      </label>
      ```

### Three-Part SVG Elements

* Three-part SVG elements should be divided into **three `<g>` groups** representing:
  - `[identifier]-left` → the left section or angled cap  
  - `[identifier]-mid` → the middle rectangular or body section  
  - `[identifier]-right` → the right section or angled cap  

  These groups allow seamless joins between parts while maintaining clean strokes and visual continuity.

* The main identifying class (for example, `.btn-rhombus`, `.btn-hex`, etc.) should either be:
  - **Explicitly specified by the user**, or  
  - **Inferred by the agent** if not provided (using a concise, descriptive identifier).  

  Once an identifier is established, it should be used consistently for **all subclass naming**.  
  For example:  
.btn-[identifier]
.[identifier]-icon
.[identifier]-left
.[identifier]-mid
.[identifier]-right
.[identifier]-icon path
.[identifier]-icon line
.[identifier]-icon rect


This ensures cohesion between the structural grouping and its associated styling layers.

* The **middle section** (`[identifier]-mid`) must not include a full outline stroke.  
- Use `stroke: none` on the `<rect>` inside this group to prevent inner stroke overlap.  
- Instead, define the top and bottom borders using `<line>` elements with `stroke-linecap="round"` for clean alignment.

* Consistent attribute rules apply across all three sections:
- Maintain matching `stroke-miterlimit`, `stroke-linecap`, and `stroke-linejoin` values.
- Preserve any Illustrator-exported structure, only adjusting `fill`, `stroke`, and `stroke-width` per the general rules above.

* The main SVG container should include a unique **icon class** following the same identifier (e.g., `[identifier]-icon`).  
This allows targeted control via CSS selectors without global conflicts.

* CSS generation behavior:
- If the defined identifier already exists, only extend or append **new rules** as needed — do not overwrite working code.  
- If no such class exists, generate a new one using the standard structure.



#### EXAMPLE 4 (Three-Part SVG Element, using `<button>` as an example)

```html
<button 
id="[insert appropriate id]"
class="btn-[identifier]"
type="button"
title="[brief description of what this element does]"
aria-label="[insert appropriate label]"
>
  <svg 
  class="[identifier]-icon"
  xmlns="http://www.w3.org/2000/svg"
  width="[insert width]" height="[insert height]"
  viewBox="[insert appropriate content]"
  >

    <!-- Left section -->
    <g class="[identifier]-left">
      <path d="[insert path coordinates]" fill="currentColor" />
    </g>

    <!-- Middle section -->
    <g class="[identifier]-mid">
      <rect x="[insert]" y="[insert]" width="[insert]" height="[insert]" fill="currentColor" stroke="none" />
      <line x1="[insert]" y1="[insert]" x2="[insert]" y2="[insert]" stroke-linecap="round" />
      <line x1="[insert]" y1="[insert]" x2="[insert]" y2="[insert]" stroke-linecap="round" />
    </g>

    <!-- Right section -->
    <g class="[identifier]-right">
      <path d="[insert path coordinates]" fill="currentColor" />
    </g>

  </svg>
</button>
```