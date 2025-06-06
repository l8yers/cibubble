export async function load({ fetch }) {
  try {
    const res = await fetch('/api/videos');
    if (!res.ok) {
      return { videos: [] };
    }
    const videos = await res.json();
    return { videos };
  } catch (e) {
    return { videos: [] };
  }
}
