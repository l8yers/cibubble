<script>
  import { onMount } from 'svelte';
  import { supabase } from '$lib/supabaseClient';

  export let currentVideo;  // expects { id, playlist_id, channel_id, ... }
  export let limit = 10;

  let suggestions = [];
  let loading = true;
  let error = "";

  async function fetchSuggestions() {
    loading = true;
    suggestions = [];
    error = "";

    try {
      // If in a playlist, fetch the rest of the playlist, ordered by playlist_position
      if (currentVideo.playlist_id) {
        const { data, error: err } = await supabase
          .from('videos')
          .select('*')
          .eq('playlist_id', currentVideo.playlist_id)
          .neq('id', currentVideo.id)
          .order('playlist_position', { ascending: true })
          .limit(limit);

        if (err) throw err;
        suggestions = data || [];
      } else if (currentVideo.channel_id) {
        // Otherwise, fetch random videos from the same channel
        const { data, error: err } = await supabase
          .from('videos')
          .select('*')
          .eq('channel_id', currentVideo.channel_id)
          .neq('id', currentVideo.id)
          .order('created', { ascending: false }); // Get latest, shuffle locally

        if (err) throw err;
        // Shuffle and limit
        suggestions = (data || []).sort(() => Math.random() - 0.5).slice(0, limit);
      }
    } catch (err) {
      error = err.message || "Failed to load suggestions.";
    } finally {
      loading = false;
    }
  }

  // Watch for video changes (useful if routed dynamically)
  $: if (currentVideo) fetchSuggestions();
</script>

<aside class="sidebar-suggestions">
  {#if loading}
    <div class="sidebar-loading">Loading suggestions…</div>
  {:else if error}
    <div class="sidebar-error">{error}</div>
  {:else if suggestions.length === 0}
    <div class="sidebar-none">No suggestions found.</div>
  {:else}
    <div class="sidebar-list">
      {#each suggestions as video}
        <a class="sidebar-card" href={`/video/${video.id}`}>
          <img
            class="sidebar-thumb"
            src={`https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`}
            alt={video.title}
            loading="lazy"
            on:error={(e) => (e.target.src = '/images/no_thumb_nail.png')}
          />
          <div class="sidebar-meta">
            <div class="sidebar-title">{video.title}</div>
            <div class="sidebar-row">
              <span class="sidebar-level">{video.level}</span>
              {#if video.length}
                <span class="sidebar-duration">{Math.floor(video.length / 60)}:{(video.length % 60).toString().padStart(2, '0')}</span>
              {/if}
            </div>
          </div>
        </a>
      {/each}
    </div>
  {/if}
</aside>

<style>
.sidebar-suggestions {
  display: flex;
  flex-direction: column;
  gap: 1.1em;
  min-width: 240px;
  max-width: 380px;
  width: 100%;
  background: transparent;
}

.sidebar-loading,
.sidebar-error,
.sidebar-none {
  color: #888;
  padding: 1.5em 0;
  text-align: center;
  font-size: 1.02em;
}

.sidebar-list {
  display: flex;
  flex-direction: column;
  gap: 0.68em;
}
.sidebar-card {
  display: flex;
  flex-direction: row;
  background: #fff;
  border-radius: 9px;
  box-shadow: 0 2px 7px #e8e8e830;
  border: 1px solid #ededed;
  overflow: hidden;
  text-decoration: none;
  color: #232323;
  align-items: flex-start;
  gap: 0.5em;
  min-width: 0;
  transition: background 0.13s, box-shadow 0.13s;
}
.sidebar-card:hover {
  background: #f7f7fa;
  box-shadow: 0 5px 16px #e93c2f18;
}
.sidebar-thumb {
  width: 96px;
  min-width: 96px;
  height: 54px;
  aspect-ratio: 16/9;
  object-fit: cover;
  background: #ececec;
  border-radius: 9px 0 0 9px;
}
.sidebar-meta {
  flex: 1;
  padding: 0.39em 0.44em 0.39em 0.17em;
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.sidebar-title {
  font-size: 1.01em;
  font-weight: 700;
  margin-bottom: 0.15em;
  line-height: 1.16;
  max-height: 2.18em;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}
.sidebar-row {
  display: flex;
  align-items: center;
  gap: 0.6em;
  font-size: 0.97em;
}
.sidebar-level {
  color: #e93c2f;
  font-weight: 600;
  background: #ffe6e4;
  padding: 0.10em 0.55em;
  border-radius: 6px;
  font-size: 0.89em;
}
.sidebar-duration {
  color: #555;
  font-size: 0.89em;
  margin-left: auto;
}
</style>
