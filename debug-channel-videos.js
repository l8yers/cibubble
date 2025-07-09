// get_channel_uploads.js
import fetch from 'node-fetch';

const YOUTUBE_API_KEY = 'AIzaSyAzRowhM9LUtWDY5QnaEc70vzgiSFHilus';

const [, , channelId] = process.argv;

if (!channelId) {
  console.error('Usage: node get_channel_uploads.js <channel_id>');
  process.exit(1);
}

async function getUploadsPlaylistId(channelId) {
  const url = `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${channelId}&key=${YOUTUBE_API_KEY}`;
  const res = await fetch(url);
  const data = await res.json();
  const uploadsId = data.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
  if (!uploadsId) throw new Error('No uploads playlist found for channel');
  return uploadsId;
}

async function fetchAllUploadsVideos(uploadsPlaylistId) {
  let videos = [];
  let nextPage = '';
  do {
    const url = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&playlistId=${uploadsPlaylistId}&maxResults=50${nextPage ? `&pageToken=${nextPage}` : ''}&key=${YOUTUBE_API_KEY}`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.items) videos.push(...data.items);
    nextPage = data.nextPageToken || '';
  } while (nextPage);
  return videos.map(v => ({
    id: v.contentDetails.videoId,
    title: v.snippet.title,
    published: v.snippet.publishedAt,
  }));
}

async function main() {
  try {
    console.log(`Getting uploads playlist for channel ${channelId}...`);
    const uploadsId = await getUploadsPlaylistId(channelId);
    console.log(`Uploads playlist: ${uploadsId}`);

    const videos = await fetchAllUploadsVideos(uploadsId);

    console.log(`\nTotal videos: ${videos.length}`);
    videos.forEach((v, i) => {
      console.log(`${i + 1}. [${v.id}] ${v.title} (${v.published})`);
    });
  } catch (e) {
    console.error('Error:', e.message);
  }
}

main();
