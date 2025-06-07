<script>
  import { onMount, onDestroy } from 'svelte';
  import { supabase } from '$lib/supabaseClient';
  import { page } from '$app/stores';

  let video = null;
  let suggestions = [];
  let loading = true;
  let user = null;

  $: id = $page.params.id;

  // --- Fetch user, video, and suggestions ---
  onMount(async () => {
    // Get logged-in user
    const { data: sess } = await supabase.auth.getSession();
    user = sess.session?.user ?? null;

    // Fetch main video
    const { data: vid } = await supabase
      .from('videos')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    video = vid;

    // Fetch sidebar suggestions
    const { data: suggs } = await supabase
      .from('videos')
      .select('*')
      .order('created', { ascending: false })
      .neq('id', id)
      .limit(12);
    suggestions = suggs || [];
    loading = false;

    // --- YouTube API setup ---
    window.onYouTubeIframeAPIReady = onYouTubeIframeAPIReady;
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = "https://www.youtube.com/iframe_api";
      document.body.appendChild(tag);
    } else {
      ytReady = true;
    }
  });

  // --- Watch time tracking logic ---
  let player;
  let ytReady = false;
  let watchSeconds = 0;
  let pollingInterval = null;
  let lastTime = 0;

  function onYouTubeIframeAPIReady() {
    ytReady = true;
    initPlayer();
  }

  $: if (ytReady && !player) initPlayer();

  function initPlayer() {
    if (player || !document.getElementById('yt-player')) return;
    player = new window.YT.Player('yt-player', {
      events: { 'onStateChange': onPlayerStateChange }
    });
  }

  function startWatchTimer() {
    if (!pollingInterval && player) {
      lastTime = player.getCurrentTime?.() || 0;
      pollingInterval = setInterval(() => {
        const currentTime = player.getCurrentTime?.() || 0;
        let delta = currentTime - lastTime;
        if (delta < 0) delta = 0;      // If jumped back, ignore
        if (delta > 5) delta = 1;      // If skipped, only count 1s
        watchSeconds += delta;
        lastTime = currentTime;
        if (Math.floor(watchSeconds) % 5 === 0) saveWatchTime();
      }, 1000);
    }
  }

  function stopWatchTimer() {
    if (pollingInterval) {
      clearInterval(pollingInterval);
      pollingInterval = null;
      saveWatchTime();
    }
  }

  async function saveWatchTime() {
    if (!user) return;
    const today = new Date().toISOString().slice(0, 10);
    await supabase.from('watch_sessions').upsert({
      user_id: user.id,
      video_id: id,
      seconds: Math.floor(watchSeconds),
      date: today
    }, { onConflict: ['user_id', 'video_id', 'date'] });
  }

  function onPlayerStateChange(event) {
    // 1: playing, 2: paused, 0: ended
    if (event.data === 1) startWatchTimer();
    else stopWatchTimer();
  }

  onDestroy(() => stopWatchTimer());
</script>

<style>
.player-page {
  display: flex;
  gap: 2rem;
  max-width: 1200px;
  margin: 2.3rem auto 2.3rem auto;
  color: #181818;
  background: #fff;
  min-height: 75vh;
}
.player-main {
  flex: 1 1 66%;
  min-width: 0;
}
.player-embed {
  width: 100%;
  aspect-ratio: 16/9;
  background: #eee;
  border-radius: 12px;
  margin-bottom: 1.5rem;
  border: 1px solid #ececec;
}
.player-title {
  font-size: 1.32rem;
  font-weight: bold;
  margin-bottom: 0.3em;
}
.player-channel {
  font-size: 1rem;
  color: #666;
  margin-bottom: 1.1em;
}
.suggestions {
  flex: 0 0 340px;
  max-width: 340px;
  display: flex;
  flex-direction: column;
  gap: 1.09rem;
}
.suggest-card {
  display: flex;
  gap: 0.8em;
  background: #fafafa;
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid #ececec;
  transition: background 0.16s;
  cursor: pointer;
}
.suggest-card:hover {
  background: #ffeaea;
  border-color: #ffd4d4;
}
.suggest-thumb {
  width: 120px;
  aspect-ratio: 16/9;
  object-fit: cover;
  background: #eee;
}
.suggest-body {
  flex: 1;
  padding: 0.4em 0.6em 0.2em 0.3em;
  display: flex;
  flex-direction: column;
  justify-content: center;
}
.suggest-title {
  font-size: 1.01rem;
  font-weight: 600;
  color: #181818;
  line-height: 1.1;
  margin-bottom: 0.17em;
  max-height: 2.1em;
  overflow: hidden;
  text-overflow: ellipsis;
}
.suggest-channel {
  color: #666;
  font-size: 0.93rem;
}
@media (max-width: 900px) {
  .player-page { flex-direction: column; }
  .suggestions { flex-direction: row; max-width: unset; gap: 0.8em; margin-top: 1.5rem;}
  .suggest-card { flex-direction: column; width: 150px; min-width: 120px;}
  .suggest-thumb { width: 100%; }
}
</style>

{#if loading}
  <p style="text-align:center; margin-top:3rem;">Loading…</p>
{:else if !video}
  <p style="text-align:center; margin-top:3rem;">Video not found.</p>
{:else}
  <div class="player-page">
    <div class="player-main">
      <div class="player-embed">
        <iframe
          id="yt-player"
          width="100%"
          height="100%"
          src={`https://www.youtube.com/embed/${video.id}?enablejsapi=1`}
          title={video.title}
          frameborder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowfullscreen
        ></iframe>
      </div>
      <div class="player-title">{video.title}</div>
      <div class="player-channel">{video.channel_name}</div>
    </div>
    <aside class="suggestions">
      {#each suggestions as v}
        <a class="suggest-card" href={`/video/${v.id}`}>
          <img
            class="suggest-thumb"
            src={`https://i.ytimg.com/vi/${v.id}/hqdefault.jpg`}
            alt={v.title}
            on:error="{(e) => e.target.src='https://placehold.co/120x67?text=No+Thumb'}"
          />
          <div class="suggest-body">
            <div class="suggest-title">{v.title}</div>
            <div class="suggest-channel">{v.channel_name}</div>
          </div>
        </a>
      {/each}
    </aside>
  </div>
{/if}
