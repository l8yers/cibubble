<script>
  import { onMount } from 'svelte';
  import { supabase } from '$lib/supabaseClient';
  import VideoCard from '$lib/components/VideoCard.svelte';
  import * as utils from '$lib/utils.js';

  export let video; // Pass in the full video object

  let suggestions = [];
  let loading = true;

  // Helper: Shuffle array (fallback in case utils.shuffleArray not imported)
  function shuffle(arr) {
    return arr
      .map(v => [Math.random(), v])
      .sort(([a], [b]) => a - b)
      .map(([, v]) => v);
  }

  // Refetch when video changes
  $: if (video) {
    fetchSuggestions();
  }

  async function fetchSuggestions() {
    loading = true;
    suggestions = [];

    if (video.playlist_id) {
      // In playlist: load rest of playlist, ordered
      const { data: playlistVids } = await supabase
        .from('videos')
        .select('*, playlist:playlist_id(title)')
        .eq('playlist_id', video.playlist_id)
        .neq('id', video.id)
        .order('playlist_position', { ascending: true })
        .limit(20); // Show up to 20, tweak as needed

      suggestions = playlistVids || [];
    } else {
      // Not in playlist: 4 random from channel, 4 random from others
      const { data: sameChannel } = await supabase
        .from('videos')
        .select('*')
        .eq('channel_id', video.channel_id)
        .neq('id', video.id)
        .limit(20); // Get extra for randomness

      const { data: otherChannels } = await supabase
        .from('videos')
        .select('*')
        .neq('channel_id', video.channel_id)
        .limit(40); // Get extra for randomness

      let channelVids = shuffle(sameChannel || []).slice(0, 4);
      let otherVids = shuffle(otherChannels || []).slice(0, 4);
      suggestions = [...channelVids, ...otherVids];
    }

    loading = false;
  }
</script>

<div class="player-sidebar">
  <div class="player-suggestions-label">
    {#if video.playlist_id}
      More from this playlist
    {:else}
      More videos
    {/if}
  </div>
  <div class="player-suggestions-grid">
    {#if loading}
      <div style="color:#aaa; text-align:center; margin:1.7em 0;">Loading…</div>
    {:else if suggestions.length === 0}
      <div style="color:#aaa; text-align:center; margin:1.7em 0;">No suggestions found.</div>
    {:else}
      {#each suggestions as v}
        <VideoCard
          video={v}
          getBestThumbnail={utils.getBestThumbnail}
          difficultyColor={utils.difficultyColor}
          difficultyLabel={utils.difficultyLabel}
          formatLength={utils.formatLength}
          filterByChannel={null}
          filterByPlaylist={null}
        />
      {/each}
    {/if}
  </div>
</div>

<style>
.player-sidebar {
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
  min-width: 0;
  width: 100%;
}
.player-suggestions-label {
  font-size: 1.10em;
  font-weight: 700;
  color: var(--text-secondary, #666);
  margin-bottom: 6px;
  margin-top: 2px;
  letter-spacing: 0.01em;
}
.player-suggestions-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.1rem;
}
@media (max-width: 1200px) {
  .player-suggestions-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 1.1rem;
  }
}
@media (max-width: 800px) {
  .player-suggestions-grid {
    grid-template-columns: 1fr;
    gap: 0.65rem;
  }
}
</style>
