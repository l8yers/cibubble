<script>
  import { onMount } from 'svelte';
  import { supabase } from '$lib/supabaseClient';
  import { user } from '$lib/stores/user.js';

  let debug = {
    userStore: null,
    userId: null,
    adminFlag: null,
    fetchErr: null,
    isReady: false
  };

  $: $user, debug.userStore = $user;

  // TEST: Fetch profile on mount and show all possible info
  onMount(async () => {
    try {
      // Wait for $user to load
      let tries = 0;
      while (!$user && tries < 10) {
        await new Promise((r) => setTimeout(r, 300));
        tries++;
      }
      debug.userId = $user?.id;
      if (!debug.userId) {
        debug.isReady = true;
        return;
      }
      let { data, error } = await supabase.from('profiles').select('is_admin').eq('id', debug.userId).single();
      debug.adminFlag = data?.is_admin;
      debug.fetchErr = error?.message || null;
      debug.isReady = true;
    } catch (e) {
      debug.fetchErr = e.message;
      debug.isReady = true;
    }
  });
</script>

<!-- Place this somewhere visible for debugging -->
<div class="debug-panel" style="background:#fffaeb;padding:1em;margin-bottom:2em;border-radius:9px;color:#222;font-family:monospace;">
  <b>DEBUG PANEL</b><br>
  userStore: {JSON.stringify(debug.userStore)}<br>
  userId: {debug.userId}<br>
  adminFlag: {debug.adminFlag + ''}<br>
  fetchErr: {debug.fetchErr}<br>
  isReady: {debug.isReady + ''}<br>
</div>

<!-- Place literally at the very top of the component, even before your {#if ...} -->
<div style="background:#ffeeee;padding:1em;margin-bottom:2em;border-radius:9px;color:#222;font-family:monospace;">
  <b>ALWAYS-ON DEBUG</b><br>
  I should always be visible if Svelte is working.<br>
  If you see this, the file is loading and Svelte is mounting.
</div>

<style>
  .admin-main {
    min-height: 100vh;
    display: flex;
    align-items: flex-start;
    justify-content: center;
    background: var(--bg, #f4f6fa);
    padding: 3.5em 1.5em 2em 1.5em;
    box-sizing: border-box;
  }
  .admin-panel {
    background: var(--card, #fff);
    border-radius: 18px;
    box-shadow: 0 6px 30px 0 #0001, 0 1.5px 7px #e3e8ee35;
    max-width: 1200px;
    width: 100%;
    margin: 0 auto;
    padding: 2.2em 2.5em 2em 2.5em;
    display: flex;
    flex-direction: column;
    align-items: center;
    min-width: 380px;
  }
  .admin-section {
    width: 100%;
    overflow-x: auto;
    margin-top: 0.8em;
  }
  .admin-table {
    width: 100%;
    border-collapse: separate;
    border-spacing: 0;
    min-width: 1000px;
  }
  .admin-panel h2 {
    font-size: 2.2em;
    margin-bottom: 1.1em;
    text-align: center;
    letter-spacing: 0.05em;
    color: #244fa2;
    font-weight: 900;
    text-shadow: 0 1px 1.5px #0001;
  }
  .tabs {
    display: flex;
    gap: 1.5em;
    margin-bottom: 2em;
    border-bottom: 2px solid #e3e8ee;
    background: #f7fafd;
    border-radius: 9px 9px 0 0;
    padding: 0.6em 0.3em 0 0.3em;
    width: 100%;
    justify-content: center;
  }
  .tabs button {
    background: none;
    border: none;
    outline: none;
    font-size: 1.16em;
    font-weight: 700;
    letter-spacing: 0.04em;
    color: #244fa2;
    padding: 0.55em 1.35em 0.4em 1.35em;
    border-radius: 9px 9px 0 0;
    cursor: pointer;
    transition: background 0.16s, color 0.13s;
    margin-bottom: -2px;
    border-bottom: 2px solid transparent;
  }
  .tabs button.tab-active {
    background: #fff;
    color: #e93c2f;
    border-bottom: 2px solid #e93c2f;
    box-shadow: 0 2px 6px #e3e8ee20;
    font-weight: 900;
  }
  .tab-panel {
    padding: 1.1em 0.2em 0.5em 0.2em;
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  .admin-message {
    background: #eff5ff;
    color: #213b63;
    border-radius: 7px;
    padding: 0.85em 1.1em;
    margin: 1.1em 0 0 0;
    font-size: 1.06em;
    max-width: 600px;
    text-align: center;
    box-shadow: 0 1.5px 8px #244fa21a;
  }
  .admin-message.error {
    background: #fff1f1;
    color: #e93c2f;
    border: 1px solid #e93c2f44;
  }
  /* === Single Channel Upload Styles === */
  .single-channel-upload {
    margin-bottom: 1.4em;
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  .single-channel-box {
    margin: 1em auto 0 auto;
    background: #fff8;
    border-radius: 13px;
    box-shadow: 0 2px 18px #0011;
    padding: 1.5em 1.2em 1.2em 1.2em;
    min-width: 320px;
    max-width: 500px;
    width: 100%;
  }
  .single-channel-box label {
    font-weight: 700;
    margin-bottom: 0.3em;
    display: block;
  }
  .channel-details {
    text-align: center;
    font-size: 1.08em;
  }
  .main-input {
    display: block;
    margin: 0.5em auto;
    padding: 0.6em;
    border-radius: 6px;
    border: 1px solid #e3e8ee;
    width: 90%;
    font-size: 1.05em;
    background: #fff;
  }
  .main-btn {
    background: #e93c2f;
    color: #fff;
    font-weight: 700;
    border: none;
    border-radius: 7px;
    padding: 0.6em 1.3em;
    font-size: 1.08em;
    cursor: pointer;
    margin-top: 0.1em;
    transition: background 0.17s, box-shadow 0.15s;
    box-shadow: 0 1px 5px #e93c2f23;
  }
  .main-btn:disabled {
    background: #ddd;
    color: #aaa;
    cursor: not-allowed;
  }
  .main-btn.small {
    font-size: 0.97em;
    padding: 0.35em 0.9em;
    border-radius: 6px;
  }
  .tag-input-wrap { display:flex; align-items:center; gap:0.3em; }
  .tags-wrap { display:flex; flex-wrap:wrap; gap:0.5em; }
  .tag-badge {
    background: #244fa2;
    color: #fff;
    border-radius: 13px;
    padding: 0.14em 0.9em 0.14em 0.7em;
    font-size: 1em;
    margin-right: 0.3em;
    display: inline-flex;
    align-items: center;
    gap: 0.4em;
  }
  .remove-tag {
    cursor: pointer;
    color: #fff;
    margin-left: 0.5em;
    font-weight: bold;
  }
  @media (max-width: 900px) {
    .admin-panel {
      padding: 1.4em 0.4em 1.4em 0.4em;
    }
    .tabs {
      font-size: 0.97em;
      gap: 0.7em;
    }
    .tab-panel {
      padding: 0.5em 0.1em 0.4em 0.1em;
    }
    .single-channel-box {
      min-width: unset;
      max-width: 99vw;
      padding: 1em 0.5em 1em 0.5em;
    }
  }
</style>
