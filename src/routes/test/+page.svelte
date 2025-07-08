<script>
  import { supabase } from '$lib/supabaseClient';
  import { user, userLoading, authChecked } from '$lib/stores/user.js';
  import { onMount } from 'svelte';

  let profileRow = null;
  let error = null;
  let checked = false;

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
    {#if profileRow.is_admin === true}
      <div style="color:green;font-weight:bold;font-size:1.4em; margin-top:1em;">
        ADMIN PANEL
      </div>
    {:else}
      <div style="color:#b22222;font-weight:bold;font-size:1.1em; margin-top:1em;">
        Not logged in
      </div>
    {/if}
  {:else}
    <div>No profile row found for this user.</div>
  {/if}
{/if}
