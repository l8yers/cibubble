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
  // import MonthlyCalendar from '$lib/components/progress/MonthlyCalendar.svelte';


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
  let showTodayTooltip = false;
  let showSettings = false;
  let dailyTotals = [];
  let manualTotals = [];
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

    await fetchRecentActivity(userId);

    let { data: watchedSessions } = await supabase
      .from('watch_sessions')
      .select('video_id, date, inserted_at, seconds, source')
      .eq('user_id', userId);

    // Build videoMap for watchedVideos list (optional)
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

    // Separate dailyTotals and manualTotals by checking video_id presence
    let { data: allSessionsForDaily, error } = await supabase
      .from('watch_sessions')
      .select('date, seconds, source, video_id')
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching daily sessions:', error);
      dailyTotals = [];
      manualTotals = [];
    } else {
      const dailyMap = {};
      const manualMap = {};

      (allSessionsForDaily ?? []).forEach(({ date, seconds, video_id, source }) => {
        if (!date) return;
        if (video_id) {
          dailyMap[date] = (dailyMap[date] || 0) + (seconds || 0);
        } else {
          if (!manualMap[date]) manualMap[date] = { totalSeconds: 0, source: '' };
          manualMap[date].totalSeconds += seconds || 0;
          if (source && !manualMap[date].source.includes(source)) {
            manualMap[date].source += (manualMap[date].source ? ', ' : '') + source;
          }
        }
      });

      dailyTotals = Object.entries(dailyMap)
        .map(([date, totalSeconds]) => ({ date, totalSeconds }))
        .sort((a, b) => b.date.localeCompare(a.date));

      manualTotals = Object.entries(manualMap)
        .map(([date, { totalSeconds, source }]) => ({ date, totalSeconds, source }))
        .sort((a, b) => b.date.localeCompare(a.date));
    }

    // Calculate streak by counting consecutive days from the newest dailyTotals
    streak = 0;
    for (let i = 0; i < dailyTotals.length; i++) {
      if (dailyTotals[i].totalSeconds > 0) streak++;
      else break;
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
        {showTodayTooltip}
        setShowTodayTooltip={(val) => (showTodayTooltip = val)}
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

<!-- <MonthlyCalendar {dailyTotals} {manualEntries} {formatMinutesOnly} /> -->
      {#if dailyOpen}
        <ProgressDailyTotals
          dailyTotals={dailyTotals}
          manualEntries={manualTotals}
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
        <!-- Hide old text link on mobile, show big button -->
        <div class="history-link-row-mobile">
          <button class="history-button-mobile" on:click={() => window.location.href = '/history'}>
            View Full Watch History
          </button>
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
    margin: 2.2rem auto 2.2rem auto;
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
  /* Mobile tweaks */
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
      font-size: 0.9rem;
    }
    .progress-controls-row {
      flex-direction: row;
      gap: 1em;
      justify-content: center;
    }
    .cibubble-btn {
      flex: 1 1 48%;
      max-width: none;
      padding: 1em 0;
      font-size: 1em;
      margin: 0;
      box-sizing: border-box;
      text-align: center;
    }
    .history-link-row {
      display: none;
    }
    .history-link-row-mobile {
      display: flex;
      justify-content: center;
      margin-top: 1em;
      margin-bottom: 1em;
    }
    .history-button-mobile {
      background: #2562e9;
      color: white;
      font-size: 1.1em;
      font-weight: 700;
      padding: 1em 2em;
      border: none;
      border-radius: 11px;
      cursor: pointer;
      box-shadow: 0 2px 9px #2562e933;
      transition: background 0.2s ease;
      width: 90%;
      max-width: 400px;
    }
    .history-button-mobile:hover,
    .history-button-mobile:focus {
      background: #e93c2f;
      outline: none;
      box-shadow: 0 3px 12px #e93c2f55;
    }
  }
</style>
