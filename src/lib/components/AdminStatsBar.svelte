<script>
  import { supabase } from '$lib/supabaseClient';
  import { onMount } from 'svelte';

  let stats = {
    totalVideos: 0,
    totalSeconds: 0,
    perLevel: [],
    unlevelledCount: 0,
    unlevelledSeconds: 0
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
    const levels = ['easy', 'intermediate', 'advanced'];
    const totalVideos = all.length;
    const totalSeconds = all.reduce((sum, v) => sum + (v.length || 0), 0);

    let perLevel = levels.map(lvl => {
      const vids = all.filter(v => v.level === lvl);
      const count = vids.length;
      const secs = vids.reduce((sum, v) => sum + (v.length || 0), 0);
      return { level: lvl, count, secs };
    });

    const unlevelled = all.filter(v => !v.level || v.level === '');
    const unlevelledCount = unlevelled.length;
    const unlevelledSeconds = unlevelled.reduce((sum, v) => sum + (v.length || 0), 0);

    stats = {
      totalVideos,
      totalSeconds,
      perLevel,
      unlevelledCount,
      unlevelledSeconds
    };
    loading = false;
  }

  onMount(fetchStats);
</script>

<div class="admin-stats-bar">
  {#if loading}
    <div>Loading stats…</div>
  {:else if error}
    <div style="color:#c0392b;">{error}</div>
  {:else}
    <div class="stat-item total-videos">
      <span class="stat-label">Videos</span>
      <span class="stat-value">{stats.totalVideos}</span>
    </div>
    <div class="stat-item total-time">
      <span class="stat-label">Total Time</span>
      <span class="stat-value">{formatTime(stats.totalSeconds)}</span>
    </div>
    {#each stats.perLevel as pl (pl.level)}
      <div class="stat-item {pl.level}">
        <span class="stat-label">
          {pl.level.charAt(0).toUpperCase() + pl.level.slice(1)}
        </span>
        <span class="stat-value">{pl.count}</span>
        <span class="stat-sub">{formatTime(pl.secs)}</span>
      </div>
    {/each}
    <div class="stat-item unlevelled" style="color:#ff831a;">
      <span class="stat-label">Not Yet</span>
      <span class="stat-value">{stats.unlevelledCount}</span>
      {#if stats.unlevelledCount > 0}
        <span class="stat-sub">{formatTime(stats.unlevelledSeconds)}</span>
      {/if}
    </div>
  {/if}
</div>

<style>
.admin-stats-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 1.1em 1.6em;
  margin: 1.4em 0 2em 0;
  padding: 1em 1.5em 0.6em 1.5em;
  background: #f8fafd;
  border-radius: 11px;
  align-items: flex-end;
  font-family: inherit;
  font-size: 1.04em;
  box-shadow: 0 1.5px 7px #e0e8f6;
}
.stat-item {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.12em;
  font-weight: 600;
  color: #2b313b;
  min-width: 70px;
}
.stat-label {
  font-size: 0.97em;
  font-weight: 500;
  color: #8192ac;
  letter-spacing: 0.02em;
  margin-bottom: 2px;
}
.stat-value {
  font-size: 1.14em;
  font-weight: 800;
  color: #2361cb;
}
.stat-item.easy .stat-label { color: #16a085; }
.stat-item.easy .stat-value { color: #16a085; }
.stat-item.intermediate .stat-label { color: #f5a623; }
.stat-item.intermediate .stat-value { color: #f5a623; }
.stat-item.advanced .stat-label { color: #e93c2f; }
.stat-item.advanced .stat-value { color: #e93c2f; }
.stat-item.unlevelled .stat-label, .stat-item.unlevelled .stat-value {
  color: #ff831a;
}
.stat-sub {
  font-size: 0.95em;
  font-weight: 400;
  color: #6e8299;
  margin-left: 2px;
}
</style>
