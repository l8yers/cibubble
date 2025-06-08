<script>
  import { onMount } from 'svelte';
  import { supabase } from '$lib/supabaseClient';

  let videos = [];
  let loading = true;

  onMount(async () => {
    const { data, error } = await supabase
      .from('videos')
      .select('*')
      .order('created', { ascending: false })
      .limit(100);
    videos = data ?? [];
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
    if (!level) return { label: "Not Yet Rated", color: "#bcbcbc", text: "#666" };
    switch (level.trim().toLowerCase()) {
      case "superbeginner":
      case "super beginner":   return { label: "Super Beginner", color: "#16a800", text: "#fff" };
      case "beginner":         return { label: "Beginner",       color: "#2f6ae9", text: "#fff" };
      case "intermediate":     return { label: "Intermediate",   color: "#f9ae17", text: "#fff" };
      case "advanced":         return { label: "Advanced",       color: "#7d2fe9", text: "#fff" };
      default:                 return { label: "Not Yet Rated",  color: "#bcbcbc", text: "#666" };
    }
  }
</script>

<style>
:global(html) {
  font-family: 'Inter', 'Segoe UI', Arial, sans-serif;
  background: #f5f6fa;
}

.ds-grid-main {
  max-width: 1820px;
  margin: 2.5rem auto 0 auto;
  padding: 0 2vw 3vw 2vw;
}

.ds-video-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 2.1rem;
  justify-content: center;
}

@media (max-width: 1600px) {
  .ds-video-grid { grid-template-columns: repeat(4, 1fr); }
}
@media (max-width: 1250px) {
  .ds-video-grid { grid-template-columns: repeat(3, 1fr); }
}
@media (max-width: 950px) {
  .ds-video-grid { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 600px) {
  .ds-grid-main { padding: 0 0.3em; }
  .ds-video-grid { grid-template-columns: 1fr; gap: 1.1rem; }
}

.ds-card {
  background: #fff;
  border-radius: 18px;
  box-shadow: 0 4px 32px #e4e4e4;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1.4px solid #f1f1f2;
  min-width: 0;
  position: relative;
  transition: box-shadow 0.15s, transform 0.13s;
  text-decoration: none;
}
.ds-card:hover {
  box-shadow: 0 8px 48px #e93c2f15;
  transform: translateY(-4px) scale(1.018);
}

.ds-thumb-wrap {
  position: relative;
}
.ds-thumb {
  width: 100%;
  aspect-ratio: 16/9;
  object-fit: cover;
  background: #ececec;
  display: block;
}
.ds-thumb-duration {
  position: absolute;
  right: 1em;
  bottom: 1em;
  background: #1a1a1aee;
  color: #fff;
  font-size: 0.91em;
  font-weight: 600;
  padding: 0.11em 0.6em;
  border-radius: 6px;
  box-shadow: 0 1px 4px #1818182b;
  opacity: 0.78;
  letter-spacing: 0.03em;
  z-index: 2;
  user-select: none;
  pointer-events: none;
}

/* Card content */
.ds-card-body {
  padding: 1.05em 1.15em 1.1em 1.15em;
  color: #181818;
  display: flex;
  flex-direction: column;
  flex: 1;
}
.ds-title {
  font-size: 1.13rem;
  font-weight: 700;
  margin-bottom: 0.38em;
  line-height: 1.21;
  min-height: 2.5em;
  max-height: 2.5em;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  word-break: break-word;
}

.ds-meta-row {
  display: flex;
  align-items: center;
  gap: 0.53em;
  margin-bottom: 0.13em;
}
.ds-diff-badge {
  font-size: 0.91em;
  font-weight: 700;
  padding: 0.23em 1.09em;
  border-radius: 12px;
  letter-spacing: 0.01em;
  display: inline-block;
  white-space: nowrap;
  box-shadow: 0 1px 4px #e0e0e0;
  border: none;
}
.ds-channel {
  font-size: 0.98rem;
  color: #787878;
  font-weight: 500;
  margin-bottom: 0.28em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 160px;
}
</style>

<div class="ds-grid-main">
  {#if loading}
    <p style="text-align:center; color:#aaa; margin-top:3rem;">Loading videos…</p>
  {:else if videos.length === 0}
    <p style="text-align:center; color:#aaa; margin-top:3rem;">No videos yet. Try adding one!</p>
  {:else}
    <div class="ds-video-grid">
      {#each videos as video}
        <a href={`/video/${video.id}`} class="ds-card">
          <div class="ds-thumb-wrap">
            <img
              class="ds-thumb"
              src={`https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`}
              alt={video.title}
              on:error="{(e) => e.target.src='https://placehold.co/480x270?text=No+Thumb'}"
            />
            {#if video.length}
              <span class="ds-thumb-duration">
                {formatVideoDuration(video.length)}
              </span>
            {/if}
          </div>
          <div class="ds-card-body">
            <div class="ds-title">{video.title}</div>
            <div class="ds-meta-row">
              <span
                class="ds-diff-badge"
                style="background: {badgeProps(video.level).color}; color: {badgeProps(video.level).text};"
              >{badgeProps(video.level).label}</span>
              <span class="ds-channel">{video.channel_name}</span>
            </div>
          </div>
        </a>
      {/each}
    </div>
  {/if}
</div>
