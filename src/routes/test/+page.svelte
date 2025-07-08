<script>
  import { user, userLoading, authChecked, loadUser } from '$lib/stores/user.js';
  import { onMount } from 'svelte';

  // For explicit debugging
  $: if ($user) {
    console.log("USER:", $user);
    console.log("PROFILE:", $user.profile);
  } else {
    console.log("USER: not loaded or not logged in");
  }

  // Force load on mount (for direct page visit)
  onMount(() => {
    loadUser();
  });

  // Check admin status
  $: isAdmin = $user?.profile?.is_admin === true;
</script>

<h2>Auth Debug/Test</h2>

<div>
  <div><b>authChecked:</b> {$authChecked ? 'true' : 'false'}</div>
  <div><b>userLoading:</b> {$userLoading ? 'true' : 'false'}</div>
  <div><b>user:</b> {JSON.stringify($user, null, 2)}</div>
  <div><b>profile:</b> {JSON.stringify($user?.profile, null, 2)}</div>
  <div><b>is_admin:</b> {$user?.profile?.is_admin ? 'true' : 'false'}</div>
</div>

{#if !$authChecked}
  <div>Checking login state...</div>
{:else if $userLoading}
  <div>Loading user data...</div>
{:else if !$user}
  <div style="color: #e93c2f;">No user logged in.</div>
{:else}
  <div style="margin-top: 1em;">
    <div>
      <b>Logged in as:</b> {$user.email}
    </div>
    <div>
      <b>Admin Status:</b>
      {#if isAdmin}
        <span style="color: green;">You are an admin ✅</span>
      {:else}
        <span style="color: #e93c2f;">You are NOT admin ❌</span>
      {/if}
    </div>
    <div style="margin-top: 1em;">
      <button on:click={loadUser}>Reload User</button>
    </div>
  </div>
{/if}
