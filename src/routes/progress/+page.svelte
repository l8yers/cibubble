<script>
	import { onMount } from 'svelte';
	import { user, loadUser } from '$lib/stores/user.js';
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
		if (!seconds) return "0 hrs";
		return Math.round(seconds / 3600) + " hrs";
	}

	function openManualModal() { showManualModal = true; }
	function closeManualModal() { showManualModal = false; }

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
			.select('id, date, seconds, source, video_id') // <-- Fetch id!
			.eq('user_id', userId);

		if (error) {
			dailyTotals = [];
			manualTotals = [];
			outsideTime = 0;
		} else {
			// --- dailyTotals: only sessions WITH video_id ---
			const dailyMap = {};
			(allSessionsForDaily ?? []).forEach(({ date, seconds, video_id }) => {
				if (!date || !video_id) return;
				dailyMap[date] = (dailyMap[date] || 0) + (seconds || 0);
			});
			dailyTotals = Object.entries(dailyMap)
				.map(([date, totalSeconds]) => ({ date, totalSeconds }))
				.sort((a, b) => b.date.localeCompare(a.date));
			
			// --- manualTotals: one entry per row, only sessions WITHOUT video_id, include id! ---
			manualTotals = (allSessionsForDaily ?? [])
				.filter(({ video_id }) => !video_id)
				.map(({ id, date, seconds, source }) => ({
					id,
					date,
					totalSeconds: seconds || 0,
					source: source || ""
				}))
				.sort((a, b) => b.date.localeCompare(a.date));

			// Calculate outsideTime
			outsideTime = manualTotals.reduce((acc, m) => acc + (m.totalSeconds || 0), 0);
		}

		daysPracticed = dailyTotals.filter(dt => dt.totalSeconds > 0).length;

		// Calculate days this month
		const now = new Date();
		const month = now.getMonth();
		const year = now.getFullYear();
		daysThisMonth = dailyTotals.filter(dt => {
			const d = new Date(dt.date);
			return d.getFullYear() === year && d.getMonth() === month && dt.totalSeconds > 0;
		}).length;

		// Calculate weeks in a row (basic version)
		let weekSet = new Set();
		dailyTotals.forEach(dt => {
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
	<!-- MODALS (unchanged) -->
	{#if showManualModal}
		<div class="modal-backdrop" on:click={closeManualModal}>
			<div class="modal-content" on:click|stopPropagation>
				<button class="close-button" on:click={closeManualModal} aria-label="Close modal">×</button>
				<ProgressManualEntry
					onAdded={() => {
						fetchAllUserData($user.id);
						closeManualModal();
					}}
				/>
			</div>
		</div>
	{/if}
	{#if showManualTab}
		<div class="modal-backdrop" on:click={() => (showManualTab = false)}>
			<div class="modal-content" on:click|stopPropagation>
				<button
					class="close-button"
					on:click={() => (showManualTab = false)}
					aria-label="Close modal">×</button
				>
				<ManualEntryList
					manualEntries={manualTotals}
					formatMinutesOnly={formatWatchTime}
					{SENTINEL_DATE}
					on:back={() => (showManualTab = false)}
					on:edit={(e) => (editEntry = e.detail)}
					on:delete={deleteManualEntry}
				/>
				{#if editEntry}
					<div class="modal-backdrop" on:click={() => (editEntry = null)}>
						<div class="modal-content" on:click|stopPropagation>
							<button
								class="close-button"
								on:click={() => (editEntry = null)}
								aria-label="Close modal">×</button
							>
							<ManualEntryEditForm
								entry={editEntry}
								{SENTINEL_DATE}
								on:submit={updateManualEntry}
								on:cancel={() => (editEntry = null)}
							/>
						</div>
					</div>
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
	/* ---- LAYOUT ---- */
	.progress-layout {
		max-width: 1150px;
		margin: 2.5em auto 1.6em auto;
		display: flex;
		flex-direction: column;
		gap: 2.2em;
	}
	.card {
		background: #fff;
		border-radius: 18px;
		box-shadow: 0 4px 24px 0 #ededed55;
		padding: 2em 2em 2.1em 2em;
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		margin-bottom: 0;
		position: relative;
		min-width: 0;
		box-sizing: border-box;
	}
	.card-heading {
		font-size: 1.13em;
		font-weight: 800;
		color: #181d27;
		letter-spacing: 0.02em;
		margin-bottom: 0.75em; /* STANDARDIZED WHITESPACE */
		text-align: left;
		text-transform: none;
		line-height: 1.15;
	}
	.stats-heading-row {
		display: flex;
		width: 100%;
		margin-bottom: 1em;
		align-items: center;
		justify-content: space-between;
	}
	.settings-link {
		background: none;
		border: none;
		color: #aaa;
		cursor: pointer;
		transition: color 0.18s;
		display: flex;
		align-items: center;
		margin-left: 0.9em;
		padding: 0.13em 0.2em;
		border-radius: 8px;
		font-size: 1em;
	}
	.settings-link:hover,
	.settings-link:focus {
		color: #e93c2f;
		background: #fff6f6;
		outline: none;
	}
	.stats-boxes-row {
		display: flex;
		gap: 1.3em;
		flex-wrap: wrap;
		align-items: stretch;
		justify-content: flex-start;
		width: 100%;
		margin: 0;
	}
	.stat-box {
		flex: 1 1 220px;
		min-width: 200px;
		max-width: 340px;
		background: #fff;
		border-radius: 13px;
		box-shadow: 0 1px 10px #ededed55;
		display: flex;
		flex-direction: column;
		align-items: stretch;
		justify-content: flex-start;
		padding: 0;
		margin-bottom: 0;
		position: relative;
	}
	.stat-inner-box {
		background: linear-gradient(120deg, #f7f8fc 70%, #f5faff 100%);
		border-radius: 13px;
		width: 100%;
		padding: 0.7em 0.5em 1.1em 0.5em; /* MATCHED TO OUTSIDE BOX */
		text-align: center;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
	}
	.stat-time .stat-inner-box {
		background: linear-gradient(120deg, #ffeaea 70%, #fff6f0 100%);
	}
	.stat-today .stat-inner-box {
		background: linear-gradient(120deg, #eaffe9 70%, #f5fff5 100%);
	}
	.stat-practiced .stat-inner-box {
		background: linear-gradient(120deg, #fff6e4 70%, #fef9f1 100%);
	}
	.stat-number,
	.stat-label,
	.custom-tooltip {
		font-family: inherit;
		font-weight: 900;
	}
	.stat-time-color {
		color: #e93c2f;
	}
	.stat-today-color {
		color: #31b361;
	}
	.stat-practiced-color {
		color: #f4a000;
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
	.stat-time-tooltip {
		background: #e93c2f;
	}
	.stat-today-tooltip {
		background: #31b361;
	}
	.stat-practiced-tooltip {
		background: #f4a000;
	}
	.stat-number {
		font-size: 2.2em;
		letter-spacing: 0.01em;
		margin-bottom: 0.14em;
		font-weight: 900;
		text-align: center;
	}
	.stat-label {
		font-size: 1.03em;
		font-weight: 700;
		letter-spacing: 0.12em;
		text-transform: none;
		margin-top: 0.2em;
		text-align: center;
	}

	/* OUTSIDE HOURS & ACTIVITY ROW FLEX RATIOS */
	.progress-row {
		display: flex;
		gap: 1.3em;
		width: 100%;
		justify-content: stretch;
	}
	.outside-card {
		flex: 1 1 0%;
		min-width: 220px;
		max-width: 400px;
	}
	.activity-card {
		flex: 2 1 0%;
		min-width: 320px;
		max-width: 100%;
	}

	/* OUTSIDE HOURS */
	.outside-box {
		background: #e7f5fb;
		border-radius: 13px;
		width: 100%;
		padding: 0.7em 0.5em 1.1em 0.5em; /* MATCHED TO .stat-inner-box */
		text-align: center;
		margin-top: 1.1em;
		margin-bottom: 0.3em;
		display: flex;
		flex-direction: column;
		align-items: center;
		position: relative;
	}
	.outside-number {
		font-size: 2em;
		font-weight: 800;
		color: #31b0e9;
		margin-bottom: 0.14em;
	}
	.outside-label {
		font-size: 1.08em;
		margin-top: 0.2em;
		letter-spacing: 0.09em;
		margin-bottom: 0.7em;
		font-weight: 700;
		text-transform: uppercase;
		display: flex;
		align-items: center;
		gap: 0.18em;
		justify-content: center;
	}
	.outside-label-lower {
		text-transform: none;
		color: #31b0e9;
		font-size: 1.08em;
		font-weight: 700;
		letter-spacing: 0.09em;
	}
	.outside-links-row {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 0.28em;
		margin-top: 0.7em;
		margin-left: 0.15em;
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
		transition:
			color 0.15s,
			background 0.13s;
		display: block;
	}
	.outside-link:hover,
	.outside-link:focus {
		color: #fd6c6c;
		background: #fff3f1;
		outline: none;
	}

	/* ACTIVITY CARD: TWO COLUMNS, ALIGNED TOP */
	.activity-2col {
		display: flex;
		flex-direction: row;
		gap: 2.4em;
		width: 100%;
		align-items: flex-start;
	}
	.activity-list {
		width: 170px;
		margin-bottom: 0;
		margin-top: 0.7em;
	}
	.calendar-section {
		margin-top: 0.5em;
		flex: 1 1 auto;
		min-width: 0;
		max-width: 340px;
		width: 100%;
		display: flex;
		align-items: flex-start;
	}
	.align-top {
		align-items: flex-start;
	}
	.activity-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		font-size: 1.1em;
		padding: 0.42em 0;
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
		font-size: 1.13em;
	}

	/* Remove calendar border (override) */
	:global(.no-border-calendar) {
		border: none !important;
		box-shadow: none !important;
	}
	:global(.no-border-calendar .calendar-container),
	:global(.no-border-calendar .calendar) {
		border: none !important;
		box-shadow: none !important;
	}

	/* ---- MODAL STYLES ---- */
	.modal-backdrop {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.5);
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
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
		position: relative;
	}

	/* Responsive */
	@media (max-width: 1050px) {
		.stats-boxes-row,
		.progress-row {
			flex-direction: column;
			gap: 1em;
		}
		.stat-box,
		.outside-card,
		.activity-card {
			min-width: 0;
			width: 100%;
			max-width: none;
			border-radius: 13px;
			padding: 0;
		}
		.stat-inner-box,
		.outside-box {
			border-radius: 11px;
			padding: 0.7em 0.7em 1em 0.7em; /* keep top padding consistent on smaller screens */
		}
		.activity-2col {
			flex-direction: column;
			gap: 1em;
		}
		.activity-list {
			width: 100%;
			margin-bottom: 1.2em;
			margin-top: 0.7em;
		}
	}
	@media (max-width: 700px) {
		.card {
			padding: 1.3em 0.7em 1.3em 0.7em;
			border-radius: 10px;
		}
		.stat-box,
		.outside-card,
		.activity-card {
			border-radius: 10px;
			margin-bottom: 0.9em;
		}
		.stat-inner-box,
		.outside-box {
			border-radius: 7px;
			padding: 0.7em 0.5em 1em 0.5em;
		}
	}
	@keyframes fadeIn {
		from {
			opacity: 0;
			transform: translateX(-50%) translateY(8px);
		}
		to {
			opacity: 1;
			transform: translateX(-50%) translateY(0);
		}
	}
</style>
