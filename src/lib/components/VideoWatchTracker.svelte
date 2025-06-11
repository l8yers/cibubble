<script>
  import { onMount, onDestroy } from 'svelte';
  import { supabase } from '$lib/supabaseClient';

  export let videoId;
  export let videoDuration;
  export let userId;

  // Tracking state
  let player;
  let pollingInterval = null;
  let lastTime = 0;
  let watchSeconds = 0;
  let markedAsWatched = false;
  let lastSavedSeconds = 0;
  let playerReady = false;

  // Expose the playerReady state if you want to react in parent (optional)
  export let ytReady = false;

  // Attach YT
  function onYouTubeIframeAPIReady() {
    ytReady = true;
    initPlayer();
  }

  function initPlayer() {
    if (player || !document.getElementById('yt-player')) return;
    player = new window.YT.Player('yt-player', {
      events: {
        'onReady': () => { playerReady = true; startWatchTimer(); },
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
      }
    }, 1200);
    // console.log("Watch polling started");
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
  }

  function handleBeforeUnload() {
    flushProgress();
  }

  onMount(() => {
    // Attach global
    window.onYouTubeIframeAPIReady = onYouTubeIframeAPIReady;
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = "https://www.youtube.com/iframe_api";
      document.body.appendChild(tag);
    } else {
      ytReady = true;
      initPlayer();
    }
    window.addEventListener('beforeunload', handleBeforeUnload);
  });

  onDestroy(() => {
    stopWatchTimer();
    window.removeEventListener('beforeunload', handleBeforeUnload);
    flushProgress();
  });
</script>
