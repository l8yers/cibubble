<script>
  import { onMount } from 'svelte';
  import { loadUser } from '$lib/stores/user.js';
  import NavBar from '$lib/components/NavBar.svelte';

  onMount(() => {
    loadUser();
  });
</script>
<NavBar />
<slot />
