<script>
  import { onMount } from 'svelte';
  import { user, loadUser } from '$lib/stores/user.js';
  import { supabase } from '$lib/supabaseClient.js';
  import * as utils from '$lib/utils/utils.js';

  let watchedVideos = [];
  let loading = true;

  function formatDateTime(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
  }

  $: if ($user) fetchWatched();

  async function fetchWatched() {
    loading = true;
    let { data: sessions } = await supabase
      .from('watch_sessions')
      .select('video_id, inserted_at')
      .eq('user_id', $user.id);

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

    let { data: vids } = await supabase.from('videos').select('*').in('id', videoIds);

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
  <div class="history-progress-layout">
    <div class="history-header-row">
      <div class="history-title">Watched Videos</div>
      <a href="/progress" class="back-link">← Back to Progress</a>
    </div>
    {#if loading}
      <div class="history-loading">Loading...</div>
    {:else if watchedVideos.length === 0}
      <div class="history-empty">You haven’t watched any videos yet.</div>
    {:else}
      <ul class="watched-list">
        {#each watchedVideos as video}
          <li class="watched-card">
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
:root {
  --history-bg: #f7f8fc;
  --history-card-bg: #fff;
  --history-card-border: #ededf2;
  --history-card-shadow: 0 3px 22px 0 #e9eaee18;
  --history-title: #181d27;
  --history-link: #e93c2f;
  --history-link-hover: #fd6c6c;
  --history-channel: #232338;
  --history-meta: #6c7591;
}

.history-progress-layout {
  max-width: 880px;
  margin: 2.5em auto 2em auto;
  padding: 0 1.5em 2em 1.5em;
  background: var(--history-bg);
  border-radius: 22px;
  box-sizing: border-box;
  min-height: 70vh;
}

.history-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.5em;
  padding-top: 2.5em;
  padding-bottom: 1.2em;
}

.history-title {
  font-size: 1.38rem;
  font-weight: 900;
  color: var(--history-title);
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.back-link {
  color: var(--history-link);
  font-size: 1.02em;
  text-decoration: none;
  font-weight: 700;
  padding: 0.17em 0.4em;
  border-radius: 6px;
  transition: color 0.13s, background 0.13s;
  background: none;
}
.back-link:hover,
.back-link:focus {
  color: var(--history-link-hover);
  background: #fff3f1;
  text-decoration: underline;
  outline: none;
}

.history-loading, .history-empty {
  text-align: center;
  font-size: 1.11em;
  color: #6c7591;
  margin: 2.5em 0 1.8em 0;
  font-weight: 600;
}

.watched-list {
  display: flex;
  flex-direction: column;
  gap: 1.4em;
  margin: 0;
  padding: 0;
  width: 100%;
}

.watched-card {
  background: var(--history-card-bg);
  border-radius: 18px;
  box-shadow: var(--history-card-shadow);
  padding: 1.3em 1.7em 1.1em 1.7em;
  border: 1.2px solid var(--history-card-border);
  display: flex;
  align-items: flex-start;
  gap: 1.3em;
  min-width: 0;
  transition: box-shadow 0.18s;
}

.watched-thumb-link {
  flex-shrink: 0;
  width: 150px;
  min-width: 100px;
  display: block;
}
.watched-thumb {
  width: 150px;
  aspect-ratio: 16/9;
  object-fit: cover;
  border-radius: 12px;
  background: #eee;
  min-height: 84px;
  display: block;
}

.watched-details {
  flex: 1 1 0;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 0.25em;
}

.watched-title {
  font-size: 1.13rem;
  font-weight: 800;
  color: var(--history-title);
  text-decoration: none;
  line-height: 1.18;
  display: block;
  margin-bottom: 0.18em;
  overflow-wrap: anywhere;
  letter-spacing: 0.01em;
  transition: none;
  cursor: pointer;
}

.watched-meta {
  font-size: 0.97em;
  color: var(--history-meta);
  margin-top: 0.08em;
  display: flex;
  gap: 1.6em;
  flex-wrap: wrap;
  align-items: center;
  letter-spacing: 0.01em;
}

.watched-channel {
  color: var(--history-channel);
  font-weight: 700;
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
  max-width: 210px;
  display: inline-block;
  font-size: 1em;
}

.watched-date {
  color: #9aa1c2;
  font-size: 0.99em;
  font-weight: 500;
}

@media (max-width: 900px) {
  .history-progress-layout {
    padding: 0 0.5em 1.2em 0.5em;
    border-radius: 13px;
    min-height: 60vh;
  }
  .history-header-row {
    gap: 0.6em;
    padding-top: 1.2em;
    padding-bottom: 1.1em;
  }
  .watched-card {
    gap: 0.7em;
    padding: 1em 0.6em 1em 0.6em;
    border-radius: 10px;
  }
  .watched-thumb-link {
    width: 32vw;
    min-width: 62px;
  }
  .watched-thumb {
    width: 32vw;
    min-width: 62px;
    min-height: 32px;
    border-radius: 7px;
  }
  .watched-title {
    font-size: 0.99rem;
  }
}
@media (max-width: 600px) {
  .history-progress-layout {
    padding: 0 0.13em 1.1em 0.13em;
    border-radius: 8px;
    min-height: 55vh;
  }
  .history-title {
    font-size: 1.08rem;
  }
  .watched-title {
    font-size: 0.8rem;
    margin-bottom: 0.11em;
    font-weight: 700;
    letter-spacing: 0.005em;
  }
  .watched-meta {
    font-size: 0.81em;
    gap: 0.7em;
    margin-top: 0.03em;
  }
  .watched-channel {
    font-size: 0.86em;
    max-width: 110px;
    font-weight: 700;
  }
  .watched-date {
    font-size: 0.8em;
  }
}

:global(body.dark) {
  --history-bg: #181d27;
  --history-card-bg: #232338;
  --history-card-border: #303054;
  --history-card-shadow: 0 3px 22px 0 #10122444;
  --history-title: #fff;
  --history-link: #e93c2f;
  --history-link-hover: #fd6c6c;
  --history-channel: #efeff9;
  --history-meta: #bfc3d7;
}
</style>
