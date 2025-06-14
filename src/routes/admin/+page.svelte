<script>
	import { supabase } from '$lib/supabaseClient';
	import { user } from '$lib/stores/user.js';
	import { get } from 'svelte/store';
	import TagManager from '$lib/components/TagManager.svelte';
	import { getTagsForChannel } from '$lib/api/tags.js';



	
	const countryOptions = [
		'Argentina','Canary Islands','Chile','Colombia','Costa Rica','Cuba','Dominican Republic','Ecuador','El Salvador','Equatorial Guinea','France','Guatemala','Italy','Latin America','Mexico','Panama','Paraguay','Peru','Puerto Rico','Spain','United States','Uruguay','Venezuela'
	];

	const levels = [
		{ value: '', label: 'Set Level' },
		{ value: 'easy', label: 'Easy' },
		{ value: 'intermediate', label: 'Intermediate' },
		{ value: 'advanced', label: 'Advanced' },
		{ value: 'notyet', label: 'Not Yet Rated' }
	];

	let url = '';
	let message = '';
	let importing = false;
	let clearing = false;
	let deleting = {};
	let channels = [];
	let refreshing = false;
	let showPlaylistsFor = null;
	let playlists = [];
	let playlistsLoading = false;
	let showTagsFor = null;
	let settingCountry = {};
	let settingLevel = {};
	let settingPlaylistLevel = {};

	let adminStats = {
		videos: 0,
		channels: 0,
		playlists: 0,
		runningTime: 0,
		byLevel: {
			easy: 0,
			intermediate: 0,
			advanced: 0,
			notyet: 0
		},
		timeByLevel: {
			easy: 0,
			intermediate: 0,
			advanced: 0,
			notyet: 0
		}
	};

	function formatTime(sec) {
		const h = Math.floor(sec / 3600);
		const m = Math.floor((sec % 3600) / 60);
		return `${h}h ${m}m`;
	}

	async function importChannel() {
		message = '';
		importing = true;
		try {
			const u = get(user);
			const res = await fetch('/api/add-video', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					url,
					added_by: u?.id || null // PATCH: use user id
				})
			});
			const json = await res.json();
			if (json.error) message = `❌ ${json.error}`;
			else
				message = `✅ Imported channel "${json.channel?.name}". ${json.playlists_count} playlists, ${json.videos_added} videos.`;
			await refresh();
		} catch (e) {
			message = '❌ Import failed.';
		}
		importing = false;
	}

	async function clearDatabase() {
		const confirmStr = prompt('Are you sure? Type DELETE to confirm clearing ALL data.');
		if (confirmStr !== 'DELETE') return;
		clearing = true;
		message = '';
		await supabase.from('videos').delete().neq('id', '');
		await supabase.from('playlists').delete().neq('id', '');
		await supabase.from('channels').delete().neq('id', '');
		await refresh();
		message = '✅ Database cleared.';
		clearing = false;
	}

	async function deleteChannel(id) {
		if (!confirm('Delete this channel and ALL its videos/playlists?')) return;
		deleting[id] = true;
		await supabase.from('videos').delete().eq('channel_id', id);
		await supabase.from('playlists').delete().eq('channel_id', id);
		await supabase.from('channels').delete().eq('id', id);
		await refresh();
		deleting[id] = false;
	}

	async function setChannelLevel(channelId, level) {
		if (!level) return;
		settingLevel[channelId] = true;
		await supabase.from('videos').update({ level }).eq('channel_id', channelId);
		message = `✅ All videos for this channel set to "${levels.find((l) => l.value === level)?.label}"`;
		await refresh();
		settingLevel[channelId] = false;
	}

	async function togglePlaylistsFor(channelId) {
		if (showPlaylistsFor === channelId) {
			showPlaylistsFor = null;
			playlists = [];
			return;
		}
		showPlaylistsFor = channelId;
		playlistsLoading = true;
		let { data, error } = await supabase.from('playlists').select('*').eq('channel_id', channelId);
		if (!error) {
			playlists = await Promise.all(
				(data || []).map(async (pl) => {
					const { data: vids } = await supabase.from('videos').select('level').eq('playlist_id', pl.id);
					let currentLevel = '';
					if (vids && vids.length > 0) {
						const levelsArr = vids.map((v) => v.level || '');
						const uniqueLevels = Array.from(new Set(levelsArr));
						currentLevel = uniqueLevels.length === 1 ? (uniqueLevels[0] || '') : 'mixed';
					}
					const { count: videos_count } = await supabase.from('videos').select('id', { count: 'exact', head: true }).eq('playlist_id', pl.id);
					return { ...pl, videos_count, _newLevel: '', currentLevel };
				})
			);
		} else {
			playlists = [];
		}
		playlistsLoading = false;
	}

	async function setPlaylistLevel(playlistId, level) {
		if (!level) return;
		settingPlaylistLevel[playlistId] = true;
		await supabase.from('videos').update({ level }).eq('playlist_id', playlistId);
		message = `✅ All videos for this playlist set to "${levels.find((l) => l.value === level)?.label}"`;
		playlists = playlists.map((pl) =>
			pl.id === playlistId ? { ...pl, currentLevel: level, _newLevel: '' } : pl
		);
		settingPlaylistLevel[playlistId] = false;
	}

	function toggleTagsFor(channelId) {
		if (showTagsFor === channelId) showTagsFor = null;
		else showTagsFor = channelId;
	}

	// PATCH: Update country in both channels and all related videos
	async function setChannelCountry(channelId, country) {
		settingCountry[channelId] = true;
		// Update channel
		await supabase.from('channels').update({ country }).eq('id', channelId);
		// Update all videos for this channel
		await supabase.from('videos').update({ country }).eq('channel_id', channelId);
		message = '✅ Country updated';
		await refresh();
		settingCountry[channelId] = false;
	}

	// Refactored refresh: get tags for each channel from normalized channel_tags
	async function refresh() {
		refreshing = true;
		let { data, error } = await supabase.from('channels').select('*');
		if (error) {
			message = error.message;
			refreshing = false;
			return;
		}
		channels = await Promise.all(
			(data || []).map(async (chan) => {
				const { data: vids } = await supabase.from('videos').select('level').eq('channel_id', chan.id);
				let _mainLevel = '';
				if (vids && vids.length > 0) {
					const levelsArr = vids.map((v) => v.level || '');
					const uniqueLevels = Array.from(new Set(levelsArr));
					_mainLevel = uniqueLevels.length === 1 ? (uniqueLevels[0] || '') : 'mixed';
				}
				// Get normalized tags
				const _tags = await getTagsForChannel(chan.id);

    console.log('Channel object:', chan, '_tags:', _tags);

				return {
					...chan,
					_country: chan.country || '',
					_tags, // normalized tags array for this channel
					_newLevel: '',
					_mainLevel
				};
			})
		);

		// --- Admin stats ---
		const { count: videosCount } = await supabase.from('videos').select('id', { count: 'exact', head: true });
		const { count: playlistsCount } = await supabase.from('playlists').select('id', { count: 'exact', head: true });
		const { count: channelsCount } = await supabase.from('channels').select('id', { count: 'exact', head: true });

		let byLevel = {
			easy: 0,
			intermediate: 0,
			advanced: 0,
			notyet: 0
		};
		let timeByLevel = {
			easy: 0,
			intermediate: 0,
			advanced: 0,
			notyet: 0
		};

		for (const lvl of Object.keys(byLevel)) {
			const eqLevel = lvl === 'notyet' ? '' : lvl;
			const { count } = await supabase.from('videos').select('id', { count: 'exact', head: true }).eq('level', eqLevel);
			byLevel[lvl] = count || 0;
			const { data: levelVids } = await supabase.from('videos').select('length').eq('level', eqLevel);
			if (levelVids) {
				timeByLevel[lvl] = levelVids.reduce((sum, v) => sum + (v.length || 0), 0);
			} else {
				timeByLevel[lvl] = 0;
			}
		}
		const { data: vidsTime } = await supabase.from('videos').select('length');
		let runningTime = 0;
		if (vidsTime) {
			runningTime = vidsTime.reduce((sum, v) => sum + (v.length || 0), 0);
		}
		adminStats = {
			videos: videosCount || 0,
			playlists: playlistsCount || 0,
			channels: channelsCount || 0,
			runningTime,
			byLevel,
			timeByLevel
		};

		refreshing = false;
	}

	refresh();
