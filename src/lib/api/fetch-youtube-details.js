// POST to your endpoint and get {channel}
export async function fetchYouTubeDetails(url) {
  const res = await fetch('/api/fetch-youtube-details', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url })
  });
  return await res.json();
}
