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

<div class="channels-page-container">
  <div class="channels-card">
    <h1 class="channels-title">My Channels</h1>
    {#if error}
      <div class="channels-error">{error}</div>
    {/if}

    {#if localChannels.length}
      <ul class="channels-list">
        {#each localChannels as ch (ch.id)}
          <li class="channel-row">
            <span class="channel-name">{ch.name}</span>
            <button class="remove-btn" on:click={() => removeChannel(ch.id)} disabled={loading}>
              Remove
            </button>
          </li>
        {/each}
      </ul>
    {:else}
      <div class="channels-empty">
        <span class="no-channels-emoji">📺</span>
        <span>You have no saved channels.</span>
      </div>
    {/if}
  </div>
</div>

<style>
.channels-page-container {
  min-height: 60vh;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  margin-top: 3.5em;
}
.channels-card {
  background: #fff;
  border-radius: 22px;
  box-shadow: 0 5px 32px 0 #e9eaee25;
  border: 1.2px solid #ededf2;
  max-width: 480px;
  width: 100%;
  padding: 2.3em 2em 2.5em 2em;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  min-width: 0;
  box-sizing: border-box;
}
.channels-title {
  font-size: 1.6em;
  font-weight: 900;
  letter-spacing: 0.01em;
  color: #181d27;
  margin-bottom: 1.2em;
  text-align: center;
}
.channels-error {
  color: #d3212c;
  background: #fff0f2;
  border-radius: 8px;
  padding: 0.7em 1.1em;
  margin-bottom: 1.2em;
  text-align: center;
  font-weight: 700;
}
.channels-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.7em;
}
.channel-row {
  display: flex;
  align-items: center;
  gap: 1.3em;
  padding: 0.9em 0.7em;
  border-radius: 14px;
  background: #fafbff;
  border: 1px solid #ededf7;
  transition: box-shadow 0.17s;
  box-shadow: 0 2px 10px 0 #e9eaee11;
}
.channel-row:hover {
  box-shadow: 0 4px 18px 0 #f4422220;
}
.channel-name {
  font-weight: 700;
  font-size: 1.09em;
  color: #1a2031;
  flex: 1 1 0;
  word-break: break-word;
}
.remove-btn {
  padding: 0.41em 1.2em;
  border: 1.4px solid #f2d0cf;
  border-radius: 9px;
  background: #fff6f5;
  color: #d3212c;
  font-weight: 800;
  font-size: 1em;
  cursor: pointer;
  transition: background 0.13s, color 0.13s, border 0.13s;
  box-shadow: 0 1px 6px #f2a0a033;
}
.remove-btn:hover:enabled,
.remove-btn:focus:enabled {
  background: #fbe6e5;
  color: #eb1000;
  border-color: #eb1000;
  outline: none;
}
.remove-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.channels-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 1.7em;
  color: #848491;
  font-size: 1.16em;
  font-weight: 700;
  gap: 0.45em;
  padding: 2em 0 1.5em 0;
}
.no-channels-emoji {
  font-size: 2.2em;
  margin-bottom: 0.18em;
  opacity: 0.73;
}
@media (max-width: 700px) {
  .channels-card {
    padding: 1.3em 0.7em 1.7em 0.7em;
    border-radius: 14px;
    box-shadow: 0 3px 18px 0 #e9eaee44;
  }
  .channels-title {
    font-size: 1.25em;
    margin-bottom: 0.8em;
  }
}
</style>
