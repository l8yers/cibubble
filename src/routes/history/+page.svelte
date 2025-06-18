<script>
  import { onMount } from 'svelte';
  import { user, loadUser } from '$lib/stores/user.js';
  import { supabase } from '$lib/supabaseClient.js';
  import * as utils from '$lib/utils.js';

  let watchedVideos = [];
  let loading = true;

  // For nice formatting
  function formatDateTime(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
  }

  $: if ($user) fetchWatched();

  async function fetchWatched() {
    loading = true;
    // 1. Get all sessions for this user
    let { data: sessions } = await supabase
      .from('watch_sessions')
      .select('video_id, inserted_at')
      .eq('user_id', $user.id);

    // 2. Keep only the most recent session per video
    const videoMap = {};
    for (const ws of sessions ?? []) {
      if (!videoMap[ws.video_id] || ws.inserted_at > videoMap[ws.video_id]) {
        videoMap[ws.video_id] = ws.inserted_at;
      }
    }
    const videoIds = Object.keys(videoMap);

    if (!videoIds.length) {
      watchedVideos = [];
      loading = false;
      return;
    }

    // 3. Fetch video info for all watched videos
    let { data: vids } = await supabase.from('videos').select('*').in('id', videoIds);

    // 4. Map and sort
    watchedVideos = (vids || [])
      .map(v => ({
        ...v,
        lastWatched: videoMap[v.id]
      }))
      .sort((a, b) => b.lastWatched.localeCompare(a.lastWatched));
    loading = false;
  }

  onMount(() => loadUser());
</script>

{#if !$user}
  <div class="history-main" style="text-align:center;">
    <div style="margin:2em 0;">
      Not logged in.<br /><a href="/login" class="video-link">Login here</a>
    </div>
  </div>
{:else}
  <div class="history-main">
    <div class="history-header-row">
      <a href="/progress" class="back-link">← Back to Progress</a>
      <div class="history-title">All Watched Videos</div>
    </div>
    {#if loading}
      <div>Loading...</div>
    {:else if watchedVideos.length === 0}
      <div style="margin:2em 0;">You haven’t watched any videos yet.</div>
    {:else}
      <ul class="watched-list">
        {#each watchedVideos as video}
          <li class="watched-row">
            <a href={`/video/${video.id}`} class="watched-thumb-link">
              <img
                class="watched-thumb"
                src={utils.getBestThumbnail(video)}
                alt={video.title}
                loading="lazy"
                on:error={(e) => e.target.src = '/images/no_thumb_nail.png'}
              />
            </a>
            <div class="watched-details">
              <a href={`/video/${video.id}`} class="watched-title">{video.title}</a>
              <div class="watched-meta">
                <span class="watched-channel">{video.channel?.name ?? video.channel_name}</span>
                <span class="watched-date">Last watched: {formatDateTime(video.lastWatched)}</span>
              </div>
            </div>
          </li>
        {/each}
      </ul>
    {/if}
  </div>
{/if}

<style>
.history-main {
  max-width: 780px;
  margin: 2.5rem auto 0 auto;
  padding: 2.3rem 3vw 2.6rem 3vw;
  background: #fff;
  border-radius: 14px;
  border: 1px solid #ececec;
  box-shadow: 0 2px 12px #ececec;
}
.history-header-row {
  display: flex;
  align-items: center;
  gap: 2em;
  margin-bottom: 2.2em;
}
.history-title {
  font-size: 1.25rem;
  font-weight: bold;
  color: #1c1c1c;
  letter-spacing: 0.3px;
}
.back-link {
  color: #2562e9;
  font-size: 1.04em;
  text-decoration: none;
  font-weight: 500;
}
.watched-list {
  list-style: none;
  margin: 0;
  padding: 0;
  width: 100%;
}
.watched-row {
  display: flex;
  align-items: flex-start;
  gap: 1.3em;
  padding: 1.2em 0;
  border-bottom: 1px solid #ececec;
}
.watched-thumb-link {
  flex-shrink: 0;
}
.watched-thumb {
  width: 120px;
  aspect-ratio: 16/9;
  object-fit: cover;
  border-radius: 6px;
  background: #eee;
  min-height: 67px;
  display: block;
}
.watched-details {
  flex: 1;
  min-width: 0;
}
.watched-title {
  font-size: 1.11rem;
  font-weight: 700;
  color: #222;
  text-decoration: none;
  line-height: 1.17;
  display: block;
  margin-bottom: 0.27em;
  overflow-wrap: anywhere;
}
.watched-meta {
  font-size: 0.98em;
  color: #666;
  margin-top: 0.2em;
  display: flex;
  gap: 2.1em;
  flex-wrap: wrap;
  align-items: center;
}
.watched-channel {
  color: #2e9be6;
  font-weight: 600;
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
  max-width: 160px;
  display: inline-block;
}
.watched-date {
  color: #888;
  font-size: 0.97em;
}
@media (max-width: 600px) {
  .history-main {
    padding: 0.9rem 2vw 1.2rem 2vw;
    border-radius: 8px;
  }
  .watched-row {
    gap: 0.6em;
    padding: 0.6em 0;
  }
  .watched-thumb {
    width: 24vw;
    min-width: 58px;
    min-height: 32px;
  }
  .watched-title {
    font-size: 0.98rem;
  }
}
</style>
