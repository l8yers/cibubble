// Minimal, clear—returns only channel name + thumbnail

const YOUTUBE_API_KEY = process.env.VITE_YOUTUBE_API_KEY;

// Accept channel URL, ID, or @handle
function extractChannelIdOrHandle(input) {
  if (!input) return {};
  const str = String(input).trim();

  // Raw channel ID
  if (/^UC[a-zA-Z0-9_-]{22}$/.test(str)) return { id: str };

  // @handle (raw or in url)
  const at = str.match(/@([a-zA-Z0-9_]+)/);
  if (at) return { handle: at[1] };

  // /channel/ID URL
  const ch = str.match(/channel\/(UC[a-zA-Z0-9_-]{22})/);
  if (ch) return { id: ch[1] };

  return {};
}

async function getChannelIdFromHandle(handle) {
  // Try forHandle
  let url = `https://www.googleapis.com/youtube/v3/channels?part=id&forHandle=${encodeURIComponent(handle)}&key=${YOUTUBE_API_KEY}`;
  let res = await fetch(url);
  let data = await res.json();
  if (data.items && data.items.length) return data.items[0].id;

  // Fallback: try search
  url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&q=${encodeURIComponent(handle)}&key=${YOUTUBE_API_KEY}`;
  res = await fetch(url);
  data = await res.json();
  if (
    data.items &&
    data.items.length &&
    data.items[0].snippet &&
    data.items[0].snippet.channelId
  ) return data.items[0].snippet.channelId;

  return null;
}

export async function POST({ request }) {
  try {
    if (!YOUTUBE_API_KEY) return new Response(JSON.stringify({ error: 'No API key' }), { status: 500 });

    const { url } = await request.json();
    if (!url) return new Response(JSON.stringify({ error: "Missing URL" }), { status: 400 });

    const extracted = extractChannelIdOrHandle(url);
    let channelId = extracted.id || null;
    if (!channelId && extracted.handle) {
      channelId = await getChannelIdFromHandle(extracted.handle);
    }
    if (!channelId) return new Response(JSON.stringify({ error: "Channel not found" }), { status: 404 });

    // Now get minimal info
    const apiUrl = `https://www.googleapis.com/youtube/v3/channels?part=snippet&id=${channelId}&key=${YOUTUBE_API_KEY}`;
    const apiRes = await fetch(apiUrl);
    const data = await apiRes.json();
    if (!data.items || !data.items[0]) return new Response(JSON.stringify({ error: "Channel not found in API." }), { status: 404 });

    const c = data.items[0];
    const channel = {
      id: c.id,
      title: c.snippet?.title ?? '',
      thumbnail: c.snippet?.thumbnails?.default?.url ?? '',
    };

    return new Response(JSON.stringify({ channel }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err?.message || String(err) }), { status: 500 });
  }
}
