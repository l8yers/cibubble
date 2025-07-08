<script>
  import { supabase } from '$lib/supabaseClient';
  import { user } from '$lib/stores/user.js';
  import { onMount } from 'svelte';

  export let fallback = 'Loading...'; // What to show while checking

  let profileRow = null;
  let error = null;
  let checked = false;
  let currentUser;

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

  // Run once on mount, and whenever user logs in/out
  onMount(() => {
    if (currentUser?.id) checkProfileDirect();
  });
  $: if ($user?.id && !checked) checkProfileDirect();
</script>

{#if !checked}
  <slot name="loading">{fallback}</slot>
{:else if error}
  <div style="color: #b22222;">{error?.message ?? error}</div>
{:else if profileRow?.is_admin === true}
  <slot />
{:else}
  <div style="color:#b22222;font-weight:bold;font-size:1.1em; margin-top:1em;">
    Not allowed (admin only).
  </div>
{/if}
