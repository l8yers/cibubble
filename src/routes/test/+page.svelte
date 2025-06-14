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

  async function fetchTestStats() {
    loading = true;
    error = '';
    // Total videos and time
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

    // Stats by level (no double-counting)
    let perLevel = levels.map(lvl => {
      const vids = all.filter(v => v.level === lvl);
      const count = vids.length;
      const secs = vids.reduce((sum, v) => sum + (v.length || 0), 0);
      return { level: lvl, count, secs };
    });

    // Any videos without a level
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

  onMount(fetchTestStats);
</script>

<div class="test-stats" style="margin:2em 0 1em 0; background:#f8fafd; border-radius:10px; padding:1.3em 2em;">
  <h3 style="font-size:1.22em;margin-bottom:0.7em;color:#1c61b2;">Test Stats Panel</h3>
  {#if loading}
    <div>Loading stats…</div>
  {:else if error}
    <div style="color:#c0392b;">{error}</div>
  {:else}
    <div><b>Total Videos:</b> {stats.totalVideos}</div>
    <div><b>Total Time:</b> {formatTime(stats.totalSeconds)}</div>
    <div style="margin:0.8em 0 0.3em 0;">
      {#each stats.perLevel as pl}
        <div>
          <span style="font-weight:600;color:#f365a0;">{pl.level.charAt(0).toUpperCase() + pl.level.slice(1)}:</span>
          {pl.count} <span style="color:#aaa;font-size:0.96em;">{formatTime(pl.secs)}</span>
        </div>
      {/each}
    </div>
    <div style="margin-top:0.6em;color:#ff831a;">
      <b>Unlevelled Videos:</b> {stats.unlevelledCount}
      {#if stats.unlevelledCount > 0}
        <span style="color:#aaa;">({formatTime(stats.unlevelledSeconds)})</span>
      {/if}
    </div>
  {/if}
</div>
