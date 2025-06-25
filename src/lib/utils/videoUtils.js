// $lib/utils/videoUtils.js

/**
 * Shuffle an array (Fisher-Yates).
 */
export function shuffle(arr) {
	return (arr || [])
		.map((v) => [Math.random(), v])
		.sort(([a], [b]) => a - b)
		.map(([, v]) => v);
}

/**
 * Parse channel tags (array or comma string).
 */
export function parseTags(tags) {
	if (Array.isArray(tags)) {
		return tags.map((t) => t.toLowerCase());
	}
	if (typeof tags === "string") {
		return tags
			.split(",")
			.map((t) => t.trim().toLowerCase())
			.filter(Boolean);
	}
	return [];
}

/**
 * Fetch video suggestions for a given video.
 * Handles both playlist and non-playlist logic.
 */
export async function fetchSuggestions(video, supabase) {
	if (!video) return [];
	if (video.playlist_id) {
		const { data: playlistVids } = await supabase
			.from('videos')
			.select('*, channel:channel_id(name), playlist:playlist_id(title)')
			.eq('playlist_id', video.playlist_id)
			.order('playlist_position', { ascending: true })
			.limit(50);
		return playlistVids || [];
	} else {
		const { data: sameChannel } = await supabase
			.from('videos')
			.select('*, channel:channel_id(name)')
			.eq('channel_id', video.channel_id)
			.neq('id', video.id)
			.limit(30);
		const { data: otherChannelsRaw } = await supabase
			.from('videos')
			.select('*, channel:channel_id(name)')
			.neq('channel_id', video.channel_id)
			.neq('id', video.id)
			.limit(400);

		const channelMap = {};
		for (const v of shuffle(otherChannelsRaw || [])) {
			if (!channelMap[v.channel_id]) channelMap[v.channel_id] = v;
		}
		const otherVids = Object.values(channelMap).slice(0, 23);
		let channelVids = shuffle(sameChannel || []).slice(0, 7);
		let suggestionsMixed = otherVids.slice();
		let insertIndexes = shuffle([...Array(Math.min(15, suggestionsMixed.length)).keys()]).slice(
			0,
			channelVids.length
		);
		insertIndexes.forEach((idx, i) => {
			let pos = Math.min(idx, suggestionsMixed.length);
			suggestionsMixed.splice(pos, 0, channelVids[i]);
		});
		return suggestionsMixed.slice(0, 30);
	}
}
