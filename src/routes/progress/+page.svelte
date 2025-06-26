<script>
  import { onMount } from 'svelte';
  import { user, loadUser } from '$lib/stores/user.js';
  import { supabase } from '$lib/supabaseClient.js';
  import * as utils from '$lib/utils/utils.js';
  import ProgressStats from '$lib/components/progress/ProgressStats.svelte';
  import ProgressHistory from '$lib/components/progress/ProgressHistory.svelte';
  import ProgressSettings from '$lib/components/progress/ProgressSettings.svelte';
  import ProgressDailyTotals from '$lib/components/progress/ProgressDailyTotals.svelte';
  import ProgressManualEntry from '$lib/components/progress/ProgressManualEntry.svelte';

  import { writable } from 'svelte/store';
  export const windowWidth = writable(typeof window !== 'undefined' ? window.innerWidth : 1200);

  onMount(() => {
    const updateWidth = () => windowWidth.set(window.innerWidth);
    window.addEventListener('resize', updateWidth);
    updateWidth();
    return () => window.removeEventListener('resize', updateWidth);
  });

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
  let dailyTotals = [];
  let dailyOpen = false;
  let showManualModal = false;

  function openDailyOnly() {
    dailyOpen = !dailyOpen;
    if (dailyOpen) showManualModal = false;
  }

  function openManualModal() {
    showManualModal = true;
    dailyOpen = false;
  }

  function closeManualModal() {
    showManualModal = false;
  }

  // --- Format functions ---
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

  // New helper to calculate streak from dailyTotals
  function calculateStreakFromDailyTotals(dailyTotals) {
    if (!dailyTotals.length) return 0;

    // Sort descending by date (most recent first)
    const sortedTotals = [...dailyTotals].sort((a, b) => b.date.localeCompare(a.date));

    let streakCount = 0;
    let lastDate = new Date(sortedTotals[0].date);

    for (const day of sortedTotals) {
      const currentDate = new Date(day.date);
      const diffDays = (lastDate - currentDate) / (1000 * 60 * 60 * 24);

      if (diffDays > 1) break;  // gap found, streak ends

      if ((day.totalSeconds ?? 0) > 0) {
        streakCount++;
        lastDate = currentDate;
      } else {
        break;  // no activity, stop counting streak
      }
    }
    return streakCount;
  }

  // Reactive streak update whenever dailyTotals changes
  $: streak = calculateStreakFromDailyTotals(dailyTotals);

  $: if ($user) {
    fetchAllUserData($user.id);
  }

  async function fetchAllUserData(userId) {
    email = $user.email;
    newEmail = email;

    let { data: videos } = await supabase
      .from('videos')
      .select('*')
      .eq('added_by', userId)
      .order('created', { ascending: false });
    myVideos = videos || [];

    let { data: allSessions } = await supabase
      .from('watch_sessions')
      .select('seconds')
      .eq('user_id', userId);
    watchTime = (allSessions ?? []).reduce((acc, s) => acc + (s.seconds || 0), 0);

    const today = new Date().toISOString().slice(0, 10);
    let { data: todaySessions } = await supabase
      .from('watch_sessions')
      .select('seconds')
      .eq('user_id', userId)
      .eq('date', today);
    todayWatchTime = (todaySessions ?? []).reduce((acc, s) => acc + (s.seconds || 0), 0);

    // Old fetchRecentActivity still loads activityDays if you want to keep it for something else
    await fetchRecentActivity(userId);

    let { data: watchedSessions } = await supabase
      .from('watch_sessions')
      .select('video_id, date, inserted_at')
      .eq('user_id', userId);

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

    let { data: allSessionsForDaily, error } = await supabase
      .from('watch_sessions')
      .select('date,seconds')
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching daily sessions:', error);
      dailyTotals = [];
    } else {
      const totalsMap = {};
      (allSessionsForDaily ?? []).forEach(({ date, seconds }) => {
        if (!date) return;
        totalsMap[date] = (totalsMap[date] || 0) + (seconds || 0);
      });
      dailyTotals = Object.entries(totalsMap)
        .map(([date, totalSeconds]) => ({ date, totalSeconds }))
        .sort((a, b) => b.date.localeCompare(a.date));
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

    // Remove old streak calc here, streak now handled by dailyTotals + helper
  }

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
        <a class="settings-link" on:click={() => (showSettings = true)} tabindex="0">Settings</a>
      {/if}
    </div>

    {#if !showSettings}
      <ProgressStats
        {watchTime}
        {todayWatchTime}
        {streak}
        {showTotalTooltip}
        setShowTotalTooltip={(val) => (showTotalTooltip = val)}
        {formatWatchTime}
        {formatFullTime}
        {formatMinutesOnly}
      />

      <div class="progress-controls-row">
        <button
          class="cibubble-btn"
          aria-expanded={dailyOpen}
          on:click={openDailyOnly}
          type="button"
        >
          {dailyOpen ? 'Hide Daily Breakdown' : 'Show Daily Breakdown'}
        </button>

        <button
          class="cibubble-btn"
          on:click={openManualModal}
          type="button"
        >
          Add Time From Outside the Platform
        </button>
      </div>

      {#if dailyOpen}
        <ProgressDailyTotals
          {dailyTotals}
          {formatMinutesOnly}
        />
      {/if}

      {#if showManualModal}
        <div class="modal-backdrop" on:click={closeManualModal}>
          <div class="modal-content" on:click|stopPropagation>
            <button class="close-button" on:click={closeManualModal} aria-label="Close modal">×</button>
            <ProgressManualEntry onAdded={() => { fetchAllUserData($user.id); closeManualModal(); }} />
          </div>
        </div>
      {/if}

      {#if $windowWidth > 600}
        <ProgressHistory {watchedVideos} {utils} />
      {:else}
        <div class="history-link-row">
          <a class="history-link-mobile" href="/history">
            View full watch history
          </a>
        </div>
      {/if}
    {:else}
      <ProgressSettings
        {email}
        {newEmail}
        setNewEmail={(v) => (newEmail = v)}
        {newPassword}
        setNewPassword={(v) => (newPassword = v)}
        {message}
        {updateEmail}
        {updatePassword}
        back={() => (showSettings = false)}
      />
    {/if}
  </div>
{/if}

<style>
  .profile-main {
    max-width: 1700px;
    margin: 2.2rem auto 0 auto;
    padding: 2rem 3vw 2.3rem 3vw;
    background: #fff;
    border-radius: 14px;
    border: 1px solid #ececec;
  }
  .profile-header-row {
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
  .settings-link:hover,
  .settings-link:focus {
    color: #e93c2f;
    text-decoration: underline;
  }
  .video-link {
    color: #2562e9;
    text-decoration: underline;
    font-weight: 500;
  }
  .progress-controls-row {
    display: flex;
    justify-content: center;
    gap: 1.8em;
    margin: 2em 0 2.5em 0;
    flex-wrap: wrap;
  }
  .cibubble-btn {
    flex: 0 1 180px;
    max-width: 220px;
    padding: 0.65em 1.5em;
    font-size: 0.9em;
    font-weight: 700;
    background: #2562e9;
    color: #fff;
    border: none;
    border-radius: 11px;
    box-shadow: 0 2px 9px #ececec66;
    cursor: pointer;
    transition: background 0.16s, color 0.16s, box-shadow 0.16s;
    letter-spacing: 0.03em;
    outline: none;
    margin: 0;
  }
  .cibubble-btn:hover,
  .cibubble-btn:focus {
    background: #e93c2f;
    color: #fff;
    box-shadow: 0 3px 12px #e93c2f33;
  }
  .modal-backdrop {
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0,0,0,0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }
  .modal-content {
    background: white;
    border-radius: 14px;
    padding: 2rem;
    max-width: 480px;
    width: 90%;
    box-shadow: 0 8px 24px rgba(0,0,0,0.2);
    position: relative;
  }
  .close-button {
    position: absolute;
    top: 12px;
    right: 12px;
    font-size: 1.6rem;
    background: none;
    border: none;
    cursor: pointer;
    color: #333;
    font-weight: 700;
    line-height: 1;
  }
  @media (max-width: 600px) {
    .profile-main {
      padding: 1.1rem 0.6rem 1.3rem 0.6rem;
      border-radius: 0;
      margin: 0;
    }
    .profile-header-row {
      flex-direction: row;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1em;
      gap: 0.7em;
    }
    .progress-controls-row {
      flex-direction: column;
      gap: 1em;
    }
    .cibubble-btn {
      width: 100%;
      flex: none;
      margin: 0;
      font-size: 1em;
      padding: 1em 0.7em;
    }
    .history-link-row {
      margin-top: 0.8em;
      margin-bottom: 0.6em;
      display: flex;
      justify-content: flex-start;
      width: 100%;
    }
    .history-link-mobile {
      color: #2562e9;
      font-size: 1.05em;
      text-decoration: underline;
      font-weight: 500;
      padding: 0.17em 0.18em;
      background: none;
      border: none;
      box-shadow: none;
      border-radius: 0;
      margin: 0;
      transition: color 0.15s;
      display: inline;
    }
    .history-link-mobile:focus,
    .history-link-mobile:hover {
      color: #e93c2f;
      background: none;
      text-decoration: underline;
    }
  }
</style>
