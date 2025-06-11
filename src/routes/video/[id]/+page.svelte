<script>
  import { onMount } from 'svelte';
  import { supabase } from '$lib/supabaseClient';
  import { page } from '$app/stores';
  import VideoWatchTracker from '$lib/components/VideoWatchTracker.svelte';

  let video = null;
  let suggestions = [];
  let loading = true;
  let user = null;

  $: id = $page.params.id;

  onMount(async () => {
    const { data: sess } = await supabase.auth.getSession();
    user = sess.session?.user ?? null;

    // Fetch video
    const { data: vid } = await supabase
      .from('videos')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    video = vid;

    // Fetch suggestions (sidebar)
    const { data: suggs } = await supabase
      .from('videos')
      .select('*')
      .order('created', { ascending: false })
      .neq('id', id)
      .limit(8);
    suggestions = suggs || [];
    loading = false;
  });

  function formatVideoDuration(sec) {
    sec = Math.round(sec);
    if (isNaN(sec) || sec <= 0) return '0:00';
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return m + ':' + (s < 10 ? '0' : '') + s;
  }
  function badgeProps(level) {
    if (!level) return { label: "Not Yet Rated", color: "#d4d4d4", text: "#888" };
    switch (level.trim().toLowerCase()) {
      case "superbeginner":
      case "super beginner":   return { label: "Super Beginner", color: "#16a800", text: "#fff" };
      case "beginner":         return { label: "Beginner",       color: "#2f6ae9", text: "#fff" };
      case "intermediate":     return { label: "Intermediate",   color: "#f9ae17", text: "#fff" };
      case "advanced":         return { label: "Advanced",       color: "#7d2fe9", text: "#fff" };
      default:                 return { label: "Not Yet Rated",  color: "#d4d4d4", text: "#888" };
    }
  }
</script>

<style>
:global(html) {
  font-family: 'Inter', 'Segoe UI', Arial, sans-serif;
  background: #f6f7fa;
}
.player-youtube-layout {
  display: flex;
  align-items: flex-start;
  gap: 38px;
  max-width: 1700px;
  margin: 0 auto;
  padding: 48px 0 36px 42px;
  background: #f6f7fa;
  min-height: 100vh;
}
@media (max-width: 1200px) {
  .player-youtube-layout { flex-direction: column; gap: 26px; padding: 36px 0 26px 0; }
}
.player-main-left {
  width: 960px;
  min-width: 0;
  flex: 1 1 960px;
  margin-right: 12px;
}
@media (max-width: 1200px) {
  .player-main-left { width: 100%; margin-right: 0; }
}
.player-embed {
  width: 100%;
  aspect-ratio: 16/9;
  border-radius: 16px;
  background: #fff;
  box-shadow: 0 2px 24px #e0e0e0;
  margin-bottom: 22px;
  border: 1.7px solid #ededed;
}
.player-title {
  color: #1a1a1a;
  font-size: 1.38rem;
  font-weight: 800;
  line-height: 1.21;
  margin-bottom: 11px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  min-height: 2.7em;
  max-height: 2.7em;
}
.player-meta-row {
  display: flex;
  align-items: center;
  gap: 0.7em;
  margin-bottom: 10px;
}
.player-diff-badge {
  font-size: 0.98em;
  font-weight: 700;
  padding: 0.22em 1.04em;
  border-radius: 13px;
  letter-spacing: 0.01em;
  display: inline-block;
  white-space: nowrap;
  border: none;
  box-shadow: 0 1px 4px #e0e0e0;
}
.player-channel {
  font-size: 1.04rem;
  color: #777;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 180px;
}
.player-duration {
  font-size: 0.96em;
  color: #adadad;
  margin-left: auto;
  margin-right: 0;
}
.suggestions-sidebar {
  width: 370px;
  min-width: 310px;
  max-width: 400px;
  padding-right: 24px;
  display: flex;
  flex-direction: column;
  gap: 13px;
}
@media (max-width: 1200px) {
  .suggestions-sidebar {
    width: 100%;
    min-width: 0;
    max-width: unset;
    padding-right: 0;
    flex-direction: row;
    overflow-x: auto;
  }
}
.suggest-card {
  display: flex;
  flex-direction: row;
  gap: 0.9em;
  background: #fff;
  border-radius: 11px;
  overflow: hidden;
  border: 1.1px solid #ededed;
  transition: box-shadow 0.13s, transform 0.09s, background 0.13s;
  cursor: pointer;
  min-width: 0;
  box-shadow: 0 2px 10px #eaeaea40;
  text-decoration: none;
  align-items: flex-start;
  height: 87px;
}
.suggest-card:hover {
  background: #f8f8fd;
  box-shadow: 0 6px 18px #e93c2f09;
  transform: translateY(-1.5px) scale(1.015);
}
.suggest-thumb-wrap {
  position: relative;
  width: 154px;
  min-width: 154px;
  height: 87px;
  display: flex;
}
.suggest-thumb {
  width: 154px;
  height: 87px;
  aspect-ratio: 16/9;
  object-fit: cover;
  background: #ededed;
  border-radius: 11px 0 0 11px;
  display: block;
}
.suggest-thumb-duration {
  position: absolute;
  right: 0.6em;
  bottom: 0.52em;
  background: #111a;
  color: #fff;
  font-size: 0.91em;
  font-weight: 600;
  padding: 0.09em 0.53em;
  border-radius: 5px;
  opacity: 0.79;
  z-index: 2;
  user-select: none;
  pointer-events: none;
}
.suggest-body {
  flex: 1;
  padding: 0.51em 0.6em 0.33em 0.12em;
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-width: 0;
  color: #232323;
}
.suggest-title {
  font-size: 1.01rem;
  font-weight: 700;
  color: #232323;
  line-height: 1.14;
  margin-bottom: 0.12em;
  max-height: 2.2em;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}
