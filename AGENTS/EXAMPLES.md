## SVG Buttons

  ### Rules

  * "btn-icon" goes in the svg class.

  * stroke-miterlimit may be necessary. It depends on if angular sharpness is required. If the user has not specifed then look at the coordinates for intentional sharp angles. If such angles are percieved, include it where appropriate. If not, do not include it.

  * lines don't need fills, elements that do should use "currentColor". If the user specified that they want the button to have a transparent background, then fill should be set to "none" where appropriate.

  * "btn-clearSVG" is the main class used for svg buttons. CSS rules should not be touched for this class at all. If further rules are required then add another class, and add an appendage for it in the CSS and put it below the already exisiting "btn-clearSVG" block. 
      Example CSS Appendage: 
      ```css
      .btn-clearSVG .new-class-example { example contents } 
    ```
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
            stroke-miterlimit="10">
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