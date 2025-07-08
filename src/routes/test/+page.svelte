<script>
  import { onMount } from 'svelte';
  import { supabase } from '$lib/supabaseClient';

  let user = null;
  let profile = null;
  let error = '';
  let loading = true;

  onMount(async () => {
    // Step 1: Get current logged-in user
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) {
      error = "You are not logged in";
      loading = false;
      return;
    }
    user = userData.user;

    // Step 2: Fetch profile row from 'profiles' table (RLS enabled!)
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError || !profileData) {
      error = profileError?.message || "Profile not found";
      loading = false;
      return;
    }

    profile = profileData;
    loading = false;
  });
</script>

{#if loading}
  <div>Loading...</div>
{:else if error}
  <div style="color:red;">{error}</div>
{:else if !profile?.is_admin}
  <div style="color:red;">Not allowed (admin only)</div>
{:else}
  <div>
    <h2>Admin Test Page</h2>
    <p>✅ You are an admin.</p>
    <pre>{JSON.stringify(profile, null, 2)}</pre>
  </div>
{/if}
