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

	// Reactively load watchedIds when user changes (login/logout)
	$: if ($user) {
		loadWatchedVideos();
	}
</script>

<NavBar />
<slot />

<!-- Global loading overlay -->
{#if $globalLoading}
	<div class="global-loader">
		<BubbleSpinner />
	</div>
{/if}

<!-- <CookieConsent /> -->

<style>
.global-loader {
	position: fixed;
	inset: 0;
	background: rgba(26, 32, 41, 0.22);
	backdrop-filter: blur(2px);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 9999;
}

:global(.bubble-spinner) {
	/* Target your BubbleSpinner root if needed */
	max-width: 160px;
	max-height: 160px;
}
</style>
