export async function load({ fetch }) {
  const res = await fetch('/api/videos');
  const videos = await res.json();
  return { videos };
}
