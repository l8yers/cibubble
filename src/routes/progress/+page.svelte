<script>
  import { onMount } from 'svelte';
  import { user, loadUser } from '$lib/stores/user.js';
  import { supabase } from '$lib/supabaseClient.js';
  import VideoCard from '$lib/components/VideoCard.svelte';
  import * as utils from '$lib/utils.js';

  let myVideos = [];
  let watchedVideos = [];
  let email = '';
  let newEmail = '';
  let newPassword = '';
  let message = '';
  let watchTime = 0;
  let todayWatchTime = 0;
  let activityDays = [];
  let streak = 0;
  let showTotalTooltip = false;
  let showSettings = false;

  // Format functions
  function formatWatchTime(seconds) {
    if (!seconds) return '0 min';
    const mins = Math.round(seconds / 60);
    if (mins >= 60) {
      const hours = Math.floor(seconds / 3600);
      return `${hours} hr${hours !== 1 ? 's' : ''}`;
    }
    return mins > 0 ? `${mins} min` : `${seconds} sec`;
  }
  function formatFullTime(seconds) {
    if (!seconds) return '0 seconds';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    let result = [];
    if (h) result.push(`${h} hr${h !== 1 ? 's' : ''}`);
    if (m) result.push(`${m} min${m !== 1 ? 's' : ''}`);
    if (s || result.length === 0) result.push(`${s} sec${s !== 1 ? 's' : ''}`);
    return result.join(' ');
  }
  function formatMinutesOnly(seconds) {
    if (!seconds) return '0 min';
    const mins = Math.round(seconds / 60);
    return mins > 0 ? `${mins} min` : `${seconds} sec`;
  }

  $: if ($user) {
    fetchAllUserData($user.id);
  }

  async function fetchAllUserData(userId) {
    email = $user.email;
    newEmail = email;

    // Fetch user's videos
    let { data: videos } = await supabase
      .from('videos')
      .select('*')
      .eq('added_by', userId)
      .order('created', { ascending: false });
    myVideos = videos || [];

    // --- Total watch time ---
    let { data: allSessions } = await supabase
      .from('watch_sessions')
      .select('seconds')
      .eq('user_id', userId);
    watchTime = (allSessions ?? []).reduce((acc, s) => acc + (s.seconds || 0), 0);

    // --- Today's watch time ---
    const today = new Date().toISOString().slice(0, 10);
    let { data: todaySessions } = await supabase
      .from('watch_sessions')
      .select('seconds')
      .eq('user_id', userId)
      .eq('date', today);
    todayWatchTime = (todaySessions ?? []).reduce((acc, s) => acc + (s.seconds || 0), 0);

    // --- Recent activity and streak ---
    await fetchRecentActivity(userId);

    // --- Watched videos (recent, ordered by inserted_at) ---
    let { data: watchedSessions } = await supabase
      .from('watch_sessions')
      .select('video_id, date, inserted_at')
      .eq('user_id', userId);

    // For each video, store the most recent inserted_at
    const videoMap = {};
    for (const ws of watchedSessions ?? []) {
      if (!videoMap[ws.video_id] || ws.inserted_at > videoMap[ws.video_id].inserted_at) {
        videoMap[ws.video_id] = { date: ws.date, inserted_at: ws.inserted_at };
      }
    }
    const videoIds = Object.keys(videoMap);

    if (videoIds.length) {
      let { data: vids } = await supabase.from('videos').select('*').in('id', videoIds);
      watchedVideos = (vids || [])
        .map((v) => ({
          ...v,
          lastWatched: videoMap[v.id]?.inserted_at,
          lastWatchedDate: videoMap[v.id]?.date
        }))
        .filter((v) => v.lastWatched)
        .sort((a, b) => b.lastWatched.localeCompare(a.lastWatched));
    } else {
      watchedVideos = [];
    }
  }

  async function fetchRecentActivity(userId) {
    const today = new Date();
    const dates = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      dates.push(d.toISOString().slice(0, 10));
    }
    const fromDate = dates[0];
    const toDate = dates[dates.length - 1];
    let { data: sessions } = await supabase
      .from('watch_sessions')
      .select('date,seconds')
      .eq('user_id', userId)
      .gte('date', fromDate)
      .lte('date', toDate);

    const map = {};
    (sessions || []).forEach((s) => {
      map[s.date] = (map[s.date] || 0) + (s.seconds || 0);
    });
    activityDays = dates.map((date) => ({
      date,
      mins: Math.round((map[date] || 0) / 60)
    }));

    streak = 0;
    for (let i = activityDays.length - 1; i >= 0; i--) {
      if (activityDays[i].mins > 0) streak++;
      else break;
    }
  }

  // Account settings
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

  onMount(() => {
    loadUser();
  });
