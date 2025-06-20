<script>
  import { onMount } from 'svelte';
  import { supabase } from '$lib/supabaseClient';
  import { user } from '$lib/stores/user.js';
  import { userChannels } from '$lib/stores/userChannels.js';

  let localChannels = [];
  let loading = false;
  let error = '';

  $: localChannels = $userChannels;

  async function removeChannel(channelId) {
    if (!$user) return;
    loading = true;
    error = '';
    const { error: dbError } = await supabase
      .from('saved_channels')
      .delete()
      .eq('user_id', $user.id)
      .eq('channel_id', channelId);

    if (dbError) {
      error = dbError.message;
    } else {
      userChannels.set(localChannels.filter(c => c.id !== channelId));
    }
    loading = false;
  }
</script>

<h1>My Channels</h1>
{#if error}
  <div class="error">{error}</div>
{/if}
<ul>
  {#each localChannels as ch (ch.id)}
    <li style="display:flex;align-items:center;gap:1em;margin:0.5em 0;">
      <span style="font-weight:600">{ch.name}</span>
      <button on:click={() => removeChannel(ch.id)} disabled={loading}>Remove</button>
    </li>
  {/each}
</ul>
{#if !localChannels.length}
  <div style="margin-top:2em;">You have no saved channels.</div>
{/if}

<style>
  .error { color: #d3212c; margin-bottom: 1em; }
  button {
    padding: 0.3em 1em;
    border: 1px solid #ddd;
    border-radius: 8px;
    background: #fafaff;
    color: #d3212c;
    font-weight: 700;
    cursor: pointer;
  }
  button:disabled { opacity: 0.6; cursor: not-allowed; }
</style>
