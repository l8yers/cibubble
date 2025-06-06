// src/lib/utils.js

// Example implementation (expand as needed)
export function parseYouTubeLink(url) {
  try {
    // Video
    let match = url.match(
      /(?:v=|\/embed\/|\.be\/|\/v\/|\/watch\/|\/shorts\/)([a-zA-Z0-9_-]{11})/
    );
    if (match) return { type: 'video', id: match[1] };

    // Playlist
    match = url.match(/[?&]list=([a-zA-Z0-9_-]+)/);
    if (match) return { type: 'playlist', id: match[1] };

    // Channel (by /channel/ID or /c/NAME or /@handle)
    match = url.match(/(?:youtube\.com\/(channel|c|user|@))([^/?]+)/);
    if (match) return { type: 'channel', id: match[2] };

    return null;
  } catch (e) {
    return null;
  }
}
