<script>
  import { supabase } from '$lib/supabaseClient.js';
  import { onMount } from 'svelte';

  let user = null;
  let loading = true;

  onMount(async () => {
    const { data, error } = await supabase.auth.getUser();
    user = data?.user;
    loading = false;
  });

  async function logOut() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }
</script>

{#if loading}
  <p>Loading...</p>
{:else if user}
  <h2>Your Profile</h2>
  <p><strong>Email:</strong> {user.email}</p>
  <p><strong>User ID:</strong> {user.id}</p>
  <button on:click={logOut}>Log out</button>
{:else}
  <p>You are not logged in. <a href="/login">Login</a></p>
{/if}
