<script>
	import { onMount } from 'svelte';
	import { supabase } from '$lib/supabaseClient';

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

		<!-- Stats and graph at the top -->
		<div class="stats-row"><b>Total watch time:</b> {formatMinutes(watchTime)}</div>
		<div class="stats-row"><b>Today's watch time:</b> {formatMinutes(todayWatchTime)}</div>
		<div class="streak-row">
			🔥 <b>Streak:</b>
			{streak} day{streak === 1 ? '' : 's'} active
		</div>

		<div style="font-size:0.98em; color:#888; margin-bottom:0.2em;">
			Minutes watched per day (last 14 days)
		</div>
		<div class="activity-bar-graph">
			{#each activityDays as d, i}
				<div
					class="activity-bar {i === activityDays.length - 1 ? 'activity-bar-today' : ''}"
					style="height:{Math.min(d.mins, 120) / 1.2}px; background:{barColor(d.mins)}"
					title={`Date: ${d.date}\n${d.mins} min`}
				></div>
			{/each}
		</div>
		<div class="activity-labels">
			{#each activityDays as d, i}
				<div style="width:24px; text-align:center">
					{i % 2 === 0 ? d.date.slice(5) : ''}
				</div>
			{/each}
		</div>
		<div style="font-size:0.87em; color:#aaa; margin-top:0.2em;">Days (oldest &rarr; today)</div>

		<!-- HISTORY: Horizontal row, scrollable, front-page cards, no last watched, no length -->
		<div class="history-section">
			<div class="history-header">
				<span class="section-title" style="margin:0;">History</span>
				<a href="/history" class="view-all-link">View all</a>
			</div>
			{#if watchedVideos.length === 0}
				<div>No videos watched yet.</div>
			{:else}
				<div class="history-scroll-row">
					{#each watchedVideos.slice(0, 15) as v}
						<a href={`/video/${v.id}`} class="ci-card">
							<span class="ci-thumb-link">
								<img
									class="ci-thumb-img"
									src={v.thumbnail || '/no_thumb_nail.png'}
									alt="Video thumbnail"
								/>
							</span>
							<div class="ci-card-info">
								<span class="ci-badge {v.level}">{v.level}</span>
								<span class="ci-title" title={v.title}>{v.title}</span>
								<div class="ci-channel">{v.channel_name}</div>
							</div>
						</a>
					{/each}
				</div>
			{/if}
		</div>

		<!-- MY VIDEOS: Horizontal row, scrollable, matches History section -->
		<div class="history-section">
			<div class="history-header">
				<span class="section-title" style="margin:0;">My Videos</span>
				<a href="/my-videos" class="view-all-link">View all</a>
			</div>
			{#if myVideos.length === 0}
				<div>No videos added yet.</div>
			{:else}
				<div class="history-scroll-row">
					{#each myVideos.slice(0, 15) as v}
						<a href={`/video/${v.id}`} class="ci-card">
							<span class="ci-thumb-link">
								<img
									class="ci-thumb-img"
									src={v.thumbnail || '/no_thumb_nail.png'}
									alt="Video thumbnail"
								/>
							</span>
							<div class="ci-card-info">
								<span class="ci-badge {v.level}">{v.level}</span>
								<span class="ci-title" title={v.title}>{v.title}</span>
								<div class="ci-channel">{v.channel_name}</div>
							</div>
						</a>
					{/each}
				</div>
			{/if}
		</div>

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
	.stats-row {
		color: #222;
		font-size: 1.07em;
		margin-bottom: 0.7em;
	}
	.streak-row {
		font-size: 1em;
		color: #2562e9;
		margin-bottom: 0.7em;
		font-weight: 500;
	}
	.activity-bar-graph {
		display: flex;
		gap: 8px;
		align-items: end;
		margin: 1.1em 0 0.2em 0;
		height: 54px;
	}
	.activity-bar {
		width: 24px;
		border-radius: 5px 5px 2px 2px;
		background: #ececec;
		position: relative;
		transition:
			height 0.2s,
			background 0.2s;
		display: flex;
		align-items: flex-end;
		justify-content: center;
		cursor: pointer;
	}
	.activity-bar-today {
		outline: 2px solid #2562e9;
		box-shadow: 0 0 0 2px #e8e8fa;
	}
	.activity-labels {
		display: flex;
		gap: 8px;
		margin-top: 3px;
		font-size: 0.91em;
		color: #888;
		justify-content: start;
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

	/* ----------- HISTORY (watched videos row) ----------- */
	.history-section {
		margin-top: 2.2em;
	}
	.history-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1em;
	}
	.view-all-link {
		font-size: 1em;
		color: #2562e9;
		text-decoration: none;
		font-weight: 500;
	}
	.history-scroll-row {
		display: flex;
		flex-direction: row;
		gap: 24px;
		overflow-x: auto;
		padding-bottom: 2px;
		margin-bottom: 2em;
		scrollbar-width: thin;
	}
	.history-scroll-row::-webkit-scrollbar {
		height: 8px;
		background: #f3f3f3;
	}
	.history-scroll-row::-webkit-scrollbar-thumb {
		background: #dcdcdc;
		border-radius: 8px;
	}

	.ci-card {
		background: #fff;
		border-radius: 14px;
		box-shadow: 0 2px 10px #ececec;
		min-width: 196px;
		max-width: 196px;
		flex: 0 0 196px;
		display: flex;
		flex-direction: column;
		text-align: left;
		padding: 0;
		cursor: pointer;
		transition: box-shadow 0.18s;
		font-family: Inter, Arial, sans-serif;
	}
	.ci-card:hover {
		box-shadow: 0 6px 32px #e93c2f22;
	}

	.ci-thumb-link {
		display: block;
		border-radius: 14px 14px 0 0;
		overflow: hidden;
	}
	.ci-thumb-img {
		width: 100%;
		aspect-ratio: 16/9;
		object-fit: cover;
		background: #f3f3f3;
	}

	.ci-card-info {
		padding: 0.8em 1em 1.1em 1em;
	}
	.ci-title {
		font-weight: 600;
		font-size: 1.07em;
		margin: 0.24em 0 0.09em 0;
		color: #222;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.ci-badge {
		border-radius: 8px;
		padding: 0.1em 0.48em;
		font-size: 0.87em;
		font-weight: 500;
		color: #fff;
		background: #e93c2f;
		margin-bottom: 0.1em;
		text-transform: capitalize;
		display: inline-block;
		margin-right: 0.4em;
	}
	.ci-badge.Superbeginner {
		background: #2e9be6;
	}
	.ci-badge.Beginner {
		background: #44c366;
	}
	.ci-badge.Intermediate {
		background: #e93c2f;
	}
	.ci-badge.Advanced {
		background: #f9c846;
		color: #181818;
	}
	.ci-channel {
		font-size: 0.92em;
		color: #888;
		margin-top: 0.11em;
	}

	.card-history {
		background: #fff;
		border-radius: 15px;
		box-shadow: 0 2px 8px #ececec;
		min-width: 180px;
		max-width: 180px;
		flex: 0 0 180px;
		display: flex;
		flex-direction: column;
		align-items: stretch;
		text-align: left;
		transition: box-shadow 0.13s;
		cursor: pointer;
		padding: 0;
	}
	.card-history:hover {
		box-shadow: 0 6px 28px #e93c2f20;
	}
	.card-thumb-link {
		display: block;
		border-radius: 15px 15px 0 0;
		overflow: hidden;
	}
	.card-thumb-img {
		width: 100%;
		aspect-ratio: 16/9;
		object-fit: cover;
		background: #f3f3f3;
	}
	.card-info {
		padding: 0.67em 0.82em 1em 0.82em;
	}
	.card-title {
		font-weight: 600;
		font-size: 1em;
		margin: 0.22em 0 0.12em 0;
		color: #232323;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.card-badge {
		border-radius: 8px;
		padding: 0.11em 0.6em;
		font-size: 0.83em;
		font-weight: 500;
		color: #fff;
		background: #e93c2f;
		margin-right: 0.36em;
		text-transform: capitalize;
	}
	.card-badge.Superbeginner {
		background: #2e9be6;
	}
	.card-badge.Beginner {
		background: #44c366;
	}
	.card-badge.Intermediate {
		background: #e93c2f;
	}
	.card-badge.Advanced {
		background: #f9c846;
		color: #181818;
	}
	.card-channel {
		font-size: 0.91em;
		color: #868686;
	}
	@media (max-width: 600px) {
		.card-history,
		.history-scroll-row {
			min-width: 150px;
			max-width: 150px;
		}
		.card-thumb-img {
			aspect-ratio: 16/9;
		}
	}
</style>
