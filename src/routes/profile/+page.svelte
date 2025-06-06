<script>
  import { onMount } from 'svelte';
  import { supabase } from '$lib/supabaseClient.js';

  let user = null;
  let totalWatched = 0;

  function formatSeconds(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h) return `${h}h ${m}m ${s}s`;
    if (m) return `${m}m ${s}s`;
    return `${s}s`;
  }

  onMount(async () => {
    const { data: { user: supaUser } } = await supabase.auth.getUser();
    user = supaUser;

    if (user) {
      const { data: logs } = await supabase
        .from('watch_logs')
        .select('watched_seconds')
        .eq('user_id', user.id);

      if (logs && logs.length) {
        totalWatched = logs.reduce((sum, row) => sum + (row.watched_seconds || 0), 0);
      } else {
        totalWatched = 0;
      }
    }
  });
</script>

<div class="profile-page">
  {#if !user}
    <p>Please <a href="/login">log in</a> to see your profile.</p>
  {:else}
    <h2>Your Profile</h2>
    <p><b>Email:</b> {user.email}</p>
    <div style="margin-top:1.5em;">
      <b>Total time watched:</b>
      <span style="margin-left:0.6em; font-weight:600;">
        {formatSeconds(totalWatched)}
      </span>
    </div>
  {/if}
</div>

<style>
  .profile-page {
    max-width: 420px;
    margin: 3.5em auto;
    background: #fff;
    padding: 2em 2.5em;
    border-radius: 15px;
    box-shadow: 0 2px 18px #0001;
    color: #234;
  }
  .profile-page h2 {
    margin-bottom: 1.2em;
    text-align: center;
    font-weight: 700;
    color: #234;
  }
  .profile-page p {
    font-size: 1.08em;
    margin-bottom: 0.8em;
    color: #222;
  }
</style>
