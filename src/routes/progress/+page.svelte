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

  // Track window width for mobile/desktop UI logic
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
  let manualOpen = false;

  function openDailyOnly() {
    dailyOpen = !dailyOpen;
    if (dailyOpen) manualOpen = false;
  }
  function openManualOnly() {
    manualOpen = !manualOpen;
    if (manualOpen) dailyOpen = false;
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

  // --- Main data loading ---
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

    // --- Daily totals breakdown ---
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
        <button class="toggle-btn subtle" aria-expanded={dailyOpen} on:click={openDailyOnly}>
          <span class="toggle-icon">{dailyOpen ? '➖' : '➕'}</span>
          <span class="toggle-label">Show Daily Breakdown</span>
        </button>
        <button class="toggle-btn subtle" aria-expanded={manualOpen} on:click={openManualOnly}>
          <span class="toggle-icon">{manualOpen ? '➖' : '➕'}</span>
          <span class="toggle-label">Add Time From Outside the Platform</span>
        </button>
      </div>

      {#if dailyOpen}
        <ProgressDailyTotals
          {dailyTotals}
          {formatMinutesOnly}
        />
      {/if}
      {#if manualOpen}
        <ProgressManualEntry onAdded={fetchAllUserData} />
      {/if}

      <!-- History: desktop vs mobile -->
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
    max-width: 1200px;
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
    justify-content: flex-start;
    gap: 1.4em;
    margin-bottom: 1.5em;
  }
  .toggle-btn.subtle {
    display: flex;
    align-items: center;
    gap: 0.5em;
    background: none;
    border: none;
    font-size: 1.08em;
    font-weight: 600;
    color: #4b5771;
    padding: 0.3em 0.4em 0.3em 0.4em;
    cursor: pointer;
    border-radius: 8px;
    transition: background 0.13s, color 0.13s;
    outline: none;
  }
  .toggle-btn.subtle:focus,
  .toggle-btn.subtle:hover {
    background: #f5f5f8;
    color: #e93c2f;
  }
  .toggle-icon {
    font-size: 1.24em;
    color: #a3a3b2;
    transition: color 0.14s;
  }
  .toggle-btn.subtle:hover .toggle-icon {
    color: #e93c2f;
  }
  .toggle-label {
    font-weight: 500;
    font-size: 1em;
    letter-spacing: 0.01em;
  }
  /* Mobile tweaks */
  @media (max-width: 600px) {
    .profile-main {
      padding: 1.1rem 0.6rem 1.3rem 0.6rem;
      border-radius: 0;
      margin: 0;
    }
    .profile-header-row {
      flex-direction: column;
      gap: 0.7em;
      align-items: flex-start;
      margin-bottom: 1em;
    }
    .progress-controls-row {
      flex-direction: column;
      gap: 1em;
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
