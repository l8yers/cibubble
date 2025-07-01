<script>
	import { onMount } from 'svelte';
	import { user } from '$lib/stores/user.js';
	import { supabase } from '$lib/supabaseClient.js';
	import ProgressManualEntry from '$lib/components/progress/ProgressManualEntry.svelte';
	import MonthlyCalendar from '$lib/components/progress/MonthlyCalendar.svelte';
	import ManualEntryList from '$lib/components/progress/ManualEntryList.svelte';
	import ManualEntryEditForm from '$lib/components/progress/ManualEntryEditForm.svelte';
	import ProgressSettings from '$lib/components/progress/ProgressSettings.svelte';
	import { Timer, CalendarCheck, Award, ExternalLink, Settings } from 'lucide-svelte';
	import { writable } from 'svelte/store';

	export const windowWidth = writable(typeof window !== 'undefined' ? window.innerWidth : 1200);
	const SENTINEL_DATE = '1975-01-01';

	let email = '';
	let newEmail = '';
	let newPassword = '';
	let message = '';
	let watchTime = 0;
	let todayWatchTime = 0;
	let daysPracticed = 0;
	let outsideTime = 0;
	let weeksInARow = 0;
	let daysThisMonth = 0;

	let showSettings = false;
	let dailyTotals = [];
	let manualTotals = [];
	let showManualModal = false;
	let showManualTab = false;
	let editEntry = null;

	// Tooltip state
	let showTotalTooltip = false;
	let showTodayTooltip = false;

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
	function formatHours(seconds) {
		if (!seconds) return '0 hrs';
		return Math.round(seconds / 3600) + ' hrs';
	}

	function openManualModal() {
		showManualModal = true;
	}
	function closeManualModal() {
		showManualModal = false;
	}

	async function updateEmail() {
		message = '';
		if (!newEmail || newEmail === email) {
			message = 'Please enter a new email address.';
			return;
		}
		const { error: updateError } = await supabase.auth.updateUser({ email: newEmail });
		if (updateError) {
			message = updateError.message || 'Failed to update email.';
			return;
		}
		message = 'Email updated. Please check your inbox for a confirmation email.';
		email = newEmail;
	}
	async function updatePassword() {
		message = '';
		if (!newPassword) {
			message = 'Please enter a new password.';
			return;
		}
		const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
		if (updateError) {
			message = updateError.message || 'Failed to update password.';
			return;
		}
		message = 'Password updated.';
		newPassword = '';
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
			.select('id, date, seconds, source, video_id')
			.eq('user_id', userId);

		if (error) {
			dailyTotals = [];
			manualTotals = [];
			outsideTime = 0;
		} else {
			const dailyMap = {};
			const manualArr = [];
			let outsideSeconds = 0;
			(allSessionsForDaily ?? []).forEach(({ id, date, seconds, video_id, source }) => {
				if (!date) return;
				if (video_id) {
					dailyMap[date] = (dailyMap[date] || 0) + (seconds || 0);
				} else {
					// Manual entries get pushed as an object (not grouped by date)
					manualArr.push({
						id,
						date,
						totalSeconds: seconds,
						source: source || ''
					});
					outsideSeconds += seconds || 0;
				}
			});
			dailyTotals = Object.entries(dailyMap)
				.map(([date, totalSeconds]) => ({ date, totalSeconds }))
				.sort((a, b) => b.date.localeCompare(a.date));
			manualTotals = manualArr.sort((a, b) => b.date.localeCompare(a.date));
			outsideTime = outsideSeconds;
		}
		daysPracticed = dailyTotals.filter((dt) => dt.totalSeconds > 0).length;

		// Calculate days this month
		const now = new Date();
		const month = now.getMonth();
		const year = now.getFullYear();
		daysThisMonth = dailyTotals.filter((dt) => {
			const d = new Date(dt.date);
			return d.getFullYear() === year && d.getMonth() === month && dt.totalSeconds > 0;
		}).length;

		// Calculate weeks in a row (basic version)
		let weekSet = new Set();
		dailyTotals.forEach((dt) => {
			if (dt.totalSeconds > 0) {
				const d = new Date(dt.date);
				const week = getISOWeekNumber(d);
				weekSet.add(`${d.getFullYear()}-${week}`);
			}
		});
		let count = 0;
		let current = new Date();
		while (true) {
			const weekKey = `${current.getFullYear()}-${getISOWeekNumber(current)}`;
			if (weekSet.has(weekKey)) {
				count++;
				current.setDate(current.getDate() - 7);
			} else {
				break;
			}
		}
		weeksInARow = count;
	}

	function getISOWeekNumber(date) {
		const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
		const dayNum = d.getUTCDay() || 7;
		d.setUTCDate(d.getUTCDate() + 4 - dayNum);
		const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
		return Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
	}

	async function deleteManualEntry(e) {
		const entry = e.detail || e;
		if (!entry.id) return alert('Missing ID for deletion!');
		const { error } = await supabase.from('watch_sessions').delete().eq('id', entry.id);
		if (error) alert('Error deleting entry: ' + error.message);
		await fetchAllUserData($user.id);
	}

	async function updateManualEntry(e) {
		const updated = e.detail || e;
		if (!updated.id) return alert('Missing ID for update!');
		const { error } = await supabase
			.from('watch_sessions')
			.update({
				date: updated.date,
				seconds: updated.totalSeconds,
				source: updated.source
			})
			.eq('id', updated.id);
		if (error) alert('Error updating entry: ' + error.message);
		editEntry = null;
		await fetchAllUserData($user.id);
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
						<Timer size={40} style="margin-bottom:0.5em; color:#e93c2f;" />
						<div class="stat-number stat-time-color">
							<span
								class="tooltip-parent"
								tabindex="0"
								on:mouseenter={() => (showTotalTooltip = true)}
								on:mouseleave={() => (showTotalTooltip = false)}
								on:focus={() => (showTotalTooltip = true)}
								on:blur={() => (showTotalTooltip = false)}
							>
								{formatWatchTime(watchTime)}
								{#if showTotalTooltip}
									<span class="custom-tooltip stat-time-tooltip">{formatFullTime(watchTime)}</span>
								{/if}
							</span>
						</div>
						<div class="stat-label stat-time-color">Total input time</div>
					</div>
				</div>
				<div class="stat-box stat-today">
					<div class="stat-inner-box">
						<CalendarCheck size={40} style="margin-bottom:0.5em; color:#31b361;" />
						<div class="stat-number stat-today-color">
							<span
								class="tooltip-parent"
								tabindex="0"
								on:mouseenter={() => (showTodayTooltip = true)}
								on:mouseleave={() => (showTodayTooltip = false)}
								on:focus={() => (showTodayTooltip = true)}
								on:blur={() => (showTodayTooltip = false)}
							>
								{formatWatchTime(todayWatchTime)}
								{#if showTodayTooltip}
									<span class="custom-tooltip stat-today-tooltip"
										>{formatFullTime(todayWatchTime)}</span
									>
								{/if}
							</span>
						</div>
						<div class="stat-label stat-today-color">Todays watch time</div>
					</div>
				</div>
				<div class="stat-box stat-practiced">
					<div class="stat-inner-box">
						<Award size={40} style="margin-bottom:0.5em; color:#f4a000;" />
						<div class="stat-number stat-practiced-color">{daysPracticed}</div>
						<div class="stat-label stat-practiced-color">Days you practiced</div>
					</div>
				</div>
			</div>
		</div>
		<!-- OUTSIDE HOURS & ACTIVITY ROW -->
		<div class="progress-row">
			<div class="card outside-card">
				<div class="card-heading">Outside Hours</div>
				<div class="outside-box">
					<ExternalLink size={40} style="margin-bottom:0.5em; color:#31b0e9;" />
					<div class="outside-number">{formatHours(outsideTime)}</div>
					<div class="outside-label outside-label-lower">hours outside the platform</div>
				</div>
				<div class="outside-links-row">
					<a class="outside-link" on:click|preventDefault={openManualModal} href="#">
						Add time outside the platform
					</a>
					<a class="outside-link" on:click|preventDefault={() => (showManualTab = true)} href="#">
						View time outside the platform
					</a>
				</div>
			</div>
			<div class="card activity-card">
				<div class="card-heading">Your Activity</div>
				<div class="activity-2col align-top">
					<div class="activity-list">
						<div class="activity-row">
							<span class="activity-label">Weeks in a row</span>
							<span class="activity-number">{weeksInARow}</span>
						</div>
						<div class="activity-row">
							<span class="activity-label">Days this month</span>
							<span class="activity-number">{daysThisMonth}</span>
						</div>
					</div>
					<div class="calendar-section" style="margin-top: 0.5em;">
						<MonthlyCalendar
							dailyTotals={dailyTotals || []}
							manualEntries={manualTotals || []}
							{formatMinutesOnly}
							class="no-border-calendar"
						/>
					</div>
				</div>
			</div>
		</div>
	</div>
	<!-- MODALS (unchanged except edit modal has no extra close "×") -->
	{#if showManualModal}
		<div class="modal-backdrop" on:click={closeManualModal}>
			<div class="modal-content" on:click|stopPropagation>
				<ProgressManualEntry ... onCancel={closeManualModal} />
			</div>
		</div>
	{/if}
	{#if showManualTab}
		<div
			class="modal-backdrop"
			on:click={() => {
				showManualTab = false;
				editEntry = null;
			}}
		>
			<div class="modal-content" on:click|stopPropagation>
				{#if !editEntry}
					<ManualEntryList
						manualEntries={manualTotals || []}
						formatMinutesOnly={formatWatchTime}
						{SENTINEL_DATE}
						on:cancel={() => {
							showManualTab = false;
							editEntry = null;
						}}
						on:edit={(e) => (editEntry = e.detail)}
						on:delete={(e) => deleteManualEntry(e.detail)}
					/>
				{:else}
					<ManualEntryEditForm
						entry={editEntry}
						on:submit={(e) => updateManualEntry(e.detail)}
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
			</div>
		</div>
	{/if}
{/if}

<style>
body,
:global(body) {
  background: #f7f8fc;
}

/* MAIN LAYOUT */
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

.stat-box {
  flex: 1 1 0;
  min-width: 240px;
  max-width: 370px;
  display: flex;
  flex-direction: column;
  align-items: stretch;
}

/* Stat backgrounds and unified color for icon/number/text */
.stat-inner-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  border-radius: 16px;
  padding: 1.5em 1em 1.2em 1em;
  text-align: center;
  font-family: inherit;
  border: 1.2px solid #ededf2;
  background: #fff;
}

.stat-time .stat-inner-box {
  background: #ffeaea;
}
.stat-time .stat-icon,
.stat-time .stat-number,
.stat-time .stat-label {
  color: #e93c2f;
}

.stat-today .stat-inner-box {
  background: #eaffea;
}
.stat-today .stat-icon,
.stat-today .stat-number,
.stat-today .stat-label {
  color: #23b04a;
}

.stat-practiced .stat-inner-box {
  background: #fff6e4;
}
.stat-practiced .stat-icon,
.stat-practiced .stat-number,
.stat-practiced .stat-label {
  color: #e3a800;
}

/* Stat icon */
.stat-inner-box svg,
.stat-icon {
  width: 36px;
  height: 36px;
  margin-bottom: 0.18em;
  display: block;
  opacity: 0.97;
}

/* Stat number */
.stat-number {
  font-size: 1.57em;
  font-weight: 900;
  letter-spacing: 0.01em;
  margin-bottom: 0.11em;
  margin-top: 0.08em;
  text-align: center;
  line-height: 1.13;
}

/* Stat label */
.stat-label {
  font-size: 1em;
  font-weight: 600;
  margin-top: 0.07em;
  color: inherit;
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
  grid-template-columns: 1fr 2fr;   /* 1/3 : 2/3 ratio */
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

/* OUTSIDE HOURS STAT BOX */
.outside-box {
  background: #e7f5fb;
  border-radius: 15px;
  width: 100%;
  padding: 1.5em 1em 1.2em 1em;
  text-align: center;
  margin-top: 1.1em;
  margin-bottom: 0.8em;
  display: flex;
  flex-direction: column;
  align-items: center;
  border: 1.2px solid #e1edf7;
}
.outside-box svg,
.outside-number,
.outside-label,
.outside-label-lower {
  color: #2196d3;
}
.outside-box svg {
  width: 36px;
  height: 36px;
  margin-bottom: 0.18em;
  opacity: 0.97;
}
.outside-number {
  font-size: 1.57em;
  font-weight: 900;
  letter-spacing: 0.01em;
  margin-bottom: 0.11em;
  margin-top: 0.08em;
  text-align: center;
  line-height: 1.13;
}
.outside-label,
.outside-label-lower {
  font-size: 1em;
  font-weight: 600;
  margin-top: 0.07em;
  color: #2196d3;
  letter-spacing: 0.02em;
  text-transform: none;
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

/* ACTIVITY */
.activity-2col {
  display: flex;
  flex-direction: row;
  gap: 2.1em;
  width: 100%;
  align-items: flex-start;
}
.activity-list {
  width: 160px;
  margin-bottom: 0;
  margin-top: 0.7em;
}
.activity-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 1.12em;
  padding: 0.41em 0;
  border-bottom: 1px solid #f0f0f0;
  font-weight: 500;
}
.activity-row:last-child {
  border-bottom: none;
}
.activity-label {
  color: #444e69;
}
.activity-number {
  font-weight: 700;
  color: #e93c2f;
  font-size: 1.14em;
}
.calendar-section {
  margin-top: 0.7em;
  flex: 1 1 auto;
  min-width: 0;
  max-width: 370px;
  width: 100%;
  display: flex;
  align-items: flex-start;
}

/* Remove border on custom calendar */
:global(.no-border-calendar) {
  border: none !important;
  box-shadow: none !important;
}
:global(.no-border-calendar .calendar-container),
:global(.no-border-calendar .calendar) {
  border: none !important;
  box-shadow: none !important;
}

/* MODALS */
.modal-backdrop {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.modal-content {
  background: white;
  border-radius: 16px;
  padding: 2rem;
  max-width: 490px;
  width: 92%;
  box-shadow: 0 8px 28px rgba(0, 0, 0, 0.21);
  position: relative;
}

/* RESPONSIVE BREAKPOINTS */
@media (max-width: 1100px) {
  .stats-boxes-row {
    gap: 1em;
  }
  .progress-row {
    gap: 1em;
  }
  .outside-card, .activity-card, .card {
    padding: 1.5em 1em 1.5em 1em;
  }
}
@media (max-width: 900px) {
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
  .activity-2col {
    flex-direction: column;
    gap: 1em;
  }
  .activity-list {
    width: 100%;
    margin-bottom: 1em;
  }
  .calendar-section {
    max-width: 100%;
  }
}

/* MOBILE OPTIMIZATION */
@media (max-width: 600px) {
  .progress-layout {
    margin: 1.6em 0.6em 1.4em 0.6em; /* up from 1.1/0.2/0.7/0.2 */
    gap: 1.5em; /* was 1.2em */
    padding: 0;
  }
  .card, .outside-card, .activity-card {
    padding: 1.1em 0.6em 1.5em 0.6em; /* more padding all around */
    border-radius: 13px;
    box-shadow: 0 3px 16px 0 #e9eaee55;
    margin-bottom: 0.7em; /* a bit more space between cards */
  }
  .stats-heading-row {
    margin-bottom: 0.6em;
  }
  .card-heading {
    font-size: 1.04em;
  }
  .stat-inner-box {
    border-radius: 11px;
    padding: 1.5em 0.3em 1.4em 0.3em; /* more padding in stat cards */
  }
  .stat-number {
    font-size: 1.43em;
    margin-top: 0.38em;
    margin-bottom: 0.15em;
  }
  .stat-label {
    font-size: 1em;
    margin-top: 0.21em;
  }
  .stat-inner-box svg {
    width: 33px;
    height: 33px;
    margin-bottom: 0.23em;
  }
  .outside-box {
    border-radius: 10px;
    padding: 1.2em 0.5em 1.2em 0.5em;
  }
  .outside-number {
    font-size: 1.15em;
    margin-top: 0.32em;
    margin-bottom: 0.11em;
  }
  .outside-label {
    font-size: 0.99em;
  }
  .calendar-section {
    margin-top: 0.35em;
    max-width: 100%;
  }
  .activity-list {
    margin-bottom: 0.38em;
    margin-top: 0.32em;
  }
}


/* TOOLTIP */
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
</style>
