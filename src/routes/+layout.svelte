<script>
  import '../app.css';               // Import global CSS ONCE here
  import NavBar from '$lib/components/NavBar.svelte';
  import { onMount } from 'svelte';
  import { loadUser } from '$lib/stores/user.js'; // The store you created earlier

  // Load user on app startup
  onMount(() => {
    loadUser();
  });
</script>

<NavBar />
<slot />
