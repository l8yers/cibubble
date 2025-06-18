<script>
	import { supabase } from '$lib/supabaseClient';
	import { user } from '$lib/stores/user.js';
	import { get } from 'svelte/store';
	import { onMount, onDestroy } from 'svelte';
	import { getTagsForChannel } from '$lib/api/tags.js';

	// ADMIN COMPONENTS
	import AdminImportBar from '$lib/components/admin/AdminImportBar.svelte';
	import AdminSearchBar from '$lib/components/admin/AdminSearchBar.svelte';
	import AdminChannelTable from '$lib/components/admin/AdminChannelTable.svelte';

	// UTILS
	import { stripAccent, normalizeTags, parseCsv } from '$lib/adminutils.js';

	// ----- CONSTANTS (local, not imported) -----
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

	// ----- STATE -----
	let url = '';
	let message = '';
	let importing = false;
	let clearing = false;
	let deleting = {};
	let allChannels = [];
	let refreshing = false;
	let showPlaylistsFor = null;
	let playlists = [];
	let playlistsLoading = false;
	let settingCountry = {};
	let settingLevel = {};
	let settingPlaylistLevel = {};

	// Pagination & search
	let search = '';
	let currentPage = 1;
	const channelsPerPage = 12;
	let totalPages = 1;
	let filteredChannels = [];

	// CSV BULK UPLOAD STATE
	let csvInput;
	let csvFile = null;
	let bulkUploading = false;
	let uploadFailures = [];

	// ----- REACTIVE FILTERING -----
	$: {
		let s = stripAccent(search.trim().toLowerCase());
		let filtered = !s
			? allChannels
			: allChannels.filter(chan =>
				stripAccent(chan.name || '').toLowerCase().includes(s)
				|| stripAccent(chan.country || '').toLowerCase().includes(s)
				|| (chan._tags || []).some(t => stripAccent(t.name || '').toLowerCase().includes(s))
			);
		totalPages = Math.max(1, Math.ceil(filtered.length / channelsPerPage));
		if (currentPage > totalPages) currentPage = totalPages;
		filteredChannels = filtered.slice((currentPage - 1) * channelsPerPage, currentPage * channelsPerPage);
	}

	function onSearchInput(e) {
		search = e.target.value;
		currentPage = 1;
	}

	function goToPage(p) {
		if (p < 1 || p > totalPages) return;
		currentPage = p;
	}

	function handleCsvFile(e) {
		csvFile = e.target.files[0];
	}

	async function uploadCsv() {
		if (!csvFile) return;
		bulkUploading = true;
		uploadFailures = [];
		message = '';
		const reader = new FileReader();
		reader.onload = async (event) => {
			const text = event.target.result;
			const csvRows = parseCsv(text);
			let added = 0;
			for (let row of csvRows) {
				const url = row.youtube || row.link || row['youtube link'] || row['YouTube Link'] || row['url'];
				const tags = normalizeTags(row.tags || '');
				const country = row.country || '';
				const level = row.level || '';
				if (!url) {
					uploadFailures.push({ row, error: "Missing YouTube link" });
					continue;
				}
				try {
					const u = get(user);
					const res = await fetch('/api/add-video', {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({
							url,
							tags,
							country,
							level,
							added_by: u?.id || null
						})
					});
					const json = await res.json();
					if (json.error) uploadFailures.push({ row, error: json.error });
					else added++;
				} catch (err) {
					uploadFailures.push({ row, error: err.message });
				}
			}
			message = `✅ Uploaded ${added}/${csvRows.length} rows.`;
			if (uploadFailures.length) message += ` ${uploadFailures.length} failed (see details below)`;
			await refresh();
			bulkUploading = false;
			csvFile = null;
			if (csvInput) csvInput.value = '';
		};
		reader.readAsText(csvFile);
	}

	function handleBeforeUnload(event) {
		if (bulkUploading) {
			event.preventDefault();
			event.returnValue = 'Uploads are still in progress!';
			return event.returnValue;
		}
	}
	onMount(() => {
		window.addEventListener('beforeunload', handleBeforeUnload);
		refresh();
	});
	onDestroy(() => {
		window.removeEventListener('beforeunload', handleBeforeUnload);
	});

	async function importChannel() {
		message = '';
		importing = true;
		try {
			const u = get(user);
			const res = await fetch('/api/add-video', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ url, added_by: u?.id || null })
			});
			const json = await res.json();
			if (json.error) message = `❌ ${json.error}`;
			else message = `✅ Imported channel "${json.channel?.name}". ${json.playlists_count} playlists, ${json.videos_added} videos.`;
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
		deleting = { ...deleting, [id]: true };
		await supabase.from('videos').delete().eq('channel_id', id);
		await supabase.from('playlists').delete().eq('channel_id', id);
		await supabase.from('channels').delete().eq('id', id);
		await refresh();
		deleting = { ...deleting, [id]: false };
	}

	async function setChannelLevel(channelId, level) {
		if (!level) return;
		settingLevel = { ...settingLevel, [channelId]: true };
		await supabase.from('videos').update({ level }).eq('channel_id', channelId);
		message = `✅ All videos for this channel set to "${levels.find((l) => l.value === level)?.label}"`;
		await refresh();
		settingLevel = { ...settingLevel, [channelId]: false };
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
		settingPlaylistLevel = { ...settingPlaylistLevel, [playlistId]: true };
		await supabase.from('videos').update({ level }).eq('playlist_id', playlistId);
		message = `✅ All videos for this playlist set to "${levels.find((l) => l.value === level)?.label}"`;
		playlists = playlists.map((pl) =>
			pl.id === playlistId ? { ...pl, currentLevel: level, _newLevel: '' } : pl
		);
		settingPlaylistLevel = { ...settingPlaylistLevel, [playlistId]: false };
	}

	async function setChannelCountry(channelId, country) {
		settingCountry = { ...settingCountry, [channelId]: true };
		await supabase.from('channels').update({ country }).eq('id', channelId);
		await supabase.from('videos').update({ country }).eq('channel_id', channelId);
		message = '✅ Country updated';
		await refresh();
		settingCountry = { ...settingCountry, [channelId]: false };
	}

	async function refresh() {
		refreshing = true;
		try {
			let { data, error } = await supabase.from('channels').select('*');
			if (error) {
				message = "Channels error: " + (error.message ?? error);
				allChannels = [];
				return;
			}
			allChannels = await Promise.all(
				(data || []).map(async (chan) => {
					const { data: vids } = await supabase.from('videos').select('level').eq('channel_id', chan.id);
					let _mainLevel = '';
					if (vids && vids.length > 0) {
						const levelsArr = vids.map((v) => v.level || '');
						const uniqueLevels = Array.from(new Set(levelsArr));
						_mainLevel = uniqueLevels.length === 1 ? (uniqueLevels[0] || '') : 'mixed';
					}
					let _tags = [];
					try {
						_tags = await getTagsForChannel(chan.id);
					} catch (e) { _tags = []; }
					return {
						...chan,
						_country: chan.country || '',
						_tags,
						_newLevel: '',
						_mainLevel
					};
				})
			);
			currentPage = 1;
		} catch (e) {
			message = "Refresh error: " + e.message;
			allChannels = [];
		} finally {
			refreshing = false;
		}
	}
