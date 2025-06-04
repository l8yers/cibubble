import fs from 'fs/promises';
import path from 'path';

const dbPath = path.resolve('src/lib/videos.json');

// GET: return all videos
export async function GET() {
  const data = await fs.readFile(dbPath, 'utf8');
  return new Response(data, { headers: { 'Content-Type': 'application/json' } });
}

// POST: add a new video
export async function POST({ request }) {
  const video = await request.json();
  const raw = await fs.readFile(dbPath, 'utf8');
  const videos = JSON.parse(raw);

  // Don’t add duplicates
  if (!videos.some(v => v.id === video.id)) {
    videos.push(video);
    await fs.writeFile(dbPath, JSON.stringify(videos, null, 2));
  }

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' }
  });
}
