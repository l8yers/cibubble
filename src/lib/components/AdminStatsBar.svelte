<script>
  import { supabase } from '$lib/supabaseClient';
  import { onMount } from 'svelte';

  let stats = {
    totalVideos: 0,
    easy: { count: 0, time: 0 },
    intermediate: { count: 0, time: 0 },
    advanced: { count: 0, time: 0 },
    unlevelled: { count: 0, time: 0 }
  };
  let loading = false;
  let error = '';

  function formatTime(sec) {
    if (!sec || sec === 0) return '0h 0m';
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60) % 60;
    return `${h}h ${m}m`;
  }

  async function fetchStats() {
    loading = true;
    error = '';
    let { data: all, error: e1 } = await supabase
      .from('videos')
      .select('id, length, level');

    if (e1 || !all) {
      error = 'Failed to load videos';
      loading = false;
      return;
    }
    stats.totalVideos = all.length;

    let levelStats = {
      easy: { count: 0, time: 0 },
      intermediate: { count: 0, time: 0 },
      advanced: { count: 0, time: 0 },
      unlevelled: { count: 0, time: 0 }
    };

    for (const v of all) {
      let lvl = v.level;
      if (!lvl || !["easy", "intermediate", "advanced"].includes(lvl)) lvl = "unlevelled";
      levelStats[lvl].count++;
      levelStats[lvl].time += v.length || 0;
    }

    stats.easy = levelStats.easy;
    stats.intermediate = levelStats.intermediate;
    stats.advanced = levelStats.advanced;
    stats.unlevelled = levelStats.unlevelled;
    loading = false;
  }

  onMount(fetchStats);
</script>

<div class="stats-bar-cibubble">
  {#if loading}
    <div>Loading stats…</div>
  {:else if error}
    <div style="color:#c0392b;">{error}</div>
  {:else}
    <div class="stat-table">
      <div class="stat-header">VIDEOS</div>
      <div class="stat-header easy">EASY</div>
      <div class="stat-header intermediate">INTERMEDIATE</div>
      <div class="stat-header advanced">ADVANCED</div>
      <div class="stat-header unlevelled">NOT YET</div>

      <div class="stat-value videos">{stats.totalVideos}</div>
      <div class="stat-value easy">{stats.easy.count}</div>
      <div class="stat-value intermediate">{stats.intermediate.count}</div>
      <div class="stat-value advanced">{stats.advanced.count}</div>
      <div class="stat-value unlevelled">{stats.unlevelled.count}</div>

      <div class="stat-sub videos">{formatTime(
        stats.easy.time + stats.intermediate.time + stats.advanced.time + stats.unlevelled.time
      )}</div>
      <div class="stat-sub easy">{formatTime(stats.easy.time)}</div>
      <div class="stat-sub intermediate">{formatTime(stats.intermediate.time)}</div>
      <div class="stat-sub advanced">{formatTime(stats.advanced.time)}</div>
      <div class="stat-sub unlevelled">{formatTime(stats.unlevelled.time)}</div>
    </div>
  {/if}
</div>

<style>
.stats-bar-cibubble {
  width: 100%;
  margin: 1.5em 0 2.1em 0;
  padding: 1.2em 0.5em 1.1em 0.5em;
  background: #f8fafd;
  border-radius: 11px;
  box-shadow: 0 1.5px 7px #e0e8f6;
  font-family: inherit;
}
.stat-table {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  text-align: center;
  gap: 0.2em 0.6em;
}

.stat-header.easy { color: #16a085; }
.stat-header.intermediate { color: #f5a623; }
.stat-header.advanced { color: #e93c2f; }
.stat-header.unlevelled { color: #ff831a; }

.stat-value {
  font-size: 1.45em;
  font-weight: 800;
  margin: 0.05em 0 0.05em 0;
}
.stat-value.videos { color: #2361cb; }
.stat-value.easy { color: #16a085; }
.stat-value.intermediate { color: #f5a623; }
.stat-value.advanced { color: #e93c2f; }
.stat-value.unlevelled { color: #ff831a; }

.stat-sub {
  font-size: 1.01em;
  font-weight: 500;
  color: #8795ad;
  margin: 0 0 0.1em 0;
}
.stat-sub.videos { color: #2361cb; }
.stat-sub.easy { color: #16a085; }
.stat-sub.intermediate { color: #f5a623; }
.stat-sub.advanced { color: #e93c2f; }
.stat-sub.unlevelled { color: #ff831a; }

@media (max-width: 900px) {
  .stats-bar-cibubble { font-size: 0.97em; padding: 0.8em 0.2em 0.8em 0.2em;}
  .stat-header, .stat-value, .stat-sub { font-size: 0.98em;}
}
@media (max-width: 600px) {
  .stat-header, .stat-value, .stat-sub { font-size: 0.92em;}
}
</style>
