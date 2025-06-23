import { fetchYouTubeChannelDetails } from '$lib/api/fetch-youtube-details.js';

export async function POST({ request }) {
  try {
    const { url } = await request.json();
    if (!url) return new Response(JSON.stringify({ error: "Missing URL" }), { status: 400 });
    const channel = await fetchYouTubeChannelDetails(url);
    return new Response(JSON.stringify({ channel }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }
}
