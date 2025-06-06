<script>
  import { supabase } from '$lib/supabaseClient.js';
  import { onMount } from 'svelte';

  let user = null;
  let username = '';
  let totalWatched = 0;
  let newUsername = '';
  let message = '';
  let error = '';

  onMount(async () => {
    // Get user info
    const { data: { user: supaUser } } = await supabase.auth.getUser();
    user = supaUser;

    if (user) {
      // Get username from profile table
      let { data: profile } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', user.id)
        .single();
      username = profile?.username || '';
      newUsername = username;

      // Get total time watched from watch_logs table
      let { data: logs, error: logError } = await supabase
        .from('watch_logs')
        .select('watched_seconds')
        .eq('user_id', user.id);

      totalWatched = (logs || []).reduce((sum, l) => sum + (l.watched_seconds || 0), 0);
    }
  });

  async function saveUsername() {
    message = '';
    error = '';
    if (!user) return;
    // Upsert profile
    const { error: upsertError } = await supabase
      .from('profiles')
      .upsert({ id: user.id, username: newUsername });
    if (upsertError) {
      error = upsertError.message;
    } else {
      username = newUsername;
      message = 'Username saved!';
    }
  }

  function formatSeconds(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h) return `${h}h ${m}m ${s}s`;
    if (m) return `${m}m ${s}s`;
    return `${s}s`;
  }
</script>

{#if !user}
  <p>Please <a href="/login">log in</a> to see your profile.</p>
{:else}
  <h2>Your Profile</h2>
  <p><b>Email:</b> {user.email}</p>
  <p><b>User ID:</b> {user.id}</p>

  <form on:submit|preventDefault={saveUsername} style="margin-bottom:1em">
    <label>
      Username:
      <input bind:value={newUsername} placeholder="Set your username" />
      <button type="submit" style="margin-left:0.6em">Save</button>
    </label>
    {#if message}<span style="color:green;margin-left:1em">{message}</span>{/if}
    {#if error}<span style="color:red;margin-left:1em">{error}</span>{/if}
  </form>

  <div>
    <b>Total time watched:</b>
    {formatSeconds(totalWatched)}
  </div>
{/if}
