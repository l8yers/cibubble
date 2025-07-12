<script>
	import { onMount, onDestroy } from 'svelte';
	import { user, authChecked } from '$lib/stores/user.js';
	import {
		progressData,
		fetchProgressData,
		updateUserEmail,
		updateUserPassword,
		deleteManualEntry,
		updateManualEntry
	} from '$lib/stores/progress.js';
	import ProgressManualEntry from '$lib/components/progress/ProgressManualEntry.svelte';
	import MonthlyCalendar from '$lib/components/progress/MonthlyCalendar.svelte';
	import ManualEntryList from '$lib/components/progress/ManualEntryList.svelte';
	import ManualEntryEditForm from '$lib/components/progress/ManualEntryEditForm.svelte';
	import { Timer, Award, ExternalLink, Plus, List, History, AlignRight } from 'lucide-svelte';
	import { writable } from 'svelte/store';
	import {
		formatWatchTime,
		formatFullTime,
		formatMinutesOnly,
		formatHours
	} from '$lib/utils/time.js';
	import BubbleSpinner from '$lib/components/ui/BubbleSpinner.svelte';
	import { useScrollLock } from '$lib/utils/useScrollLock.js';

	const SENTINEL_DATE = '1975-01-01';

	let showSettings = false;
	let showManualModal = false;
	let showManualTab = false;
	let editEntry = null;

	let showTotalTooltip = false;
	let showOutsideTooltip = false;

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

	// --- Watched on CIBUBBLE (in seconds)
	$: watchedSeconds = (p.dailyTotals || []).reduce((sum, d) => sum + (d.totalSeconds || 0), 0);

	// === Format as "X hrs Y mins", no seconds
	function formatHoursMins(totalSeconds) {
		const h = Math.floor(totalSeconds / 3600);
		const m = Math.floor((totalSeconds % 3600) / 60);
		const parts = [];
		if (h) parts.push(`${h} hr${h === 1 ? '' : 's'}`);
		if (m || !h) parts.push(`${m} min${m === 1 ? '' : 's'}`);
		return parts.join(' ');
	}

	// === CALENDAR VIEW LOGIC ===
	let calendarViewType = 'total';
	let calendarMenuOpen = false;
	function openCalendarMenu(e) {
		e.stopPropagation();
		calendarMenuOpen = !calendarMenuOpen;
	}
	function selectCalendarView(key) {
		calendarViewType = key;
		calendarMenuOpen = false;
	}
	$: calendarDropdownOptions = [
		{ key: 'watched', label: 'CIBUBBLE time only' },
		{ key: 'manual', label: 'Outside time only' },
		{ key: 'total', label: 'Total input time' }
	].filter(v => v.key !== calendarViewType);

	// Only run in browser
	let clickListener;
	onMount(() => {
		clickListener = () => { calendarMenuOpen = false; };
		if (typeof window !== "undefined") {
			window.addEventListener('click', clickListener);
		}
	});
	onDestroy(() => {
		if (typeof window !== "undefined") {
			window.removeEventListener('click', clickListener);
		}
	});

	// === SCROLL LOCK LOGIC (CLEAN) ===
	let modalOpen = false;
	let cleanupScrollLock;
	$: modalOpen = showManualModal || showManualTab || showSettings;
	$: {
		if (cleanupScrollLock) cleanupScrollLock();
		cleanupScrollLock = useScrollLock(modalOpen);
	}
	onDestroy(() => {
		if (cleanupScrollLock) cleanupScrollLock();
	});
</script>

