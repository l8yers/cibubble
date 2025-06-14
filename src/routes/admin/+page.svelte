<script>
	import { supabase } from '$lib/supabaseClient';
	import { user } from '$lib/stores/user.js';
	import { get } from 'svelte/store';

	const countryOptions = [
		'Argentina','Canary Islands','Chile','Colombia','Costa Rica','Cuba','Dominican Republic','Ecuador','El Salvador','Equatorial Guinea','France','Guatemala','Italy','Latin America','Mexico','Panama','Paraguay','Peru','Puerto Rico','Spain','United States','Uruguay','Venezuela'
	];

	let tagOptions = [
		'For Learners','Kids Show','Dubbed Show','Videogames','News','History','Science','Travel','Lifestyle','Personal Development','Cooking','Music','Comedy','Native Show','Education','Sports','Current Events'
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
	let savingTags = {};

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

	// PATCH: Send user.id as added_by
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
					added_by: u?.id || null // <--- Use UUID!
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

	async function setChannelTags(chan) {
		if (!chan._tagsSet) return;
		savingTags[chan.id] = true;
		for (const t of chan._tagsSet) {
			if (!tagOptions.includes(t)) tagOptions = [...tagOptions, t];
		}
		await supabase
			.from('channels')
			.update({
				tags: Array.from(chan._tagsSet).join(', ')
			})
			.eq('id', chan.id);
		message = '✅ Tags updated';
		chan._tagsDirty = false;
		await refresh();
		savingTags[chan.id] = false;
	}

	async function setChannelCountry(channelId, country) {
		settingCountry[channelId] = true;
		await supabase.from('channels').update({ country }).eq('id', channelId);
		message = '✅ Country updated';
		await refresh();
		settingCountry[channelId] = false;
	}

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
				return {
					...chan,
					_country: chan.country || '',
					_tagsSet: new Set(
						(chan.tags || '')
							.split(',')
							.map((t) => t.trim())
							.filter(Boolean)
					),
					_newTag: '',
					_tagsDirty: false,
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
						{#if chan.tags}
							<span>{chan.tags}</span>
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
							<div style="display:flex;flex-wrap:wrap;gap:0.3em;align-items:center;">
								{#each tagOptions as tag}
									<label class="chip" tabindex="0" aria-label={'Tag: ' + tag}>
										<input
											type="checkbox"
											checked={chan._tagsSet.has(tag)}
											on:change={() => {
												if (chan._tagsSet.has(tag)) chan._tagsSet.delete(tag);
												else chan._tagsSet.add(tag);
												chan._tagsDirty = true;
											}}
										/>
										<span>{tag}</span>
									</label>
								{/each}
								<input
									type="text"
									placeholder="Add tag"
									style="margin-left:0.5em;width:90px;font-size:0.98em;"
									bind:value={chan._newTag}
									aria-label="Add new tag"
									on:keydown={(e) => {
										if (e.key === 'Enter' && chan._newTag?.trim()) {
											chan._tagsSet.add(chan._newTag.trim());
											if (!tagOptions.includes(chan._newTag.trim()))
												tagOptions = [...tagOptions, chan._newTag.trim()];
											chan._newTag = '';
											chan._tagsDirty = true;
										}
									}}
								/>
								<button
									style="margin-left:0.3em;font-size:0.93em;padding:0.4em 1.1em;"
									on:click={() => setChannelTags(chan)}
									disabled={!chan._tagsDirty || savingTags[chan.id]}
									aria-label="Save tags">{savingTags[chan.id] ? 'Saving…' : 'Save'}</button
								>
							</div>
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
	.dropdown-btn {
		padding: 0.35em 1.1em;
		font-size: 1em;
		border-radius: 9px;
		border: 1.2px solid #ececec;
		background: #f9f9f9;
		color: #1d1d1d;
		font-weight: 600;
		cursor: pointer;
		display: flex;
		align-items: center;
		gap: 0.3em;
		min-width: 110px;
		transition:
			border 0.11s,
			background 0.11s;
	}
	.selected-tags-preview .tag {
		background: #f5e9f7;
		color: #b03397;
		border-radius: 7px;
		font-size: 0.92em;
		padding: 0 7px 0 6px;
		margin: 0 3px 0 0;
		display: inline-block;
	}
	.chip {
		background: #f7f7fb;
		border-radius: 4px;
		padding: 1px 6px 1px 4px;
		display: inline-flex;
		align-items: center;
		cursor: pointer;
		margin-right: 4px;
		margin-bottom: 2px;
		font-size: 0.93em;
		min-height: 22px;
	}
	.chip input[type='checkbox'] {
		margin-right: 3px;
	}
	.tag-input {
		width: 90px;
		padding: 0.3em 0.7em;
		font-size: 0.97em;
		border: 1px solid #ececec;
		border-radius: 6px;
		background: #fafafa;
		color: #181818;
		margin-right: 6px;
	}
	.stats-bar {
		display: flex;
		flex-wrap: wrap;
		gap: 0.8em 1.3em;
		margin: 0 0 1.5em 0;
		padding: 0.7em 1.1em;
		background: #f8f7fa;
		border-radius: 8px;
		align-items: flex-end;
	}
	.stat-chip {
		display: flex;
		align-items: center;
		gap: 0.45em;
		background: #fff;
		border-radius: 6px;
		font-size: 1.04em;
		padding: 0.29em 0.95em 0.29em 0.7em;
		box-shadow: 0 1px 5px #ececec;
		color: #d14e17;
		font-weight: 600;
		border: 1px solid #f3efea;
	}
	.stat-label {
		color: #a4a4a4;
		font-size: 0.98em;
		margin-right: 0.24em;
		font-weight: 500;
		text-transform: none;
		letter-spacing: 0;
	}
	.stat-time {
		color: #aaa;
		font-size: 0.98em;
		font-weight: 400;
		margin-left: 0.4em;
	}
	.stat-chip.level.easy {
		border-left: 5px solid #16a085;
	}
	.stat-chip.level.intermediate {
		border-left: 5px solid #f5a623;
	}
	.stat-chip.level.advanced {
		border-left: 5px solid #e93c2f;
	}
	.stat-chip.level.notyet {
		border-left: 5px solid #b2b2b2;
	}
	.admin-table {
		width: 100%;
		margin: 1.5em 0 0 0;
		border-collapse: collapse;
		background: #fff;
		font-size: 1em;
	}
	.admin-table th,
	.admin-table td {
		padding: 0.33em 0.45em;
		border-bottom: 1px solid #f2f2f2;
		text-align: left;
		vertical-align: middle;
		font-size: 0.98em;
	}
	.admin-table th {
		color: #e93c2f;
		font-weight: 700;
		font-size: 1.04em;
		letter-spacing: 0.01em;
	}
	.admin-table td {
		vertical-align: middle;
		font-size: 0.98em;
	}
	.channel-thumb {
		width: 30px;
		height: 30px;
		object-fit: cover;
		border-radius: 5px;
		margin-right: 0.6em;
		border: 1px solid #eee;
		vertical-align: middle;
	}
	.collapsible-row .tags-cell,
	.collapsible-row .playlists-cell {
		padding: 0.5em 0.8em !important;
		background: #f6faff;
		font-size: 0.96em;
	}
	.playlist-table {
		width: 100%;
		margin-top: 0.6em;
		background: none;
		font-size: 0.96em;
		border-collapse: collapse;
	}
	.playlist-table th,
	.playlist-table td {
		padding: 0.29em 0.39em;
		border-bottom: 1px solid #f4f4fa;
		text-align: left;
	}
	@media (max-width: 900px) {
		.admin-main {
			padding: 1em 0.4em 1em 0.4em;
		}
		.admin-table th,
		.admin-table td {
			font-size: 0.93em;
			padding: 0.18em 0.21em;
		}
		.channel-thumb {
			width: 22px;
			height: 22px;
			margin-right: 0.32em;
		}
		.chip {
			font-size: 0.83em;
			min-height: 18px;
			padding: 1px 3px 1px 2px;
		}
		.collapsible-cell,
		.playlists-cell,
		.tags-cell {
			padding: 0.32em 0.3em !important;
		}
		.playlist-table th,
		.playlist-table td {
			font-size: 0.91em;
			padding: 0.13em 0.1em;
		}
		.stat-chip {
			font-size: 0.93em;
			padding: 0.18em 0.5em 0.18em 0.4em;
		}
	}
	@media (max-width: 600px) {
		.admin-table th,
		.admin-table td {
			font-size: 0.91em;
			padding: 0.11em 0.06em;
		}
		.channel-thumb {
			width: 16px;
			height: 16px;
		}
		.chip {
			font-size: 0.75em;
			min-height: 14px;
		}
		.collapsible-cell,
		.playlists-cell,
		.tags-cell {
			padding: 0.15em 0.06em !important;
		}
		.stat-chip {
			font-size: 0.88em;
			padding: 0.11em 0.32em 0.11em 0.21em;
		}
	}
</style>
