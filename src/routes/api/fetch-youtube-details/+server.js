// src/routes/api/fetch-youtube-details/+server.js
import { fetchYouTubeChannelDetails } from '$lib/api/fetch-youtube-details.js';

const YOUTUBE_API_KEY = process.env.VITE_YOUTUBE_API_KEY;

export async function POST({ request }) {
  try {
    const { url } = await request.json();
    if (!url) {
      return new Response(JSON.stringify({ error: "Missing URL" }), { status: 400 });
    }
    if (!YOUTUBE_API_KEY) {
      return new Response(JSON.stringify({ error: "Missing API key" }), { status: 500 });
    }
    const channel = await fetchYouTubeChannelDetails(url, YOUTUBE_API_KEY);
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
