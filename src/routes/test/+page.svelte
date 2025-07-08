<script>
  import { supabase } from '$lib/supabaseClient';
  import { user, userLoading, authChecked } from '$lib/stores/user.js';
  import { onMount } from 'svelte';

  let profileRow = null;
  let error = null;
  let checked = false;

  // Auto-load the user's profile on mount
  $: currentUser = $user;

  async function checkProfileDirect() {
    error = null;
    profileRow = null;
    checked = false;
    if (!currentUser?.id) {
      error = "No user ID found.";
      checked = true;
      return;
    }
    const { data, error: err } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', currentUser.id)
      .single();
    profileRow = data;
    error = err;
    checked = true;
  }

  onMount(() => {
    if (currentUser?.id) checkProfileDirect();
  });
</script>

<h2>Admin Profile Test Page</h2>

<div>
  <strong>Auth:</strong><br>
  authChecked: {$authChecked ? 'true' : 'false'}<br>
  userLoading: {$userLoading ? 'true' : 'false'}<br>
  user: <pre style="display:inline;">{JSON.stringify($user, null, 2)}</pre>
</div>

<hr>

<button on:click={checkProfileDirect} disabled={!currentUser?.id}>
  {profileRow ? "Refresh Profile Row" : "Load Profile Row"}
</button>

{#if checked}
  <h3>Direct Query Result:</h3>
  {#if error}
    <div style="color:red"><strong>Error:</strong> {JSON.stringify(error, null, 2)}</div>
  {:else if profileRow}
    <pre>{JSON.stringify(profileRow, null, 2)}</pre>
    <p>
      <strong>is_admin:</strong>
      {profileRow.is_admin === true ? '✅ TRUE' : profileRow.is_admin === false ? '❌ FALSE' : String(profileRow.is_admin)}
    </p>
  {:else}
    <div>No profile row found for this user.</div>
  {/if}
{/if}
