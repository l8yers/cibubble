<script>
  import { user, userLoading, authChecked, loadUser, authError } from '$lib/stores/user.js';
  import { onMount } from 'svelte';
  import { supabase } from '$lib/supabaseClient';
  import { writable } from 'svelte/store';

  // Stores for session and raw auth info
  const sessionInfo = writable(null);
  const rawUserInfo = writable(null);

  // Local/session storage values
  let localStorageDump = '';
  let sessionStorageDump = '';
  let documentCookies = '';

  async function refreshSupabaseSession() {
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    sessionInfo.set({ sessionData, sessionError });
    const { data: userData, error: userError } = await supabase.auth.getUser();
    rawUserInfo.set({ userData, userError });
  }

  onMount(() => {
    loadUser();
    refreshSupabaseSession();

    // Get local/session storage and cookies
    localStorageDump = JSON.stringify(localStorage, null, 2);
    sessionStorageDump = JSON.stringify(sessionStorage, null, 2);
    documentCookies = document.cookie;
  });
</script>

<div style="max-width:700px;margin:2.5em auto;padding:1.5em 2em;background:#fff;border-radius:18px;box-shadow:0 6px 30px 0 #0001,0 1.5px 7px #e3e8ee35;">
  <h2>Auth Debug/Test</h2>
  <div><strong>authChecked:</strong> {$authChecked ? 'true' : 'false'}</div>
  <div><strong>userLoading:</strong> {$userLoading ? 'true' : 'false'}</div>
  <div><strong>authError:</strong> {$authError}</div>
  <div><strong>user:</strong> <pre style="background:#eee;padding:8px;border-radius:5px;">{JSON.stringify($user, null, 2)}</pre></div>

  <hr />
  <h3>Supabase Session (auth.getSession())</h3>
  <pre style="background:#eef;padding:8px;border-radius:5px;overflow-x:auto;">{JSON.stringify($sessionInfo, null, 2)}</pre>

  <h3>Supabase User (auth.getUser())</h3>
  <pre style="background:#eef;padding:8px;border-radius:5px;overflow-x:auto;">{JSON.stringify($rawUserInfo, null, 2)}</pre>

  <hr />
  <h3>localStorage</h3>
  <pre style="background:#f9f9ef;padding:8px;border-radius:5px;overflow-x:auto;">{localStorageDump}</pre>

  <h3>sessionStorage</h3>
  <pre style="background:#f9f9ef;padding:8px;border-radius:5px;overflow-x:auto;">{sessionStorageDump}</pre>

  <h3>document.cookie</h3>
  <pre style="background:#eef;padding:8px;border-radius:5px;overflow-x:auto;">{documentCookies}</pre>
</div>
