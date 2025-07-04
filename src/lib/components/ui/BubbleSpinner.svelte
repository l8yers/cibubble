<!-- BubbleLoader.svelte -->
<svg width="70" height="30" style="display: block; margin: 2em auto;">
  <circle cx="12" cy="12" r="9" fill="#16a34a">
    <animate attributeName="cy" values="12;4;12" dur="0.7s" repeatCount="indefinite"/>
  </circle>
  <circle cx="35" cy="12" r="9" fill="#f59e0b">
    <animate attributeName="cy" values="12;20;12" dur="0.7s" begin="0.2s" repeatCount="indefinite"/>
  </circle>
  <circle cx="58" cy="12" r="9" fill="#eb1000">
    <animate attributeName="cy" values="12;4;12" dur="0.7s" begin="0.4s" repeatCount="indefinite"/>
  </circle>
</svg>