</script>

<div class="admin-main">
	<h2 style="margin-bottom:1.1em;">CIBUBBLE Admin Tools</h2>
	<div class="stats-bar">
		<div class="stat-chip"><span class="stat-label">Videos</span> {adminStats.videos}</div>
		<div class="stat-chip"><span class="stat-label">Channels</span> {adminStats.channels}</div>
		<div class="stat-chip"><span class="stat-label">Playlists</span> {adminStats.playlists}</div>
		<div class="stat-chip">
			<span class="stat-label">Total Time</span>
			{formatTime(adminStats.runningTime)}
		</div>
		<div class="stat-chip level easy">
			<span class="stat-label">Easy</span>
			{adminStats.byLevel.easy}<span class="stat-time"
				>{formatTime(adminStats.timeByLevel.easy)}</span
			>
		</div>
		<div class="stat-chip level intermediate">
			<span class="stat-label">Intermediate</span>
			{adminStats.byLevel.intermediate}<span class="stat-time"
				>{formatTime(adminStats.timeByLevel.intermediate)}</span
			>
		</div>
		<div class="stat-chip level advanced">
			<span class="stat-label">Advanced</span>
			{adminStats.byLevel.advanced}<span class="stat-time"
				>{formatTime(adminStats.timeByLevel.advanced)}</span
			>
		</div>
		<div class="stat-chip level notyet">
			<span class="stat-label">Not Yet</span>
			{adminStats.byLevel.notyet}<span class="stat-time"
				>{formatTime(adminStats.timeByLevel.notyet)}</span
			>
		</div>
	</div>

	<div class="row">
		<input
			type="text"
			placeholder="Paste YouTube channel link or @handle…"
			bind:value={url}
			aria-label="YouTube Channel Link"
		/>
		<button
			on:click={importChannel}
			disabled={!url || importing}
			aria-label="Import Channel"
			style="margin-left:10px;">{importing ? 'Importing…' : 'Import Channel'}</button>
		<button on:click={refresh} disabled={refreshing} aria-label="Refresh"
			>{refreshing ? 'Refreshing…' : '↻ Refresh'}</button>
		<button
			style="margin-left:auto;"
			on:click={clearDatabase}
			disabled={clearing}
			aria-label="Clear Database">{clearing ? 'Clearing…' : 'Clear Database'}</button>
	</div>
	{#if message}
		<div style="margin:1em 0 1.2em 0; color:{message.startsWith('✅')
				? '#27ae60'
				: '#c0392b'}; font-weight:500;">
			{message}
		</div>
	{/if}

	<table class="admin-table">
		<thead>
			<tr>
				<th>Channel</th>
				<th>Country</th>
				<th>Tags</th>
				<th>Level</th>
				<th>Playlists</th>
				<th>Actions</th>
			</tr>
		</thead>
		<tbody>
			{#each channels as chan}
				<tr>
					<td>
						<img class="channel-thumb" src={chan.thumbnail} alt={chan.name} />
						<span style="font-weight:600;">{chan.name}</span>
					</td>
					<td>
						<select bind:value={chan._country} aria-label="Select country">
							<option value="">No Country</option>
							{#each countryOptions as country}
								<option value={country}>{country}</option>
							{/each}
						</select>
						{#if chan.country !== chan._country}
							<button
								on:click={() => setChannelCountry(chan.id, chan._country)}
								disabled={settingCountry[chan.id]}
							>
								{settingCountry[chan.id] ? 'Saving…' : 'Save'}
							</button>
						{/if}
					</td>
					<td>
						{#if chan._tags && chan._tags.length > 0}
							<div class="channel-tags-list">
								{#each chan._tags as tag}
									<span class="tag-pill">{tag.name}</span>
								{/each}
							</div>
						{:else}
							<span style="color:#aaa;">No tags</span>
						{/if}
						<div>
							<button
								style="background:#e3e3e3;color:#222;margin-top:6px;font-size:0.97em"
								on:click={() => toggleTagsFor(chan.id)}
								aria-expanded={showTagsFor === chan.id}
								aria-label={showTagsFor === chan.id ? 'Hide tags' : 'Set tags'}
							>
								{showTagsFor === chan.id ? 'Hide Tags ▲' : 'Set Tags ▼'}
							</button>
						</div>
					</td>
					<td>
						<select bind:value={chan._newLevel} aria-label="Set channel level">
							<option value="">
								{chan._mainLevel === 'mixed'
									? '-- Mixed --'
									: levels.find((lvl) => lvl.value === chan._mainLevel)?.label
										? '-- ' + levels.find((lvl) => lvl.value === chan._mainLevel)?.label + ' --'
										: '-- Not Set --'}
							</option>
							{#each levels as lvl}
								<option value={lvl.value}>{lvl.label}</option>
							{/each}
						</select>
						<button
							on:click={() => setChannelLevel(chan.id, chan._newLevel)}
							disabled={!chan._newLevel || settingLevel[chan.id]}
							aria-label="Set channel level"
							style="margin-top:6px"
						>
							{settingLevel[chan.id] ? 'Setting…' : 'Set Level'}
						</button>
					</td>
					<td>
						<button
							style="background:#eee;color:#222;font-size:0.97em"
							on:click={() => togglePlaylistsFor(chan.id)}
							aria-expanded={showPlaylistsFor === chan.id}
							aria-label={showPlaylistsFor === chan.id ? 'Hide playlists' : 'Show playlists'}
						>
							{showPlaylistsFor === chan.id ? 'Hide Playlists ▲' : 'Show Playlists ▼'}
						</button>
					</td>
					<td>
						<button
							style="background:#bbb;"
							on:click={() => deleteChannel(chan.id)}
							disabled={!!deleting[chan.id]}
						>
							{deleting[chan.id] ? 'Deleting…' : 'Delete'}
						</button>
					</td>
				</tr>
				{#if showTagsFor === chan.id}
					<tr class="collapsible-row">
						<td class="tags-cell" colspan="6">
							<TagManager
								channelId={chan.id}
								currentTags={chan._tags}
								onTagChanged={refresh}
							/>
						</td>
					</tr>
				{/if}
				{#if showPlaylistsFor === chan.id}
					<tr class="collapsible-row">
						<td class="playlists-cell" colspan="6">
							{#if playlistsLoading}
								<div>Loading playlists…</div>
							{:else if playlists.length === 0}
								<div>No playlists found for this channel.</div>
							{:else}
								<table class="playlist-table">
									<thead>
										<tr>
											<th>Playlist</th>
											<th>Videos</th>
											<th>Set Level</th>
										</tr>
									</thead>
									<tbody>
										{#each playlists as pl}
											<tr>
												<td>{pl.title}</td>
												<td>{pl.videos_count}</td>
												<td>
													<select bind:value={pl._newLevel} aria-label="Set playlist level">
														<option value="">
															--
															{pl.currentLevel === ''
																? 'Not Set'
																: pl.currentLevel === 'mixed'
																	? 'Mixed'
																	: levels.find((lvl) => lvl.value === pl.currentLevel)?.label ||
																		pl.currentLevel}
															--
														</option>
														{#each levels as lvl}
															<option value={lvl.value}>{lvl.label}</option>
														{/each}
													</select>
													<button
														style="margin-left:0.6em"
														on:click={() => setPlaylistLevel(pl.id, pl._newLevel)}
														disabled={!pl._newLevel || settingPlaylistLevel[pl.id]}
														aria-label="Set playlist level"
														>{settingPlaylistLevel[pl.id] ? 'Setting…' : 'Set'}</button
													>
												</td>
											</tr>
										{/each}
									</tbody>
								</table>
							{/if}
						</td>
					</tr>
				{/if}
			{/each}
			{#if channels.length === 0}
				<tr>
					<td colspan="6" style="text-align:center;color:#999;">No channels found.</td>
				</tr>
			{/if}
		</tbody>
	</table>
</div>

<style>
	.admin-main {
		max-width: 1100px;
		margin: 2.5rem auto 0 auto;
		background: #fff;
		border-radius: 13px;
		border: 1px solid #ececec;
		box-shadow: 0 2px 18px #ececec;
		padding: 2.1rem 1.5vw 1.6rem 1.5vw;
		font-family: Inter, Arial, sans-serif;
	}
	.row {
		display: flex;
		gap: 0.7em;
		margin-bottom: 1.2em;
		align-items: center;
		flex-wrap: wrap;
	}
	.channel-tags-list {
		display: flex;
		flex-wrap: wrap;
		gap: 0.25em;
		margin-bottom: 3px;
	}
	.tag-pill {
		background: #e9f6ff;
		color: #2562e9;
		padding: 0.13em 0.68em;
		border-radius: 8px;
		font-size: 0.95em;
		margin-bottom:2px;
		display:inline-flex;
		align-items:center;
	}
	/* ... (rest of your styles remain unchanged) ... */
	/* Keep your existing styles for the rest */
</style>
