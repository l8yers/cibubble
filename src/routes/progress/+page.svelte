<script>
	import { onMount } from 'svelte';
	import { user } from '$lib/stores/user.js';
	import { progressData, fetchProgressData, updateUserEmail, updateUserPassword, deleteManualEntry, updateManualEntry } from '$lib/stores/progress.js';
	import ProgressManualEntry from '$lib/components/progress/ProgressManualEntry.svelte';
	import MonthlyCalendar from '$lib/components/progress/MonthlyCalendar.svelte';
	import ManualEntryList from '$lib/components/progress/ManualEntryList.svelte';
	import ManualEntryEditForm from '$lib/components/progress/ManualEntryEditForm.svelte';
	import ProgressSettings from '$lib/components/progress/ProgressSettings.svelte';
	import { Timer, CalendarCheck, Award, ExternalLink, Settings } from 'lucide-svelte';
	import { writable } from 'svelte/store';
	import { formatWatchTime, formatFullTime, formatMinutesOnly, formatHours } from '$lib/utils/time.js';

	const windowWidth = writable(typeof window !== 'undefined' ? window.innerWidth : 1200);
	const SENTINEL_DATE = '1975-01-01';

	let showSettings = false;
	let showManualModal = false;
	let showManualTab = false;
	let editEntry = null;

	let showTotalTooltip = false;
	let showTodayTooltip = false;

	let lastFetchedUserId = null;
	$: if ($user && $user.id && $user.id !== lastFetchedUserId) {
		fetchProgressData($user);
		lastFetchedUserId = $user.id;
	}

	$: p = $progressData;

	let newEmail = '';
	let newPassword = '';

	function handleEmailUpdate() {
		updateUserEmail(newEmail);
	}
	function handlePasswordUpdate() {
		updateUserPassword(newPassword);
		newPassword = '';
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
	<div class="progress-layout">
		<!-- STATS CARD -->
		<div class="card stats-card">
			<div class="stats-heading-row">
				<div class="card-heading">Statistics</div>
				<button class="settings-link" on:click={() => (showSettings = true)} aria-label="Settings">
					<Settings size={20} />
				</button>
			</div>
			<div class="stats-boxes-row">
				<div class="stat-box stat-time">
					<div class="stat-inner-box">
						<Timer class="stat-icon" style="color:#e93c2f;" />
						<div class="stat-number">
							<span
								class="tooltip-parent"
								tabindex="0"
								on:mouseenter={() => (showTotalTooltip = true)}
								on:mouseleave={() => (showTotalTooltip = false)}
								on:focus={() => (showTotalTooltip = true)}
								on:blur={() => (showTotalTooltip = false)}
							>
								{formatWatchTime(p.watchTime)}
								{#if showTotalTooltip}
									<span class="custom-tooltip stat-time-tooltip">{formatFullTime(p.watchTime)}</span>
								{/if}
							</span>
						</div>
						<div class="stat-label">total input time</div>
					</div>
				</div>
				<div class="stat-box stat-today">
					<div class="stat-inner-box">
						<CalendarCheck class="stat-icon" style="color:#23b04a;" />
						<div class="stat-number">
							<span
								class="tooltip-parent"
								tabindex="0"
								on:mouseenter={() => (showTodayTooltip = true)}
								on:mouseleave={() => (showTodayTooltip = false)}
								on:focus={() => (showTodayTooltip = true)}
								on:blur={() => (showTodayTooltip = false)}
							>
								{formatWatchTime(p.todayWatchTime)}
								{#if showTodayTooltip}
									<span class="custom-tooltip stat-today-tooltip">{formatFullTime(p.todayWatchTime)}</span>
								{/if}
							</span>
						</div>
						<div class="stat-label">todays watch time</div>
					</div>
				</div>
				<div class="stat-box stat-practiced">
					<div class="stat-inner-box">
						<Award class="stat-icon" style="color:#e3a800;" />
						<div class="stat-number">{p.daysPracticed}</div>
						<div class="stat-label">days you practiced</div>
					</div>
				</div>
			</div>
		</div>

		<!-- OUTSIDE HOURS & ACTIVITY ROW -->
		<div class="progress-row">
			<div class="card outside-card">
				<div class="card-heading">Outside Hours</div>
				<div class="outside-box">
					<ExternalLink class="stat-icon" style="color:#2196d3;" />
					<div class="outside-number">{formatHours(p.outsideTime)}</div>
					<div class="outside-label outside-label-lower">hours outside the platform</div>
				</div>
				<div class="outside-links-row">
					<a class="outside-link" on:click|preventDefault={() => (showManualModal = true)} href="#">
						Add time outside the platform
					</a>
					<a class="outside-link" on:click|preventDefault={() => (showManualTab = true)} href="#">
						View time outside the platform
					</a>
				</div>
			</div>

			<div class="card activity-card">
				<div class="card-heading activity-heading">Your Activity</div>
				<div class="activity-2col align-top">
					<div class="activity-stats-cards">
						<div class="mini-stat-card">
							<div class="mini-stat-number">{p.weeksInARow}</div>
							<div class="mini-stat-label">Weeks in a row</div>
						</div>
						<div class="mini-stat-card">
							<div class="mini-stat-number">{p.daysThisMonth}</div>
							<div class="mini-stat-label">Days this month</div>
						</div>
					</div>
					<div class="calendar-section" style="margin-top: 0.3em;">
						<MonthlyCalendar
							dailyTotals={p.dailyTotals || []}
							manualEntries={p.manualTotals || []}
							{formatMinutesOnly}
							class="no-border-calendar compact-calendar"
						/>
					</div>
				</div>
			</div>
		</div>
	</div>
{/if}

<!-- ===== MODALS ===== -->

{#if showManualModal}
  <div class="modal-backdrop" on:click={() => (showManualModal = false)}>
    <div class="modal-content" on:click|stopPropagation>
      <ProgressManualEntry onCancel={() => (showManualModal = false)} />
    </div>
  </div>
{/if}

{#if showManualTab}
  <div class="modal-backdrop" on:click={() => { showManualTab = false; editEntry = null; }}>
    <div class="modal-content" on:click|stopPropagation>
      {#if !editEntry}
        <ManualEntryList
          manualEntries={p.manualTotals || []}
          formatMinutesOnly={formatWatchTime}
          {SENTINEL_DATE}
          on:cancel={() => { showManualTab = false; editEntry = null; }}
          on:edit={(e) => (editEntry = e.detail)}
          on:delete={(e) => deleteManualEntry(e.detail, $user)}
        />
      {:else}
        <ManualEntryEditForm
          entry={editEntry}
          on:submit={(e) => updateManualEntry(e.detail, $user)}
          on:cancel={() => (editEntry = null)}
        />
      {/if}
    </div>
  </div>
{/if}

{#if showSettings}
  <div class="modal-backdrop" on:click={() => (showSettings = false)}>
    <div class="modal-content" on:click|stopPropagation>
      <ProgressSettings
        email={p.email}
        newEmail={newEmail}
        setNewEmail={v => (newEmail = v)}
        newPassword={newPassword}
        setNewPassword={v => (newPassword = v)}
        message={p.message}
        updateEmail={handleEmailUpdate}
        updatePassword={handlePasswordUpdate}
        back={() => (showSettings = false)}
      />
    </div>
  </div>
{/if}
<svg width="70" height="22">
  <circle cx="12" cy="12" r="9" fill="#e93c2f">
    <animate attributeName="cy" values="12;4;12" dur="0.7s" repeatCount="indefinite"/>
  </circle>
  <circle cx="35" cy="12" r="9" fill="#31b361">
    <animate attributeName="cy" values="12;20;12" dur="0.7s" begin="0.2s" repeatCount="indefinite"/>
  </circle>
  <circle cx="58" cy="12" r="9" fill="#f4a000">
    <animate attributeName="cy" values="12;4;12" dur="0.7s" begin="0.4s" repeatCount="indefinite"/>
  </circle>
</svg> 

<style>
body,
:global(body) {
  background: #f7f8fc;
}

.progress-layout {
  max-width: 1200px;
  margin: 2.5em auto 2em auto;
  display: flex;
  flex-direction: column;
  gap: 2.3em;
}

/* Outer cards */
.card {
  background: #fff;
  border-radius: 22px;
  padding: 2.3em 2.4em 2.3em 2.4em;
  margin-bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  min-width: 0;
  box-sizing: border-box;
  border: 1.2px solid #ededf2;
}

/* Stats: row of 3 colored cards inside white card */
.stats-boxes-row {
  display: flex;
  width: 100%;
  gap: 2em;
  margin: 0;
  margin-top: 1.1em;
  flex-wrap: wrap;
  justify-content: space-between;
}

/* Stat box sizing and spacing */
.stat-box {
  flex: 1 1 0;
  min-width: 240px;
  max-width: 370px;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: stretch;
}

/* Stat backgrounds and color */
.stat-time .stat-inner-box {
  background: #ffeaea;
}
.stat-today .stat-inner-box {
  background: #eaffea;
}
.stat-practiced .stat-inner-box {
  background: #fff6e4;
}
.stat-time .stat-icon,
.stat-time .stat-inner-box svg { color: #e93c2f !important; }
.stat-today .stat-icon,
.stat-today .stat-inner-box svg { color: #23b04a !important; }
.stat-practiced .stat-icon,
.stat-practiced .stat-inner-box svg { color: #e3a800 !important; }
.stat-time .stat-number,
.stat-time .stat-label { color: #e93c2f; }
.stat-today .stat-number,
.stat-today .stat-label { color: #23b04a; }
.stat-practiced .stat-number,
.stat-practiced .stat-label { color: #e3a800; }

/* Stat inner box: updated look */
.stat-inner-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  border-radius: 18px;
  padding: 1.8em 1em 1.35em 1em;
  text-align: center;
  font-family: inherit;
  border: 1.2px solid #ededf2;
  box-shadow: 0 3px 22px 0 #e9eaee18;
  margin: 0;
  gap: 0.53em;
  background: #fff;
  min-height: 130px;
}

/* Stat icon */
.stat-inner-box svg,
.stat-icon {
  width: 38px !important;
  height: 38px !important;
  margin-bottom: 0.25em;
  display: block;
  opacity: 0.97;
}

/* Stat number */
.stat-number {
  font-size: 2.1em;
  font-weight: 900;
  letter-spacing: 0.01em;
  margin-bottom: 0.07em;
  margin-top: 0.03em;
  text-align: center;
  line-height: 1.13;
}

/* Stat label */
.stat-label {
  font-size: 1.12em;
  font-weight: 600;
  margin-top: 0.14em;
  color: inherit;
  letter-spacing: 0.02em;
  text-transform: none;
}

/* OUTSIDE HOURS - updated to match stats cards look & colors */
.outside-box {
  background: #e7f5fb;
  border-radius: 18px;
  width: 100%;
  padding: 1.7em 1em 1.2em 1em;
  text-align: center;
  margin-top: 1.1em;
  margin-bottom: 0.8em;
  display: flex;
  flex-direction: column;
  align-items: center;
  border: 1.2px solid #e1edf7;
  box-shadow: 0 3px 22px 0 #b8eaff1a;
  gap: 0.3em;
  min-height: 130px;
}
.outside-box .stat-icon,
.outside-box svg {
  color: #2196d3 !important;
  width: 38px !important;
  height: 38px !important;
  margin-bottom: 0.25em;
  display: block;
  opacity: 0.97;
}
.outside-number {
  font-size: 2.1em;
  font-weight: 900;
  letter-spacing: 0.01em;
  margin-bottom: 0.07em;
  margin-top: 0.03em;
  text-align: center;
  line-height: 1.13;
  color: #2196d3;
}
.outside-label,
.outside-label-lower {
  font-size: 1.12em;
  font-weight: 600;
  margin-top: 0.14em;
  color: #2196d3;
  letter-spacing: 0.02em;
  text-transform: none;
}

/* STATS HEADER */
.stats-heading-row {
  display: flex;
  width: 100%;
  margin-bottom: 0.6em;
  align-items: center;
  justify-content: space-between;
}
.card-heading {
  font-size: 1.22em;
  font-weight: 800;
  color: #181d27;
  letter-spacing: 0.03em;
  margin-bottom: 0.1em;
  text-align: left;
  text-transform: none;
  line-height: 1.16;
}
.activity-heading {
  margin-bottom: 1em;
}

/* Settings icon btn */
.settings-link {
  background: none;
  border: none;
  color: #b8b8b8;
  cursor: pointer;
  transition: color 0.18s;
  display: flex;
  align-items: center;
  margin-left: 1em;
  padding: 0.15em 0.3em;
  border-radius: 8px;
  font-size: 1.01em;
}
.settings-link:hover,
.settings-link:focus {
  color: #e93c2f;
  background: #fff6f6;
  outline: none;
}

/* OUTSIDE & ACTIVITY GRID */
.progress-row {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 2em;
  width: 100%;
}
.outside-card {
  min-width: 240px;
  max-width: 430px;
}
.activity-card {
  min-width: 320px;
}

/* Links for "Add/View outside hours" */
.outside-links-row {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.21em;
  margin-top: 0.5em;
  margin-left: 0.1em;
}
.outside-link {
  color: #e93c2f;
  font-weight: 700;
  font-size: 1em;
  text-decoration: none;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.09em 0.08em;
  border-radius: 4px;
  transition: color 0.15s, background 0.13s;
  display: block;
}
.outside-link:hover,
.outside-link:focus {
  color: #fd6c6c;
  background: #fff3f1;
  outline: none;
}

/* ACTIVITY STATS MINI CARDS */
.activity-2col {
  display: flex;
  flex-direction: row;
  gap: 2.1em;
  width: 100%;
  align-items: flex-start;
}
.activity-stats-cards {
  display: flex;
  flex-direction: column;
  gap: 1em;
  min-width: 130px;
  max-width: 160px;
  margin-right: 1.7em;
}
.mini-stat-card {
  background: #f7f8fc;
  border: 1.2px solid #ededf2;
  border-radius: 13px;
  padding: 0.88em 1em 0.78em 1em;
  display: flex;
  flex-direction: column;
  align-items: center;
  box-sizing: border-box;
}
.mini-stat-number {
  font-size: 1.38em;
  font-weight: 900;
  color: #6c7591; /* matches .mini-stat-label */  text-align: center;
  letter-spacing: 0.02em;
  margin-bottom: 0.33em;
  margin-top: 0;
}
.mini-stat-label {
  font-size: 1em;
  font-weight: 600;
  color: #6c7591;
  text-align: center;
  letter-spacing: 0.01em;
}

/* Calendar smaller/tighter, especially on desktop */
.calendar-section {
  margin-top: 0.3em;
  flex: 1 1 auto;
  min-width: 0;
  max-width: 320px;
  width: 100%;
  display: flex;
  align-items: flex-start;
}
:global(.compact-calendar) {
  padding: 0.7em 0.6em 1em 0.6em !important;
  max-width: 320px !important;
}
:global(.compact-calendar .calendar-header) {
  font-size: 0.95em !important;
  margin-bottom: 0.5em !important;
}
:global(.compact-calendar .calendar-label) {
  font-size: 0.89em !important;
  margin-bottom: 0.05em !important;
}
:global(.compact-calendar .calendar-cell) {
  min-height: 36px !important;
  height: 36px !important;
  width: 36px !important;
  font-size: 0.92em !important;
  padding: 0.11em 0 0.01em 0 !important;
}
:global(.compact-calendar .calendar-cell .date) {
  font-size: 0.97em !important;
}
:global(.compact-calendar .calendar-cell .mins) {
  font-size: 0.52em !important;
  margin-top: 1px !important;
}

/* Mobile: stats and calendar go horizontal */
@media (max-width: 900px) {
  .activity-2col {
    flex-direction: column;
    gap: 1em;
  }
  .activity-stats-cards {
    flex-direction: row;
    gap: 1em;
    margin: 0 0 1em 0;
    min-width: 0;
    max-width: 100%;
    justify-content: flex-start;
  }
  .calendar-section {
    max-width: 100%;
  }
  .stats-boxes-row {
    flex-direction: column;
    gap: 1em;
  }
  .stat-box {
    max-width: 100%;
    min-width: 0;
  }
  .progress-row {
    grid-template-columns: 1fr;
    gap: 1em;
  }
  .outside-card,
  .activity-card {
    max-width: 100%;
    min-width: 0;
  }
  .stat-inner-box,
  .outside-box {
    border-radius: 12px;
    padding: 1.1em 0.3em 1em 0.3em;
    min-height: 90px;
  }
  .stat-number,
  .outside-number {
    font-size: 1.28em;
    margin-top: 0.25em;
    margin-bottom: 0.10em;
  }
  .stat-label,
  .outside-label,
  .outside-label-lower {
    font-size: 0.99em;
    margin-top: 0.16em;
  }
  .stat-inner-box svg,
  .outside-box svg {
    width: 30px !important;
    height: 30px !important;
    margin-bottom: 0.17em;
  }
}

@media (max-width: 600px) {
  .progress-layout {
    margin: 1.6em 0.6em 1.4em 0.6em;
    gap: 1.5em;
    padding: 0;
  }
  .card, .outside-card, .activity-card {
    padding: 1.1em 0.6em 1.5em 0.6em;
    border-radius: 13px;
    box-shadow: 0 3px 16px 0 #e9eaee55;
    margin-bottom: 0.7em;
  }
  .stats-heading-row {
    margin-bottom: 0.6em;
  }
  .card-heading {
    font-size: 1.04em;
  }
}

.tooltip-parent {
  position: relative;
  cursor: pointer;
  outline: none;
  display: inline-block;
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
  font-size: 1.01rem;
  font-weight: 500;
  padding: 0.53em 1.1em;
  border-radius: 12px;
  white-space: nowrap;
  z-index: 10;
  pointer-events: none;
  opacity: 1;
  animation: fadeIn 0.17s;
}
.stat-time-tooltip { background: #e93c2f; }
.stat-today-tooltip { background: #31b361; }
.stat-practiced-tooltip { background: #f4a000; }
@keyframes fadeIn {
  from { opacity: 0; transform: translateX(-50%) translateY(8px);}
  to { opacity: 1; transform: translateX(-50%) translateY(0);}
}

.modal-backdrop {
  position: fixed;
  z-index: 1000;
  inset: 0;
  background: rgba(24, 29, 39, 0.31);
  display: flex;
  align-items: center;
  justify-content: center;
}
.modal-content {
  background: #fff;
  border-radius: 18px;
  max-width: 98vw;
  min-width: 320px;
  max-height: 94vh;
  padding: 2.1em 1.6em 1.5em 1.6em;
  box-shadow: 0 3px 44px 0 #22292f22;
  position: relative;
  overflow: auto;
}
@media (max-width: 600px) {
  .modal-content {
    min-width: 0;
    max-width: 99vw;
    padding: 1.1em 0.2em 1.1em 0.2em;
    border-radius: 10px;
  }
}
</style>
