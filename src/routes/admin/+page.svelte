<script>
  import { supabase } from '$lib/supabaseClient';
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';

  let user = null;
  let profile = null;
  let errorMsg = '';
  let loading = true;

  onMount(async () => {
    try {
      // Get the logged-in user
      const { data: { user: u } } = await supabase.auth.getUser();
      user = u;

      if (!user) {
        errorMsg = "Not logged in.";
        setTimeout(() => goto('/login'), 1200);
        return;
      }

      // Try to load the profile
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error || !data) {
        errorMsg = "Profile not found.";
        setTimeout(() => goto('/login'), 1200);
        return;
      }

      profile = data;
      loading = false;
    } catch (err) {
      errorMsg = "Unexpected error: " + (err.message || err);
    }
  });
</script>

{#if errorMsg}
  <div style="color:red">{errorMsg}</div>
{:else if loading}
  <div>Loading…</div>
{:else}
  <div>
    <h2>Admin Test</h2>
    <p><b>User ID:</b> {user.id}</p>
    <p><b>Email:</b> {user.email}</p>
    <p><b>Profile (JSON):</b></p>
    <pre>{JSON.stringify(profile, null, 2)}</pre>
  </div>
{/if}
