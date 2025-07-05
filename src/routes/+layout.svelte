<script>
	import { onMount } from 'svelte';
	import { loadUser, user } from '$lib/stores/user.js';
	import { loadWatchedVideos } from '$lib/stores/videos.js';
	import NavBar from '$lib/components/ui/NavBar.svelte';
	import BubbleSpinner from '$lib/components/ui/BubbleSpinner.svelte';
	import { globalLoading } from '$lib/stores/loading.js';
	// import CookieConsent from '$lib/components/CookieConsent.svelte';

	onMount(() => {
		loadUser();
	});

	$: if ($user) {
		loadWatchedVideos();
	}
</script>

<NavBar />
<slot />

<!-- Only ONE loader per context: global overlay here -->
{#if $globalLoading}
  <div class="bubble-spinner-overlay">
    <BubbleSpinner />
  </div>
{/if}

<!-- <CookieConsent /> -->