</script>

{#if !$user}
  <div class="profile-main" style="text-align:center;">
    <div style="margin:2em 0;">
      Not logged in.<br /><a href="/login" class="video-link">Login here</a>
    </div>
  </div>
{:else}
  <div class="profile-main">
    <div class="profile-header-row">
      <div class="section-title">Progress</div>
      {#if !showSettings}
        <a class="settings-link" on:click={() => showSettings = true} tabindex="0">Settings</a>
      {/if}
    </div>

    {#if !showSettings}
      <!-- MAIN PROGRESS CONTENT -->
      <div class="stats-boxes-row">
        <div class="stat-box stat-time">
          <div class="stat-label">Total Watch Time</div>
          <div class="stat-value">
            <span
              class="tooltip-parent"
              on:mouseenter={() => (showTotalTooltip = true)}
              on:mouseleave={() => (showTotalTooltip = false)}
              tabindex="0"
              on:focus={() => (showTotalTooltip = true)}
              on:blur={() => (showTotalTooltip = false)}
            >
              {formatWatchTime(watchTime)}
              {#if showTotalTooltip}
                <span class="custom-tooltip">{formatFullTime(watchTime)}</span>
              {/if}
            </span>
          </div>
        </div>
        <div class="stat-box stat-today">
          <div class="stat-label">Today's Watch Time</div>
          <div class="stat-value">
            {formatMinutesOnly(todayWatchTime)}
          </div>
        </div>
        <div class="stat-box stat-streak">
          <div class="stat-label">Streak</div>
          <div class="stat-value">
            <span style="font-size:2em;">🔥</span>
            {streak} day{streak === 1 ? '' : 's'}
          </div>
        </div>
      </div>

      <div class="history-section">
        <div class="history-header">
          <span class="section-title" style="margin:0;">History</span>
          <a href="/history" class="view-all-link">View all</a>
        </div>
        {#if watchedVideos.length === 0}
          <div>No videos watched yet.</div>
        {:else}
          <div class="history-row">
            {#each watchedVideos.slice(0, 15) as v}
              <div class="history-card">
                <VideoCard
                  video={v}
                  getBestThumbnail={utils.getBestThumbnail}
                  difficultyColor={utils.difficultyColor}
                  difficultyLabel={utils.difficultyLabel}
                  formatLength={utils.formatLength}
                  filterByChannel={null}
                  filterByPlaylist={null}
                />
              </div>
            {/each}
          </div>
        {/if}
      </div>
    {:else}
      <!-- SETTINGS PANEL -->
      <div class="settings-panel">
        <div class="settings-header-row">
          <div class="section-title">Account Settings</div>
          <a class="settings-link" on:click={() => showSettings = false} tabindex="0">← Back</a>
        </div>
        <div class="profile-row"><b>Email:</b> {email}</div>
        <div>
          <input type="email" bind:value={newEmail} placeholder="New email" autocomplete="email" />
          <button on:click={updateEmail}>Change Email</button>
        </div>
        <div>
          <input
            type="password"
            bind:value={newPassword}
            placeholder="New password"
            autocomplete="new-password"
          />
          <button on:click={updatePassword}>Change Password</button>
        </div>
        <div class="message">{message}</div>
      </div>
    {/if}
  </div>
{/if}

<style>
.profile-main {
  max-width: 1200px;
  margin: 2.2rem auto 0 auto;
  padding: 2rem 3vw 2.3rem 3vw;
  background: #fff;
  border-radius: 14px;
  border: 1px solid #ececec;
}
.profile-header-row, .settings-header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.6em;
  gap: 2em;
}
.section-title {
  color: #181818;
  font-size: 1.25rem;
  font-weight: bold;
  letter-spacing: 0.3px;
}
.settings-link {
  color: #2562e9;
  font-size: 1.06em;
  text-decoration: none;
  font-weight: 500;
  cursor: pointer;
  transition: color 0.16s;
}
.settings-link:hover, .settings-link:focus {
  color: #e93c2f;
  text-decoration: underline;
}
.settings-panel {
  margin-top: 2.2em;
}

/* --- Stats boxes with colored backgrounds, no shadows --- */
.stats-boxes-row {
  display: flex;
  gap: 2.1em;
  margin: 2.7em 0 2.7em 0;
  flex-wrap: nowrap;
  align-items: stretch;
  justify-content: center;
}
.stat-box {
  border-radius: 18px;
  padding: 2.1em 2.6em 1.9em 2.6em;
  min-width: 220px;
  min-height: 110px;
  flex: 0 0 250px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin-bottom: 0;
  border: none;
  position: relative;
  background: #f5f5f8;
  /* Default fallback, will be overwritten by accent class */
}

/* Accent color backgrounds */
.stat-time {
  background: linear-gradient(120deg, #ffeaea 70%, #fff6f0 100%);
}
.stat-today {
  background: linear-gradient(120deg, #eaffe9 70%, #f5fff5 100%);
}
.stat-streak {
  background: linear-gradient(120deg, #fff6e4 70%, #fef9f1 100%);
}

.stat-label {
  font-size: 1.11em;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.13em;
  margin-bottom: 0.8em;
  user-select: none;
  color: #7c7ca4;
}
.stat-time .stat-label { color: #e93c2f; }
.stat-today .stat-label { color: #31b361; }
.stat-streak .stat-label { color: #f4a000; }

.stat-value {
  font-size: 2.3em;
  color: #181d27;
  font-weight: 900;
  letter-spacing: 0.01em;
  display: flex;
  align-items: center;
  gap: 0.18em;
  line-height: 1.15;
  user-select: text;
}

/* Tooltip bubble styles unchanged */
.tooltip-parent {
  position: relative;
  cursor: pointer;
  outline: none;
  transition: box-shadow 0.1s;
}
.tooltip-parent:focus {
  box-shadow: 0 0 0 2px #e93c2f55;
}
.custom-tooltip {
  position: absolute;
  left: 50%;
  bottom: 120%;
  transform: translateX(-50%);
  background: #232323;
  color: #fff;
  font-size: 1.03rem;
  font-weight: 500;
  padding: 0.58em 1.2em;
  border-radius: 12px;
  white-space: nowrap;
  z-index: 10;
  pointer-events: none;
  opacity: 1;
  animation: fadeIn 0.17s;
}
@media (max-width: 600px) {
  .custom-tooltip {
    font-size: 0.97rem;
    padding: 0.46em 1em;
  }
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateX(-50%) translateY(8px);}
  to   { opacity: 1; transform: translateX(-50%) translateY(0);}
}

.history-section {
  margin-top: 2.4em;
}
.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.2em;
}
.view-all-link {
  font-size: 1em;
  color: #2562e9;
  text-decoration: none;
  font-weight: 500;
}
.history-row {
  display: flex;
  gap: 1.5em;
  overflow-x: auto;
  padding-bottom: 0.7em;
  scroll-snap-type: x mandatory;
  -webkit-overflow-scrolling: touch;
}
.history-row::-webkit-scrollbar {
  height: 9px;
  background: #f6f6f6;
}
.history-row::-webkit-scrollbar-thumb {
  background: #e5e5e5;
  border-radius: 6px;
}
.history-card {
  flex: 0 0 340px;   /* wider card */
  min-width: 340px;
  max-width: 400px;
  scroll-snap-align: start;
}
@media (max-width: 900px) {
  .stats-boxes-row {
    flex-wrap: wrap;
    gap: 1.2em;
  }
  .stat-box {
    min-width: 180px;
    flex: 1 1 210px;
    padding: 1.4em 1.1em 1.2em 1.1em;
  }
}
@media (max-width: 650px) {
  .stats-boxes-row {
    flex-direction: column;
    gap: 1em;
  }
  .stat-box {
    width: 100%;
    min-width: unset;
  }
  .history-card {
    flex-basis: 92vw;
    min-width: 92vw;
    max-width: 98vw;
  }
  .history-row {
    gap: 1em;
  }
}
.profile-row {
  margin-bottom: 1.3em;
}
input[type='email'],
input[type='password'] {
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
</style>
