



btn-icon goes in the svg class.

stroke-miterlimit may be necessary. It depends on if angular sharpness is required. If the user has not specifed then look at the coordinates for intentional sharp angles. If such angles are percieved, include it where appropriate. If not, do not include it.




  ### EXAMPLE 2:


    <button 
    id="bankSelectBtn" 
    class="btn-clearSVG" 
    title="Select Bank"
    >
      <svg 
      class="btn-icon"
      viewBox="[fill as appropriate]"
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



  ### EXAMPLE 2:

    <button 
    id="[fill as appropriate]" 
    class="[fill as appropriate]" 
    type="button" 
    aria-label="[fill as appropriate]" 
    title="[brief summary of what the button does, to display on tooltip]"
    >

      <svg 
      class="btn-icon"
      viewBox="[fill as appropriate]"
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
