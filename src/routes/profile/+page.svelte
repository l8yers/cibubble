<script>
  import { onMount } from 'svelte';
  import { supabase } from '$lib/supabaseClient';

  let user = null;
  let myVideos = [];
  let email = '';
  let newEmail = '';
  let newPassword = '';
  let message = '';
  let watchTime = 0;
  let todayWatchTime = 0;

  function formatMinutes(seconds) {
    if (!seconds) return '0 min';
    const m = Math.round(seconds / 60);
    return m > 0 ? `${m} min` : `${seconds} sec`;
  }

  onMount(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      user = session.user;
      email = user.email;
      newEmail = email;

      // Fetch user's videos
      let { data: videos } = await supabase
        .from('videos')
        .select('*')
        .eq('added_by', user.id)
        .order('created', { ascending: false });
      myVideos = videos || [];

      // --- Fetch total watch time (from watch_sessions) ---
      let { data: allSessions } = await supabase
        .from('watch_sessions')
        .select('seconds')
        .eq('user_id', user.id);
      watchTime = (allSessions ?? []).reduce((acc, s) => acc + (s.seconds || 0), 0);

      // --- Today's watch time ---
      const today = new Date().toISOString().slice(0, 10);
      let { data: todaySessions } = await supabase
        .from('watch_sessions')
        .select('seconds')
        .eq('user_id', user.id)
        .eq('date', today);
      todayWatchTime = (todaySessions ?? []).reduce((acc, s) => acc + (s.seconds || 0), 0);
    }
  });

  async function updateEmail() {
    message = '';
    if (!newEmail || newEmail === email) {
      message = 'No change.';
      return;
    }
    const { error } = await supabase.auth.updateUser({ email: newEmail });
    if (error) {
      message = error.message;
    } else {
      message = 'Email updated! Please check your inbox to confirm.';
      email = newEmail;
    }
  }

  async function updatePassword() {
    message = '';
    if (!newPassword) {
      message = 'Password cannot be empty.';
      return;
    }
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      message = error.message;
    } else {
      message = 'Password updated!';
      newPassword = '';
    }
  }
</script>

<style>
.profile-main {
  max-width: 730px;
  margin: 2.2rem auto 0 auto;
  padding: 2rem 2vw 2.3rem 2vw;
  background: #fff;
  border-radius: 14px;
  border: 1px solid #ececec;
  box-shadow: 0 2px 12px #ececec;
}
.section-title {
  color: #181818;
  font-size: 1.25rem;
  font-weight: bold;
  margin: 1.7em 0 1em 0;
  letter-spacing: 0.3px;
}
.profile-row {
  margin-bottom: 1.3em;
}
input[type="email"],
input[type="password"] {
  width: 100%;
  padding: 0.7em 1em;
  font-size: 1.07rem;
  border: 1px solid #ececec;
  border-radius: 8px;
  background: #fafafa;
  margin-bottom: 0.9em;
  color: #181818;
}
button {
  padding: 0.6em 1.7em;
  font-size: 1.04rem;
  background: #e93c2f;
  color: #fff;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  margin-right: 1em;
  margin-bottom: 0.5em;
  transition: background 0.18s;
}
button:hover {
  background: #b8271b;
}
.message {
  color: #26890d;
  margin-bottom: 1em;
  min-height: 1.5em;
}
.videos-list {
  margin-top: 1em;
  padding-left: 0;
  list-style: none;
}
.video-item {
  margin-bottom: 0.6em;
  border-bottom: 1px solid #ececec;
  padding-bottom: 0.7em;
}
.video-link {
  color: #e93c2f;
  text-decoration: none;
  font-weight: 500;
}
.video-link:hover {
  text-decoration: underline;
  color: #181818;
}
.stats-row {
  color: #222;
  font-size: 1.07em;
  margin-bottom: 0.7em;
}
</style>

{#if !user}
  <div class="profile-main" style="text-align:center;">
    <div style="margin:2em 0;">Not logged in.<br/><a href="/login" class="video-link">Login here</a></div>
  </div>
{:else}
  <div class="profile-main">
    <div class="section-title">Account</div>
    <div class="profile-row"><b>Email:</b> {email}</div>
    <div>
      <input type="email" bind:value={newEmail} placeholder="New email" autocomplete="email" />
      <button on:click={updateEmail}>Change Email</button>
    </div>
    <div>
      <input type="password" bind:value={newPassword} placeholder="New password" autocomplete="new-password" />
      <button on:click={updatePassword}>Change Password</button>
    </div>
    <div class="message">{message}</div>

    <div class="section-title">Stats</div>
    <div class="stats-row"><b>Total watch time:</b> {formatMinutes(watchTime)}</div>
    <div class="stats-row"><b>Today's watch time:</b> {formatMinutes(todayWatchTime)}</div>

    <div class="section-title">My Videos</div>
    {#if myVideos.length === 0}
      <div>No videos added yet.</div>
    {:else}
      <ul class="videos-list">
        {#each myVideos as v}
          <li class="video-item">
            <a href={`/video/${v.id}`} class="video-link">{v.title}</a>
            <div style="color:#888; font-size:0.94em;">{v.channel_name}</div>
          </li>
        {/each}
      </ul>
    {/if}
  </div>
{/if}
