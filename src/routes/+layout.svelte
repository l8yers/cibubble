<script>
  import { onMount } from 'svelte';
  import { loadUser, user } from '$lib/stores/user.js';
  import { loadWatchedVideos } from '$lib/stores/videos.js';
  import NavBar from '$lib/components/NavBar.svelte';

  onMount(() => {
    loadUser();
  });

  // Reactively load watchedIds when user changes (login/logout)
  $: if ($user) {
    loadWatchedVideos();
  }
</script>

<NavBar />
<slot />
