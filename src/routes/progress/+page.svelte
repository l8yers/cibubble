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
	import BubbleSpinner from '$lib/components/ui/BubbleSpinner.svelte';

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
	<div class="progress-loading"><BubbleSpinner /></div>
{:else if (!$user)}
	<div class="profile-main" style="text-align:center;">
		<div style="margin:2em 0;">
			Not logged in.<br /><a href="/login" class="video-link">Login here</a>
		</div>
	</div>
{:else}
	<div class="progress-layout">
		<div class="progress-row">
			<!-- STATISTICS COLUMN -->
			<div>
				<div class="card stats-card">
					<div class="card-heading">Statistics</div>
					<div class="stats-list">
						<div class="stat-item stat-time">
							<div class="stat-icon-col">
								<Timer class="stat-icon" size={40} />
							</div>
							<div class="stat-main">
								<div class="stat-value">
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
								<div class="stat-label">total input</div>
							</div>
						</div>
						<div class="stat-item stat-today">
							<div class="stat-icon-col">
								<CalendarCheck class="stat-icon" size={40} />
							</div>
							<div class="stat-main">
								<div class="stat-value">
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
								<div class="stat-label">watched today</div>
							</div>
						</div>
						<div class="stat-item stat-practiced">
							<div class="stat-icon-col">
								<Award class="stat-icon" size={40} />
							</div>
							<div class="stat-main">
								<div class="stat-value">{p.daysPracticed}</div>
								<div class="stat-label">days practiced</div>
							</div>
						</div>
						<div class="stat-item stat-outside">
							<div class="stat-icon-col">
								<ExternalLink class="stat-icon" size={40} />
							</div>
							<div class="stat-main">
								<div class="stat-value">{formatHours(p.outsideTime)}</div>
								<div class="stat-label">from other sources</div>
							</div>
						</div>
					</div>
					<!-- OUTSIDE LINKS INSIDE CARD AT BOTTOM -->
					<div class="outside-links-row">
						<a class="outside-link" on:click|preventDefault={() => (showManualModal = true)} href="#">
							Add time from other sources
						</a>
						<a class="outside-link" on:click|preventDefault={() => (showManualTab = true)} href="#">
							View time from other sources
						</a>
					</div>
				</div>
			</div>
			<!-- ACTIVITY CARD -->
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

<style>
.progress-loading {
	display: flex;
	align-items: center;
	justify-content: center;
	min-height: 40vh;
	width: 100%;
}
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
.progress-row {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 2em;
  width: 100%;
}
.stats-card {
  min-width: 240px;
  max-width: 430px;
}
.activity-card {
  min-width: 320px;
}
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
  box-shadow: 0 3px 22px 0 #e9eaee18;
}

/* Statistics: stat-item row layout */
.stats-list {
  display: flex;
  flex-direction: column;
  gap: 1.1em;
  width: 100%;
}
.stat-item {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 1.2em;
  border-radius: 14px;
  padding: 1.15em 1.4em 1.15em 1.2em;
  font-size: 1.08em;
  box-shadow: 0 2px 10px 0 #e9eaee10;
  border: 1.1px solid #ededf2;
  margin-bottom: 0;
  background: #fff;
  transition: box-shadow 0.17s;
}

/* Give each stat a soft background tint */
.stat-time { background: #ffeaea; border-color: #ffeaea; }
.stat-today { background: #eaffea; border-color: #eaffea; }
.stat-practiced { background: #fff6e4; border-color: #fff6e4; }
.stat-outside { background: #e7f5fb; border-color: #e7f5fb; }

.stat-item .stat-icon-col {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 70px;
  height: 70px;
}
.stat-item .stat-icon {
  width: 70px !important;
  height: 70px !important;
  opacity: 0.98;
  color: #191919;
}

.stat-item .stat-main {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
}

.stat-value {
  font-size: 1.75em;
  font-weight: 700;
  margin-bottom: 0.07em;
  line-height: 1.09;
  color: #181d27;
}
.stat-label {
  font-size: 1.03em;
  font-weight: 600;
  margin-bottom: 0.08em;
  margin-top: 0.1em;
  color: #181d27;
}

.outside-links-row {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.21em;
  margin-top: 1.3em;
  margin-left: 0.08em;
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

.card-heading {
  font-size: 1.22em;
  font-weight: 800;
  color: #181d27;
  letter-spacing: 0.03em;
  margin-bottom: 0.9em;
  text-align: left;
  text-transform: none;
  line-height: 1.16;
}
.activity-heading {
  margin-bottom: 1em;
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
  color: #6c7591;
  text-align: center;
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
@media (max-width: 900px) {
  .progress-row {
    grid-template-columns: 1fr;
    gap: 1em;
  }
  .stats-card,
  .activity-card {
    max-width: 100%;
    min-width: 0;
  }
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
  .stats-list {
    gap: 0.7em;
  }
  .stat-item {
    font-size: 0.99em;
    padding: 0.8em 0.6em 0.7em 0.6em;
    gap: 0.8em;
  }
  .stat-item .stat-icon-col {
    width: 56px;
    height: 56px;
  }
  .stat-item .stat-icon {
    width: 40px !important;
    height: 40px !important;
  }
  .stat-value {
    font-size: 1.33em;
  }
}
@media (max-width: 600px) {
  .progress-layout {
    margin: 1.6em 0.6em 1.4em 0.6em;
    gap: 1.5em;
    padding: 0;
  }
  .card, .stats-card, .activity-card {
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