</script>

<div class="admin-main">
	<h2 style="margin-bottom:1.1em;">Admin Tools</h2>
	<AdminImportBar
		{url}
		setUrl={v => url = v}
		{importing}
		{importChannel}
		{refreshing}
		{refresh}
		{clearing}
		{clearDatabase}
		{csvInput}
		{handleCsvFile}
		{uploadCsv}
		{csvFile}
		{bulkUploading}
	/>
	<AdminSearchBar
		{search}
		{onSearchInput}
		{totalPages}
		{currentPage}
		{goToPage}
	/>
	<AdminChannelTable
		{filteredChannels}
		countryOptions={countryOptions}
		levels={levels}
		{showPlaylistsFor}
		{playlists}
		{playlistsLoading}
		{message}
		{settingCountry}
		{settingLevel}
		{settingPlaylistLevel}
		{deleting}
		{setChannelCountry}
		{setChannelLevel}
		{togglePlaylistsFor}
		{setPlaylistLevel}
		{deleteChannel}
		{refresh}
	/>
</div>


<style>
	.admin-main {
	max-width: 1100px;
	margin: 2.5rem auto 0 auto;
	background: #f7fafd;
	border-radius: 18px;
	border: 1px solid #e5eaf5;
	box-shadow: 0 4px 32px #e3e8ee44;
	padding: 2.1rem 1.5vw 2.5rem 1.5vw;
	font-family: 'Inter', Arial, sans-serif;
}

.admin-main h2 {
	font-size: 2.1rem;
	font-weight: 900;
	letter-spacing: 0.07em;
	text-transform: uppercase;
	color: #1c2541;
	margin-bottom: 1.6em;
	text-shadow: 0 1px 0 #fff4, 0 2px 12px #e3e8ee44;
}

