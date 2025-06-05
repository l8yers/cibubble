// src/routes/video/[id]/+page.js
export async function load({ params, fetch }) {
  const res = await fetch('/api/videos');
  const allVideos = await res.json();
  const video = allVideos.find(v => v.id === params.id);

  if (!video) {
    return {
      status: 404,
      error: new Error('Video not found')
    };
  }

  return { video };
}
