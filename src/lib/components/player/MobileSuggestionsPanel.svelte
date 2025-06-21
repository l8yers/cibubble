<script>
  export let open = false;
  export let suggestions = [];
  export let onClose = () => {};

  // Optional: fallback for missing thumbnails
  function getThumb(suggestion) {
    return suggestion.thumbnail_url || '/default-thumb.jpg';
  }

  // Optional: formats duration in minutes:seconds
  function formatDuration(seconds) {
    if (!seconds) return '';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }
</script>

{#if open}
  <div class="mobile-suggestions-overlay" on:click={onClose}>
    <div class="mobile-suggestions-panel" on:click|stopPropagation>
      <div class="panel-header">
        <span>More videos like this</span>
        <button class="close-btn" on:click={onClose} aria-label="Close suggestions">✕</button>
      </div>
      <div class="suggestions-list">
        {#each suggestions as suggestion (suggestion.id)}
          <a class="suggestion-link" href={"/video/" + suggestion.id}>
            <div class="suggestion-card">
              <img
                class="thumb"
                src={getThumb(suggestion)}
                alt="Video thumbnail"
                loading="lazy"
              />
              <div class="info">
                <div class="title">{suggestion.title}</div>
                <div class="meta">
                  {#if suggestion.level}
                    <span class="level">{suggestion.level}</span>
                  {/if}
                  {#if suggestion.duration}
                    <span class="length">{formatDuration(suggestion.duration)}</span>
                  {/if}
                  {#if suggestion.channel?.name}
                    <span class="channel">{suggestion.channel.name}</span>
                  {/if}
                </div>
              </div>
            </div>
          </a>
        {/each}
        {#if suggestions.length === 0}
          <div class="no-suggestions">No other videos found.</div>
        {/if}
      </div>
    </div>
  </div>
{/if}

<style>
@media (max-width: 800px) {
  .mobile-suggestions-overlay {
    position: fixed;
    inset: 0;
    background: #13131bbd;
    z-index: 3000;
    display: flex;
    justify-content: flex-end;
    align-items: flex-end;
  }
  .mobile-suggestions-panel {
    background: #fff;
    width: 100vw;
    max-height: 88vh;
    border-top-left-radius: 18px;
    border-top-right-radius: 18px;
    padding: 1.2em 0.8em 0.8em 0.8em;
    box-shadow: 0 -6px 22px #0005;
    overflow-y: auto;
    animation: slideUp 0.24s cubic-bezier(.33,.85,.49,1.14);
  }
  @keyframes slideUp {
    from { transform: translateY(90vh);}
    to   { transform: translateY(0);}
  }
  .panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 1.13em;
    font-weight: 700;
    margin-bottom: 0.9em;
    padding: 0 0.2em;
  }
  .panel-header .close-btn {
    background: none;
    border: none;
    font-size: 1.5em;
    color: #9696af;
    cursor: pointer;
    margin-left: 1em;
    line-height: 1;
  }
  .suggestions-list {
    display: flex;
    flex-direction: column;
    gap: 0.95em;
    padding-bottom: 1em;
  }
  .suggestion-link {
    text-decoration: none;
    color: inherit;
    display: block;
    border-radius: 11px;
    transition: background 0.16s;
  }
  .suggestion-link:active {
    background: #f3f4fa;
  }
  .suggestion-card {
    display: flex;
    gap: 0.8em;
    background: #f7f8fa;
    border-radius: 10px;
    box-shadow: 0 2px 10px #0001;
    padding: 0.7em;
    align-items: center;
    transition: background 0.15s;
  }
  .suggestion-card:hover {
    background: #e8f0fc;
  }
  .thumb {
    width: 92px;
    height: 52px;
    object-fit: cover;
    border-radius: 8px;
    background: #ddd;
    flex-shrink: 0;
  }
  .info {
    flex: 1 1 0;
    display: flex;
    flex-direction: column;
    justify-content: center;
    min-width: 0;
  }
  .title {
    font-size: 1.04em;
    font-weight: 600;
    margin-bottom: 0.31em;
    line-height: 1.18;
    overflow-wrap: anywhere;
  }
  .meta {
    font-size: 0.92em;
    color: #7c7c9a;
    display: flex;
    gap: 0.7em;
    flex-wrap: wrap;
    align-items: center;
  }
  .level {
    font-weight: 600;
    color: #fd4949;
    text-transform: capitalize;
  }
  .channel {
    color: #7878b2;
    font-weight: 500;
  }
  .length {
    color: #aaa;
  }
  .no-suggestions {
    padding: 1.5em;
    text-align: center;
    color: #b6b8c0;
  }
}
</style>
