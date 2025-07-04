<!-- BubbleLoader.svelte -->
<svg width="70" height="22" style="display: block; margin: 2em auto;">
  <circle cx="12" cy="12" r="9" fill="#e93c2f">
    <animate attributeName="cy" values="12;4;12" dur="0.7s" repeatCount="indefinite"/>
  </circle>
  <circle cx="35" cy="12" r="9" fill="#31b361">
    <animate attributeName="cy" values="12;20;12" dur="0.7s" begin="0.2s" repeatCount="indefinite"/>
  </circle>
  <circle cx="58" cy="12" r="9" fill="#f4a000">
    <animate attributeName="cy" values="12;4;12" dur="0.7s" begin="0.4s" repeatCount="indefinite"/>
  </circle>
</svg>
