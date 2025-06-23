// src/lib/api/fetch-youtube-details.js

/**
 * Extracts channel ID, handle, user, or custom name from a YouTube channel URL or input.
 * Returns:
 *   - string (channelId or @handle)
 *   - { user: username }
 *   - { custom: customUrl }
 */
function extractChannelId(url) {
  if (!url) return null;
  url = url.trim();

  // Accept raw channel ID (UC...)
  if (/^(UC[\w-]{21,})$/.test(url)) return url;

  // Channel ID style
  let m = url.match(/\/channel\/(UC[\w-]{21,})/);
  if (m) return m[1];

  // Handle (@) style in URL or raw
  m = url.match(/(?:\/|^|\s)@([A-Za-z0-9._-]+)/);
  if (m) return '@' + m[1];

  // User style
  m = url.match(/\/user\/([A-Za-z0-9._-]+)/);
  if (m) return { user: m[1] };

  // Custom URL style (/c/)
  m = url.match(/\/c\/([A-Za-z0-9._-]+)/);
  if (m) return { custom: m[1] };

  // If just a raw @handle (no /)
  m = url.match(/^@([A-Za-z0-9._-]+)$/);
  if (m) return '@' + m[1];

  // If just a bare username/handle, treat as handle
  m = url.match(/^([A-Za-z0-9._-]+)$/);
  if (m) return '@' + m[1];

  return null;
}

export async function fetchYouTubeChannelDetails(url, apiKey) {
  let idObj = extractChannelId(url);
  let channelId = null;

  if (!idObj) throw new Error("Couldn't extract channel or handle from input");

  // === 1. Direct Channel ID ===
  if (typeof idObj === 'string' && idObj.startsWith('UC')) {
    channelId = idObj;
  }

  // === 2. Handle (@handle) ===
  if (typeof idObj === 'string' && idObj.startsWith('@')) {
    // Try API handle lookup
    let infoRes = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&forHandle=${idObj}&key=${apiKey}`
    );
    let infoJson = await infoRes.json();
    if (infoJson.items?.[0]?.id) channelId = infoJson.items[0].id;

    // Fallback: Search API by handle
    if (!channelId) {
      const q = idObj.replace(/^@/, '');
      const searchRes = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&q=${encodeURIComponent(q)}&key=${apiKey}`
      );
      const searchJson = await searchRes.json();
      channelId = searchJson.items?.[0]?.snippet?.channelId;
    }
    if (!channelId) throw new Error("Channel not found for handle");
  }

  // === 3. Username (/user/...) ===
  if (typeof idObj === 'object' && idObj.user) {
    let infoRes = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=id&forUsername=${idObj.user}&key=${apiKey}`
    );
    let infoJson = await infoRes.json();
    if (infoJson.items?.[0]?.id) channelId = infoJson.items[0].id;
    else throw new Error("Channel not found for username");
  }

  // === 4. Custom URL (/c/...) ===
  if (typeof idObj === 'object' && idObj.custom) {
    // No official API, so use search API as best-effort
    let infoRes = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&q=${encodeURIComponent(
        idObj.custom
      )}&key=${apiKey}`
    );
    let infoJson = await infoRes.json();
    // Best guess: use first match
    channelId = infoJson.items?.[0]?.snippet?.channelId;
    if (!channelId) throw new Error("Channel not found for custom URL");
  }

  // Final check
  if (!channelId) throw new Error("Could not resolve channel ID");

  // === Fetch channel details ===
  const infoRes = await fetch(
    `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&id=${channelId}&key=${apiKey}`
  );
  const infoJson = await infoRes.json();
  if (!infoJson.items?.[0]) throw new Error("Channel not found");

  const item = infoJson.items[0];
  return {
    id: channelId,
    title: item.snippet.title,
    thumbnail:
      item.snippet.thumbnails?.high?.url ||
      item.snippet.thumbnails?.default?.url ||
      '',
    subscribers: item.statistics?.subscriberCount || '',
    description: item.snippet.description || ''
  };
}
