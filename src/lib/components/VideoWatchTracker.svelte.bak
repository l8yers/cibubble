<script>
  import { onMount, onDestroy, createEventDispatcher } from 'svelte';
  import { supabase } from '$lib/supabaseClient';
  import { markVideoWatched } from '$lib/stores/videos.js'; // <--- Import the mark watched helper!

  export let videoId;
  export let videoDuration;
  export let userId;
  export let suggestions = [];
  export let autoplay = false;

  const dispatch = createEventDispatcher();

  let player;
  let pollingInterval = null;
  let lastTime = 0;
  let watchSeconds = 0;
  let markedAsWatched = false;
  let lastSavedSeconds = 0;

  function onYouTubeIframeAPIReady() {
    initPlayer();
  }

  function initPlayer() {
    if (player || !document.getElementById('yt-player')) return;
    player = new window.YT.Player('yt-player', {
      events: {
        'onReady': () => { startWatchTimer(); },
        'onStateChange': onPlayerStateChange
      }
    });
  }

  function startWatchTimer() {
    if (pollingInterval) return;
    lastTime = player.getCurrentTime?.() || 0;
    pollingInterval = setInterval(async () => {
      if (!userId || !player) return;
      const currentTime = player.getCurrentTime?.() || 0;
      let delta = currentTime - lastTime;
      if (delta < 0) delta = 0;
      if (delta > 5) delta = 1;
      watchSeconds += delta;
      lastTime = currentTime;

      // Save every 8s
      if (Math.floor(watchSeconds / 8) > Math.floor(lastSavedSeconds / 8) || watchSeconds - lastSavedSeconds >= 8) {
        await savePartialWatchSession(Math.floor(watchSeconds));
        lastSavedSeconds = watchSeconds;
      }

      // Save full duration if 90% watched
      const duration = player.getDuration?.() || videoDuration || 1;
      const percentWatched = Math.max(currentTime, watchSeconds) / duration;
      if (!markedAsWatched && percentWatched >= 0.9 && userId) {
        markedAsWatched = true;
        await saveWatchSession(duration);
        markVideoWatched(videoId);  // <-- update store with new Set (always safe)
      }
    }, 1200);
  }

  function stopWatchTimer() {
    if (pollingInterval) {
      clearInterval(pollingInterval);
      pollingInterval = null;
      flushProgress();
    }
  }

  async function savePartialWatchSession(seconds) {
    if (!userId) return;
    const today = new Date().toISOString().slice(0, 10);
    await supabase.from('watch_sessions').upsert({
      user_id: userId,
      video_id: videoId,
      seconds: Math.max(1, seconds),
      date: today
    }, { onConflict: ['user_id', 'video_id', 'date'] });
  }

  async function saveWatchSession(duration) {
    if (!userId) return;
    const today = new Date().toISOString().slice(0, 10);
    await supabase.from('watch_sessions').upsert({
      user_id: userId,
      video_id: videoId,
      seconds: Math.max(1, Math.round(duration)),
      date: today
    }, { onConflict: ['user_id', 'video_id', 'date'] });
  }

  function flushProgress() {
    if (userId && watchSeconds > lastSavedSeconds) {
      savePartialWatchSession(Math.floor(watchSeconds));
      lastSavedSeconds = watchSeconds;
    }
  }

  function onPlayerStateChange(event) {
    stopWatchTimer();
    if (event.data === 1) {
      startWatchTimer();
    }
    if ([0, 2, 3].includes(event.data)) {
      flushProgress();
    }
    // Handle autoplay here
    if (event.data === 0 && autoplay && suggestions && suggestions.length) {
      const idx = suggestions.findIndex(v => v.id === videoId);
      const nextVid = suggestions[idx + 1];
      if (nextVid) {
        dispatch('playNextVideo', nextVid.id);
      }
    }
  }

  function handleBeforeUnload() {
    flushProgress();
  }

  onMount(() => {
    window.onYouTubeIframeAPIReady = onYouTubeIframeAPIReady;
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = "https://www.youtube.com/iframe_api";
      document.body.appendChild(tag);
    } else {
      initPlayer();
    }
    window.addEventListener('beforeunload', handleBeforeUnload);
  });

  onDestroy(() => {
    stopWatchTimer();
    window.removeEventListener('beforeunload', handleBeforeUnload);
    flushProgress();
    // Optionally: if (player && player.destroy) player.destroy();
  });
</script>