{#if !$authChecked}
	<div class="bubble-spinner-overlay">
		<BubbleSpinner />
	</div>
{:else if !$user}
	<div class="profile-main" style="text-align:center;">
		<div style="margin:2em 0;">
			Not logged in.<br /><a href="/login" class="video-link">Login here</a>
		</div>
	</div>
{:else}
	<!-- MAIN LAYOUT -->
	<div class="progress-layout">
		<div class="progress-row">
			<!-- Statistics Card -->
			<div class="card stats-card">
				<div class="card-heading">Statistics</div>
				<div class="stats-list">
					<div class="stat-item stat-time">
						<div class="stat-icon-col">
							<Timer class="stat-icon" size={30} />
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
										<span class="custom-tooltip stat-time-tooltip">
											{formatHoursMins(p.watchTime)}
										</span>
									{/if}
								</span>
							</div>
							<div class="stat-label">Total input</div>
						</div>
					</div>
					<!-- "Watched today" stat-item REMOVED HERE -->
					<div class="stat-item stat-practiced">
						<div class="stat-icon-col">
							<Award class="stat-icon" size={30} />
						</div>
						<div class="stat-main">
							<div class="stat-value">{p.daysPracticed}</div>
							<div class="stat-label">Days practiced</div>
						</div>
					</div>
					<div class="stat-item stat-outside">
						<div class="stat-icon-col">
							<ExternalLink class="stat-icon" size={30} />
						</div>
						<div class="stat-main">
							<div
								class="stat-value tooltip-parent"
								tabindex="0"
								on:mouseenter={() => (showOutsideTooltip = true)}
								on:mouseleave={() => (showOutsideTooltip = false)}
								on:focus={() => (showOutsideTooltip = true)}
								on:blur={() => (showOutsideTooltip = false)}
							>
								{formatHours(p.outsideTime)}
								{#if showOutsideTooltip}
									<span class="custom-tooltip stat-outside-tooltip">
										Watched on CIBUBBLE:<br />
										<b>{formatHoursMins(watchedSeconds)}</b>
									</span>
								{/if}
							</div>
							<div class="stat-label">From other sources</div>
						</div>
					</div>
				</div>
			</div>

			<!-- Activity Card -->
			<div class="card activity-card">
				<div class="activity-heading-row">
					<div class="card-heading activity-heading">Your Activity</div>
					<button
						class="calendar-view-menu-btn"
						aria-label="Calendar view options"
						on:click|stopPropagation={openCalendarMenu}
					>
						<AlignRight size={22} />
					</button>
					{#if calendarMenuOpen}
						<div class="calendar-view-menu">
							{#each calendarDropdownOptions as v}
								<button class="calendar-view-menu-item" on:click={() => selectCalendarView(v.key)}>
									Show {v.label}
								</button>
							{/each}
						</div>
					{/if}
				</div>
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
							viewType={calendarViewType}
							class="no-border-calendar compact-calendar"
						/>
					</div>
				</div>
			</div>

			<!-- Manual Input & History Card -->
			<div class="card manual-input-card">
				<div class="card-heading">Manual Input &amp; History</div>
				<div class="manual-links-row">
					<a class="outside-link" href="#" on:click|preventDefault={() => (showManualModal = true)}>
						<Plus size={18} style="vertical-align: middle; margin-right: 0.35em;" /> Add time from other
						sources
					</a>
					<a class="outside-link" href="#" on:click|preventDefault={() => (showManualTab = true)}>
						<List size={18} style="vertical-align: middle; margin-right: 0.35em;" /> View time from other
						sources
					</a>
					<a class="outside-link" href="/history">
						<History size={18} style="vertical-align: middle; margin-right: 0.35em;" /> View watched
						videos
					</a>
				</div>
			</div>
		</div>
	</div>
{/if}

<!-- ============================= -->
<!--   PLACE MODALS AT ROOT LEVEL  -->
<!-- ============================= -->

{#if showManualModal}
	<div class="modal-backdrop" on:click={() => (showManualModal = false)}>
		<div class="modal-content" on:click|stopPropagation>
			<ProgressManualEntry onCancel={() => (showManualModal = false)} />
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
					manualEntries={p.manualTotals || []}
					formatMinutesOnly={formatWatchTime}
					{SENTINEL_DATE}
					on:cancel={() => {
						showManualTab = false;
						editEntry = null;
					}}
					on:edit={(e) => (editEntry = e.detail)}
					on:delete={(e) => deleteManualEntry(e.detail, $user)}
				/>
			{:else}
				<ManualEntryEditForm
					entry={editEntry}
					on:submit={(e) => {
						updateManualEntry(e.detail, $user);
						editEntry = null;
					}}
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
				{newEmail}
				setNewEmail={(v) => (newEmail = v)}
				{newPassword}
				setNewPassword={(v) => (newPassword = v)}
				message={p.message}
				updateEmail={handleEmailUpdate}
				updatePassword={handlePasswordUpdate}
				back={() => (showSettings = false)}
			/>
		</div>
	</div>
{/if}

<style>
	/* ========== MODAL CSS ========== */
	.modal-backdrop {
		position: fixed;
		inset: 0;
		z-index: 99999;
		background: rgba(24, 24, 30, 0.47);
		display: flex;
		align-items: center;
		justify-content: center;
	}
	.modal-content {
		background: #fff;
		color: #101720;
		border-radius: 16px;
		padding: 2em 2em 1.4em 2em;
		box-shadow: 0 4px 32px #0003;
		min-width: 240px;
		max-width: 95vw;
		max-height: 90vh;
		overflow-y: auto;
		position: relative;
	}
	/* =============================== */

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
		grid-row: 1;
		grid-column: 1;
	}
	.activity-card {
		grid-row: 1;
		grid-column: 2;
	}
	.manual-input-card {
		min-width: 240px;
		max-width: 430px;
		grid-row: 2;
		grid-column: 1;
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
		font-size: 1.1em;
		box-shadow: 0 2px 10px 0 #e9eaee10;
		border: 1.1px solid #ededf2;
		margin-bottom: 0;
		background: #fff;
		transition: box-shadow 0.17s;
	}
	/* === NEW MUTED PASTEL SCHEME === */
	.stat-time {        /* Total input */
		background: #ffd4cf;   /* soft coral */
		border-color: #ffd4cf;
	}
	.stat-today {       /* Today’s input */
		background: #d9f5e6;   /* mint */
		border-color: #d9f5e6;
	}
	.stat-practiced {   /* Days practiced */
		background: #fff4c9;   /* honey */
		border-color: #fff4c9;
	}
	.stat-outside {     /* From other sources */
		background: #ddebff;   /* sky */
		border-color: #ddebff;
	}
	/* === ICON & TEXT COLORS RESET === */
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
		color: #101720;   /* back to black */
	}
	.stat-item .stat-main {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		justify-content: center;
	}
	.stat-value {
		font-size: 1.35em;
		font-weight: 600;
		margin-bottom: 0.07em;
		line-height: 1.09;
		color: #101720;   /* back to black */
	}
	.stat-label {
		font-size: 0.93em;
		font-weight: 600;
		margin-bottom: 0.08em;
		margin-top: 0.1em;
		color: #101720;   /* back to black */
	}
	/* Manual links styling */
	.manual-links-row {
		display: flex;
		flex-direction: column;
		align-items: stretch;
		gap: 0.5em;
		margin-top: 0.6em;
	}
	.outside-link {
		color: #e93c2f;
		font-weight: 500;
		font-size: 1em;
		text-decoration: none;
		background: none;
		border: none;
		cursor: pointer;
		padding: 0.09em 0.08em;
		border-radius: 4px;
		transition:
			color 0.15s,
			background 0.13s;
		display: flex;
		align-items: center;
		white-space: nowrap;
	}
	.outside-link:hover,
	.outside-link:focus {
		outline: none;
	}
	.card-heading {
		font-size: 1.18em;
		font-weight: 600;
		color: #101720;
		letter-spacing: 0.03em;
		margin-bottom: 0.9em;
		text-align: left;
		text-transform: none;
		line-height: 1.16;
	}
	.activity-heading-row {
		display: flex;
		align-items: center;
		width: 100%;
		justify-content: space-between;
		margin-bottom: 1em;
		position: relative;
	}
	.calendar-view-menu-btn {
		background: none;
		border: none;
		cursor: pointer;
		padding: 0.1em 0.2em;
		border-radius: 50%;
		outline: none;
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: none;
		margin-left: 0.8em;
		color: #101720;
	}
	.calendar-view-menu-btn:hover,
	.calendar-view-menu-btn:focus {
		background: none;
	}
	.calendar-view-menu {
		position: absolute;
		top: 2.3em;
		right: 0;
		min-width: 145px;
		background: #fff;
		border-radius: 9px;
		box-shadow: 0 3px 18px 0 #2221;
		padding: 0.39em 0.2em 0.39em 0.2em;
		display: flex;
		flex-direction: column;
		z-index: 200;
		border: 1px solid #e9e9e9;
		animation: dropdownIn 0.17s cubic-bezier(0.31, 1.41, 0.42, 1);
	}
	@keyframes dropdownIn {
		from {
			opacity: 0;
			transform: translateY(6px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
	.calendar-view-menu-item {
		background: none;
		border: none;
		color: #101720;
		font-size: 1em;
		font-weight: 500;
		padding: 0.5em 1em 0.5em 0.8em;
		border-radius: 5px;
		cursor: pointer;
		text-align: left;
		transition: none;
		white-space: nowrap;
	}
	.calendar-view-menu-item:hover,
	.calendar-view-menu-item:focus {
		background: none;
		color: #101720;
	}
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
	/* Mini-stats with subtle neutral background */
	.mini-stat-card {
		background: #f6f7f9;
		border: 1.2px solid #e2e6ea;
		border-radius: 13px;
		padding: 0.88em 1em 0.78em 1em;
		display: flex;
		flex-direction: column;
		align-items: center;
		box-sizing: border-box;
	}
	.mini-stat-number {
		font-size: 1.18em;
		font-weight: 600;
		color: #101720;
		text-align: center;
		letter-spacing: 0.02em;
		margin-bottom: 0.33em;
		margin-top: 0;
	}
	.mini-stat-label {
		font-size: 0.92em;
		font-weight: 600;
		color: #101720;
		text-align: center;
		letter-spacing: 0.01em;
	}
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
	.tooltip-parent {
		position: relative;
		cursor: pointer;
		display: inline-block;
	}
	.custom-tooltip {
		position: absolute;
		left: 50%;
		top: 112%;
		transform: translateX(-50%);
		z-index: 20;
		background: rgba(30, 30, 30, 0.92);
		color: #fff;
		font-size: 0.86em;
		font-weight: 500;
		padding: 0.22em 0.7em;
		border-radius: 6px;
		box-shadow: 0 2px 10px 0 #0001;
		white-space: nowrap;
		pointer-events: none;
		opacity: 0.96;
		transition: opacity 0.13s;
	}
	/* Tooltips pick stronger shades of the new palette */
	.stat-time-tooltip {
		background: #ff8d82;
	}
	.stat-today-tooltip {
		background: #4ecb8f;
	}
	.stat-practiced-tooltip {
		background: #ffd24d;
	}
	.stat-outside-tooltip {
		background: #6daaff;
	}
	@media (max-width: 900px) {
		.progress-row {
			display: flex;
			flex-direction: column;
			gap: 0.5em;
		}
		.stats-card { order: 1; }
		.activity-card { order: 2; }
		.manual-input-card { order: 3; }
		.activity-2col {
			flex-direction: column;
			gap: 1em;
		}
		.activity-stats-cards {
			display: flex;
			flex-direction: row;
			gap: 0.5em;
			width: 100% !important;
			min-width: 0 !important;
			max-width: 100% !important;
			margin: 0 0 1em 0;
			justify-content: stretch;
		}
		.mini-stat-card {
			flex: 1 1 0 !important;
			width: 100% !important;
			min-width: 0 !important;
			max-width: 100% !important;
			box-sizing: border-box;
		}
		.mini-stat-number { font-size: 1.08em; }
		.mini-stat-label  { font-size: 0.91em; }
		.calendar-section { max-width: 100%; }
		.stats-list { gap: 0.7em; }
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
		.stat-value { font-size: 1.13em; }
	}
	@media (max-width: 600px) {
		.progress-layout {
			margin: 0.6em 0.6em 1.4em 0.6em;
			gap: 1.5em;
			padding: 0;
		}
		.card,
		.stats-card,
		.manual-input-card,
		.activity-card {
			padding: 1.1em 0.6em 1.5em 0.6em;
			border-radius: 13px;
			box-shadow: 0 3px 16px 0 #e9eaee55;
			margin-bottom: 0.5em;
		}
		.card-heading { font-size: 1.04em; }
		.manual-links-row { gap: 0.5em; }
		.activity-stats-cards { gap: 0.4em; }
		.mini-stat-card { padding: 0.38em 0.07em 0.38em 0.07em; }
	}
</style>