.admin-section {
	background: #fff;
	border-radius: 13px;
	box-shadow: 0 2px 14px #e8eaf022;
	padding: 1.7em 1.3em 1.4em 1.3em;
	margin-bottom: 2.2em;
	border: 1px solid #f1f5fc;
}

/* Import Bar */
.import-bar {
	display: flex;
	align-items: center;
	gap: 1.2em;
	background: #f2f5fa;
	padding: 1.3em 1.3em 1.1em 1.3em;
	border-radius: 11px;
	margin-bottom: 1.9em;
	box-shadow: 0 2px 10px #e9ebf440;
}
.import-videos-title {
	font-size: 1.13em;
	font-weight: 900;
	color: #e93c2f;
	letter-spacing: 0.09em;
	text-transform: uppercase;
	margin-right: 1em;
}
.import-input {
	min-width: 270px;
	max-width: 440px;
	font-size: 1.09em;
	padding: 0.53em 1em;
	border-radius: 7px;
	border: 1.5px solid #e3e8ee;
	background: #fff;
	font-family: inherit;
	transition: border 0.15s;
}
.import-input:focus {
	border-color: #2e70ea;
	outline: none;
	box-shadow: 0 2px 8px #2562e910;
}

.import-btn {
	font-size: 1em;
	font-weight: 600;
	padding: 0.41em 1.35em;
	border-radius: 8px;
	border: none;
	margin-left: 0.7em;
	cursor: pointer;
	background: #244fa2;
	color: #fff;
	box-shadow: 0 1px 4px #e3e8ee22;
	transition: background 0.14s, box-shadow 0.14s, color 0.13s;
}
.import-btn:disabled {
	background: #d0d3e2;
	color: #adadad;
	cursor: not-allowed;
}
.import-btn:hover, .import-btn:focus {
	background: #1d3976;
	box-shadow: 0 2px 9px #a7b8e844;
}
.danger-btn.import-btn {
	background: #fae3e6;
	color: #be2231;
	font-weight: 700;
	border: 1.3px solid #f7b8b6;
}
.danger-btn.import-btn:hover, .danger-btn.import-btn:focus {
	background: #f6b9b9;
	color: #b12c2c;
}

/* Messages, Alerts */
.admin-message {
	font-weight: 600;
	font-size: 1.08em;
	padding: 0.7em 1.1em;
	background: #f2f8ff;
	border-left: 4px solid #2562e9;
	color: #2562e9;
	border-radius: 6px;
	margin: 1.1em 0 1.7em 0;
	box-shadow: 0 2px 12px #e3e8ee1a;
}
.admin-message.error {
	background: #fbeaea;
	border-left: 4px solid #be2231;
	color: #be2231;
}

/* Channel Table */
.admin-table {
	width: 100%;
	margin: 1.4em 0 0 0;
	border-collapse: separate;
	border-spacing: 0;
	background: #fff;
	font-size: 1em;
	border-radius: 10px;
	box-shadow: 0 2px 14px #e8eaf022;
	overflow: hidden;
}
.admin-table th,
.admin-table td {
	padding: 0.41em 0.6em;
	border-bottom: 1px solid #f1f5fc;
	text-align: left;
	vertical-align: middle;
	font-size: 1em;
}
.admin-table th {
	background: #f2f8ff;
	color: #e93c2f;
	font-weight: 800;
	font-size: 1.03em;
	letter-spacing: 0.01em;
	text-transform: uppercase;
}
.admin-table tr:last-child td {
	border-bottom: none;
}
.admin-table tbody tr {
	transition: background 0.11s;
}
.admin-table tbody tr:hover {
	background: #f7faff;
}
.channel-tags-list {
	display: flex;
	flex-wrap: wrap;
	gap: 0.23em;
	margin-bottom: 3px;
}
.tag-pill {
	background: #e9f6ff;
	color: #2562e9;
	padding: 0.13em 0.7em;
	border-radius: 8px;
	font-size: 0.98em;
	margin-bottom: 2px;
	display: inline-flex;
	align-items: center;
	transition: background 0.12s, color 0.12s;
}
.tag-pill:hover {
	background: #cbe8ff;
	color: #214d77;
}
.collapsible-row .tags-cell,
.collapsible-row .playlists-cell {
	padding: 0.57em 1em !important;
	background: #f8fafd;
	font-size: 0.97em;
	border-radius: 9px;
}
.playlist-table {
	width: 100%;
	margin-top: 0.6em;
	background: none;
	font-size: 0.97em;
	border-collapse: collapse;
}
.playlist-table th,
.playlist-table td {
	padding: 0.22em 0.36em;
	border-bottom: 1px solid #f4f4fa;
	text-align: left;
}
.playlist-table th {
	background: #f4f8fd;
}
.playlist-table tr:last-child td {
	border-bottom: none;
}

