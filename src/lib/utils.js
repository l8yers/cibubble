export function parseYouTubeLink(url) {
  try {
    let videoMatch = url.match(/(?:v=|youtu\.be\/)([A-Za-z0-9_-]{11})/);
    let playlistMatch = url.match(/[?&]list=([A-Za-z0-9_-]+)/);
    let channelMatch = url.match(/youtube\.com\/(channel|c|user)\/([A-Za-z0-9_-]+)/);

    if (playlistMatch) return { type: 'playlist', id: playlistMatch[1] };
    if (videoMatch) return { type: 'video', id: videoMatch[1] };
    if (channelMatch) return { type: 'channel', id: channelMatch[2] };

    return null;
  } catch {
    return null;
  }
}
