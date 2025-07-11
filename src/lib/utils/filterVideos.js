// src/lib/utils/filterVideos.js

export function filterVideos({
  videos,
  sortBy,
  selectedChannel,
  hideWatched,
  watchLaterIds,
  watchedIds
}) {
  if (sortBy === 'random') {
    return videos;
  }

  let filtered = videos;

  if (selectedChannel === '__WATCH_LATER__') {
    filtered = filtered.filter((v) => watchLaterIds.has(v.id));
  } else if (selectedChannel === '__ALL__') {
    // No additional filtering needed
  } else if (selectedChannel && selectedChannel !== '') {
    filtered = filtered.filter((v) => v.channel_id === selectedChannel);
  } else if (hideWatched) {
    filtered = filtered.filter((v) => !watchedIds.has(v.id));
  }

  // Filter out private/deleted/unavailable
  filtered = filtered.filter((v) => {
    if (!v.title || typeof v.title !== 'string') return false;
    const t = v.title.trim().toLowerCase();
    if (
      t === '' ||
      t === 'deleted video' ||
      t === 'private video' ||
      t.startsWith('[deleted') ||
      t.includes('video unavailable')
    ) return false;
    return true;
  });

  return filtered;
}