.main-btn,
.danger-btn {
	font-size: 1em;
	font-weight: 600;
	padding: 0.43em 1.21em;
	border-radius: 8px;
	border: none;
	margin-left: 0.35em;
	cursor: pointer;
	transition: background 0.13s, color 0.13s, box-shadow 0.14s;
	box-shadow: 0 1px 3px #e3e8ee1a;
}
.main-btn {
	background: #f1f6fb;
	color: #244fa2;
}
.main-btn:hover,
.main-btn:focus {
	background: #dbeafe;
	color: #152449;
}
.main-btn.light {
	background: #f7f7fa;
	color: #262626;
	font-weight: 500;
}
.main-btn.light:hover {
	background: #edeffd;
}
.main-btn.small {
	padding: 0.21em 0.7em;
	font-size: 0.96em;
	margin-left: 0.2em;
}
.danger-btn {
	background: #fbeaea;
	color: #be2231;
}
.danger-btn:hover {
	background: #f9d7da;
	color: #b12c2c;
}

/* Table/section dividers */
.admin-divider {
	border: none;
	border-bottom: 2px solid #e3e8ee;
	margin: 1.7em 0 1.7em 0;
}

/* SearchBar and Pagination tweaks */
.admin-search-bar {
	display: flex;
	align-items: center;
	gap: 1.2em;
	background: #f2f5fa;
	padding: 1em 1.1em;
	border-radius: 11px;
	margin-bottom: 1.4em;
}
.pagination-bar {
	display: flex;
	align-items: center;
	gap: 0.5em;
	margin-left: auto;
	font-size: 1.01em;
}
.pagination-btn {
	background: none;
	border: none;
	color: #2562e9;
	font-weight: 700;
	font-size: 1.1em;
	cursor: pointer;
	padding: 0.2em 0.6em;
	border-radius: 7px;
	transition: background 0.12s;
}
.pagination-btn[disabled] {
	color: #aaa;
	cursor: not-allowed;
}
.pagination-btn:not([disabled]):hover {
	background: #eaf4ff;
}

/* Responsive tweaks */
@media (max-width: 900px) {
	.admin-main {
		padding: 1.2em 0.7em 1.3em 0.7em;
	}
	.admin-section {
		padding: 1.2em 0.8em 1em 0.8em;
	}
	.import-bar,
	.admin-search-bar {
		flex-direction: column;
		gap: 0.6em;
	}
	.admin-table th,
	.admin-table td {
		font-size: 0.93em;
		padding: 0.21em 0.18em;
	}
	.channel-tags-list {
		gap: 0.13em;
	}
	.tag-pill {
		font-size: 0.86em;
	}
	.collapsible-cell,
	.playlists-cell,
	.tags-cell {
		padding: 0.32em 0.22em !important;
	}
	.playlist-table th,
	.playlist-table td {
		font-size: 0.91em;
		padding: 0.12em 0.09em;
	}
}
@media (max-width: 600px) {
	.admin-main {
		padding: 0.9em 0.1em 1em 0.1em;
	}
	.admin-table th,
	.admin-table td {
		font-size: 0.89em;
		padding: 0.08em 0.03em;
	}
	.channel-tags-list {
		gap: 0.05em;
	}
	.tag-pill {
		font-size: 0.73em;
	}
	.collapsible-cell,
	.playlists-cell,
	.tags-cell {
		padding: 0.11em 0.03em !important;
	}
}

/* Optional: loader animation for bulk actions */
.bulk-loading {
	opacity: 0.5;
	pointer-events: none;
	position: relative;
}
.bulk-loading::after {
	content: '';
	position: absolute;
	top: 48%;
	left: 50%;
	width: 32px;
	height: 32px;
	border-radius: 50%;
	border: 3px solid #cbe8ff;
	border-top: 3px solid #2562e9;
	animation: spin 1s linear infinite;
	transform: translate(-50%, -50%);
	z-index: 10;
}
@keyframes spin {
	0% { transform: translate(-50%, -50%) rotate(0deg);}
	100% { transform: translate(-50%, -50%) rotate(360deg);}
}

</style>
