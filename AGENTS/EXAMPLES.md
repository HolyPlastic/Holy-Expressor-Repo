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

* `btn-clearSVG` is the main class used for SVG elements.  
  CSS rules for this class should not be edited directly.  
  If further rules are required, add another class and create an appendage for it  
  in the CSS **below** the existing `btn-clearSVG` block.  

* Code structure and formatting should match the layout shown in the examples exactly.  
  Maintain the same indentation, line breaks, and element spacing so that each attribute, tag, and nested element appears on its own line where demonstrated.  
  Do not condense multiple tags or attributes onto a single line — readability and visual hierarchy take priority over file size.



  Example CSS Appendage:  

  ```css
  .btn-clearSVG .new-class-example {
    example contents
  }

---

  ### EXAMPLES

    #### EXAMPLE 1:

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
            d="[insert path coordinates here]"
            fill="currentColor"
            stroke-miterlimit="[insert relevant]">
          </path>

          <line class="inner-contents" 
            [insert line coordinates here] 
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          <line class="inner-contents" 
            [insert line coordinates here] 
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          <line class="inner-contents" 
            [insert line coordinates here]  
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </button>
      ```


    #### EXAMPLE 2:

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
            d="[insert path coordinates here]"
            fill="currentColor"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          
          <line class="inner-contents"
            [insert line coordinates here]
            stroke-linecap="round"
            stroke-linejoin="round" 
          />

          <circle class="inner-contents"
            [insert circle coordinates here]
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