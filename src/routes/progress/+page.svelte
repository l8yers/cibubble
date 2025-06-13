<script>
	import { onMount } from 'svelte';
	import { supabase } from '$lib/supabaseClient';
	import VideoCard from '$lib/components/VideoCard.svelte';
	import * as utils from '$lib/utils.js';

	let user = null;
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

	function formatMinutes(seconds) {
		if (!seconds) return '0 min';
		const m = Math.round(seconds / 60);
		return m > 0 ? `${m} min` : `${seconds} sec`;
	}

	function barColor(mins) {
		if (mins >= 120) return '#e93c2f';
		if (mins >= 60) return '#44c366';
		if (mins >= 30) return '#f9c846';
		if (mins >= 10) return '#f7ed85';
		if (mins > 0) return '#b7f6ed';
		return '#ececec';
	}

	async function fetchRecentActivity() {
		if (!user) return;
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
			.eq('user_id', user.id)
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

	onMount(async () => {
		const {
			data: { session }
		} = await supabase.auth.getSession();
		if (session?.user) {
			user = session.user;
			email = user.email;
			newEmail = email;

			// Fetch user's videos
			let { data: videos } = await supabase
				.from('videos')
				.select('*')
				.eq('added_by', user.id)
				.order('created', { ascending: false });
			myVideos = videos || [];

			// --- Total watch time ---
			let { data: allSessions } = await supabase
				.from('watch_sessions')
				.select('seconds')
				.eq('user_id', user.id);
			watchTime = (allSessions ?? []).reduce((acc, s) => acc + (s.seconds || 0), 0);

			// --- Today's watch time ---
			const today = new Date().toISOString().slice(0, 10);
			let { data: todaySessions } = await supabase
				.from('watch_sessions')
				.select('seconds')
				.eq('user_id', user.id)
				.eq('date', today);
			todayWatchTime = (todaySessions ?? []).reduce((acc, s) => acc + (s.seconds || 0), 0);

			// --- Recent activity and streak ---
			await fetchRecentActivity();

			// --- Fetch watched videos ---
			let { data: watchedSessions } = await supabase
				.from('watch_sessions')
				.select('video_id, date')
				.eq('user_id', user.id);

			const videoMap = {};
			for (const ws of watchedSessions ?? []) {
				if (ws.video_id && ws.date) {
					if (!videoMap[ws.video_id] || ws.date > videoMap[ws.video_id]) {
						videoMap[ws.video_id] = ws.date;
					}
				}
			}
			const videoIds = Object.keys(videoMap);

			if (videoIds.length) {
				let { data: vids } = await supabase.from('videos').select('*').in('id', videoIds);

				watchedVideos = (vids || [])
					.map((v) => ({
						...v,
						lastWatched: videoMap[v.id]
					}))
					.sort((a, b) => (b.lastWatched || '').localeCompare(a.lastWatched || ''));
			} else {
				watchedVideos = [];
			}
		}
	});

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
</script>

{#if !user}
	<div class="profile-main" style="text-align:center;">
		<div style="margin:2em 0;">
			Not logged in.<br /><a href="/login" class="video-link">Login here</a>
		</div>
	</div>
{:else}
	<div class="profile-main">
		<div class="section-title">Progress</div>

		<!-- CHUNKY DREAMING SPANISH STATS BOXES -->
		<div class="stats-boxes-row">
			<div class="stat-box">
				<div class="stat-label">Total Watch Time</div>
				<div class="stat-value">{formatMinutes(watchTime)}</div>
			</div>
			<div class="stat-box">
				<div class="stat-label">Today's Watch Time</div>
				<div class="stat-value">{formatMinutes(todayWatchTime)}</div>
			</div>
			<div class="stat-box">
				<div class="stat-label">Streak</div>
				<div class="stat-value">
					<span style="font-size:2em;">🔥</span>
					{streak} day{streak === 1 ? '' : 's'}
				</div>
			</div>
		</div>

		<!-- HISTORY SECTION styled like front page grid -->
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

		<div class="my-videos-section">
			<div class="my-videos-header">
				<span class="section-title" style="margin:0;">My Videos</span>
				<a href="/my-videos" class="view-all-link">View all</a>
			</div>
			{#if myVideos.length === 0}
				<div>You haven’t added any videos yet.</div>
			{:else}
				<div class="history-row">
					{#each myVideos.slice(0, 15) as v}
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
		<!-- MY VIDEOS SECTION styled like front page grid -->

		<div class="section-title">Account</div>
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

<style>
	.profile-main {
		max-width: 1200px;
		margin: 2.2rem auto 0 auto;
		padding: 2rem 3vw 2.3rem 3vw;
		background: #fff;
		border-radius: 14px;
		border: 1px solid #ececec;
		box-shadow: 0 2px 12px #ececec;
	}
	.section-title {
		color: #181818;
		font-size: 1.25rem;
		font-weight: bold;
		margin: 1.7em 0 1em 0;
		letter-spacing: 0.3px;
	}
	/* Chunkier stats boxes */
	.stats-boxes-row {
		display: flex;
		gap: 2.6em;
		margin: 2.4em 0 2.5em 0;
		flex-wrap: wrap;
		align-items: stretch;
	}
	.stat-box {
		background: #fafafa;
		border-radius: 18px;
		box-shadow: 0 2px 18px #ececec;
		padding: 2em 3em 2em 3em;
		min-width: 200px;
		min-height: 108px;
		flex: 1 1 210px;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		margin-bottom: 0.8em;
	}
	.stat-label {
		color: #aaa;
		font-size: 1.19em;
		font-weight: 600;
		letter-spacing: 0.07em;
		margin-bottom: 0.6em;
	}
	.stat-value {
		font-size: 2.2em;
		color: #222;
		font-weight: 800;
		letter-spacing: 0.02em;
		display: flex;
		align-items: center;
		gap: 0.3em;
	}
	.calendar-box {
		min-width: 270px;
		padding: 1.5em 1.6em 1.2em 1.6em;
		justify-content: start;
		align-items: stretch;
	}
	.mini-calendar {
		display: flex;
		gap: 5px;
		margin-bottom: 0.32em;
		margin-top: 0.5em;
		min-height: 19px;
		justify-content: center;
	}
	.calendar-day {
		width: 18px;
		height: 28px;
		border-radius: 7px;
		background: #ececec;
		outline: none;
		box-shadow: 0 0 0 1px #e6e6e6;
		transition: background 0.16s;
	}
	.calendar-today {
		outline: 2.5px solid #2562e9;
	}
	.calendar-labels {
		display: flex;
		gap: 5px;
		font-size: 0.97em;
		color: #bbb;
		justify-content: center;
	}
	.calendar-labels > div {
		width: 18px;
		text-align: center;
	}
	@media (max-width: 960px) {
		.stats-boxes-row {
			flex-direction: column;
			gap: 1.8em;
		}
		.stat-box {
			min-width: unset;
			width: 100%;
		}
		.calendar-box {
			min-width: unset;
		}
	}

	/* History/my videos grid: match front page grid */
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
		flex: 0 0 265px; /* Adjust width for card size */
		scroll-snap-align: start;
		min-width: 265px;
		max-width: 320px;
	}
	.my-videos-section {
  margin-top: 2.6em;
}
.my-videos-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.2em;
}

	@media (max-width: 600px) {
		.history-card {
			flex-basis: 82vw;
			min-width: 82vw;
			max-width: 90vw;
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