.suggest-meta-row {
  display: flex;
  align-items: center;
  gap: 0.5em;
}
.suggest-diff-badge {
  font-size: 0.84em;
  font-weight: 700;
  padding: 0.17em 0.75em;
  border-radius: 8px;
  letter-spacing: 0.01em;
  display: inline-block;
  white-space: nowrap;
  border: none;
  box-shadow: 0 1px 4px #e0e0e0;
}
.suggest-channel {
  color: #777;
  font-size: 0.91rem;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 90px;
}
</style>

{#if loading}
  <p style="text-align:center; color:#aaa; margin-top:3rem;">Loading…</p>
{:else if !video}
  <p style="text-align:center; color:#aaa; margin-top:3rem;">Video not found.</p>
{:else}
  <div class="player-youtube-layout">
    <main class="player-main-left">
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
        {#if user}
          <!-- Robust tracker: only appears if user is logged in -->
          <VideoWatchTracker videoId={video.id} videoDuration={video.length} userId={user.id} />
        {/if}
      </div>
      <div class="player-title">{video.title}</div>
      <div class="player-meta-row">
        <span
          class="player-diff-badge"
          style="background: {badgeProps(video.level).color}; color: {badgeProps(video.level).text};"
        >{badgeProps(video.level).label}</span>
        <span class="player-channel">{video.channel_name}</span>
        {#if video.length}
          <span class="player-duration">{formatVideoDuration(video.length)}</span>
        {/if}
      </div>
    </main>
    <aside class="suggestions-sidebar">
      {#each suggestions as v}
        <a class="suggest-card" href={`/video/${v.id}`}>
          <span class="suggest-thumb-wrap">
            <img
              class="suggest-thumb"
              src={`https://i.ytimg.com/vi/${v.id}/hqdefault.jpg`}
              alt={v.title}
              on:error="{(e) => e.target.src='https://placehold.co/120x67?text=No+Thumb'}"
            />
            {#if v.length}
              <span class="suggest-thumb-duration">
                {formatVideoDuration(v.length)}
              </span>
            {/if}
          </span>
          <div class="suggest-body">
            <div class="suggest-title">{v.title}</div>
            <div class="suggest-meta-row">
              <span
                class="suggest-diff-badge"
                style="background: {badgeProps(v.level).color}; color: {badgeProps(v.level).text};"
              >{badgeProps(v.level).label}</span>
              <span class="suggest-channel">{v.channel_name}</span>
            </div>
          </div>
        </a>
      {/each}
    </aside>
  </div>
{/if}
