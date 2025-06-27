<script>
  import { onMount } from 'svelte';
  import { user, loadUser } from '$lib/stores/user.js';
  import { supabase } from '$lib/supabaseClient.js';
  import ProgressStats from '$lib/components/progress/ProgressStats.svelte';
  import ProgressSettings from '$lib/components/progress/ProgressSettings.svelte';
  import ProgressManualEntry from '$lib/components/progress/ProgressManualEntry.svelte';
  import MonthlyCalendar from '$lib/components/progress/MonthlyCalendar.svelte';
  import { writable } from 'svelte/store';

  export const windowWidth = writable(typeof window !== 'undefined' ? window.innerWidth : 1200);

  onMount(() => {
    const updateWidth = () => windowWidth.set(window.innerWidth);
    window.addEventListener('resize', updateWidth);
    updateWidth();
    loadUser();
    return () => window.removeEventListener('resize', updateWidth);
  });

  let email = '';
  let newEmail = '';
  let newPassword = '';
  let message = '';
  let watchTime = 0;
  let todayWatchTime = 0;
  let streak = 0;
  let showTotalTooltip = false;
  let showTodayTooltip = false;
  let showSettings = false;
  let dailyTotals = [];
  let manualTotals = [];
  let showManualModal = false;

  function openManualModal() {
    showManualModal = true;
  }
  function closeManualModal() {
    showManualModal = false;
  }

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

  let lastFetchedUserId = null;
  $: if ($user && $user.id && $user.id !== lastFetchedUserId) {
    fetchAllUserData($user.id);
    lastFetchedUserId = $user.id;
  }

  async function fetchAllUserData(userId) {
    email = $user.email;
    newEmail = email;

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

    let { data: allSessionsForDaily, error } = await supabase
      .from('watch_sessions')
      .select('date, seconds, source, video_id')
      .eq('user_id', userId);

    if (error) {
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
    // Streak logic unchanged
    streak = 0;
    for (let i = 0; i < dailyTotals.length; i++) {
      if (dailyTotals[i].totalSeconds > 0) streak++;
      else break;
    }
  }
</script>

{#if $user === undefined}
  <div style="text-align:center; margin:3em;">Loading...</div>
{:else if !$user}
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

      <div class="progress-controls-row" style="justify-content: flex-end; gap: 0;">
        <a
          class="add-outside-link"
          on:click={openManualModal}
          tabindex="0"
          role="button"
        >
          + Add time outside the platform
        </a>
      </div>

      <MonthlyCalendar
        dailyTotals={dailyTotals || []}
        manualEntries={manualTotals || []}
        formatMinutesOnly={formatMinutesOnly}
      />

      {#if showManualModal}
        <div class="modal-backdrop" on:click={closeManualModal}>
          <div class="modal-content" on:click|stopPropagation>
            <button class="close-button" on:click={closeManualModal} aria-label="Close modal">×</button>
            <ProgressManualEntry onAdded={() => { fetchAllUserData($user.id); closeManualModal(); }} />
          </div>
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
  justify-content: flex-end;
  gap: 0;
  margin: 2em 0 2.5em 0;
  flex-wrap: wrap;
}
.add-outside-link {
  color: #e93c2f;
  font-size: 1.08em;
  font-weight: 600;
  text-decoration: none;
  padding: 0.2em 0.1em;
  margin-right: 0.3em;
  cursor: pointer;
  background: none;
  border: none;
  outline: none;
  transition: color 0.14s;
  display: inline-block;
}
.add-outside-link:hover,
.add-outside-link:focus {
  color: #b31212;
  text-decoration: underline;
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
    justify-content: flex-end;
    gap: 0.2em;
    margin-bottom: 1.4em;
  }
  .add-outside-link {
    font-size: 1em;
    margin-right: 0.12em;
  }
}

</style>
