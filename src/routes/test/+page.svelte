<script>
  import { writable } from 'svelte/store';
  import { onMount } from 'svelte';

  // Stores
  export const userChannels = writable([]);
  export const selectedChannel = writable('');

  // Dummy data on mount
  onMount(() => {
    userChannels.set([
      { id: 'channel1', name: 'Channel One' },
      { id: 'channel2', name: 'Channel Two' }
    ]);
  });

  function setAll() {
    selectedChannel.set('__ALL__');
  }

  // Fully reactive block
  $: channelFilter = $selectedChannel === '__ALL__' && $userChannels.length > 0
    ? $userChannels.map(ch => ch.id).join(',')
    : '';
</script>

<div style="padding:2em;">
  <h2>Test: userChannels Store (with dummy data)</h2>
  <pre>{JSON.stringify($userChannels, null, 2)}</pre>

  <h3>selectedChannel: {$selectedChannel}</h3>
  <button on:click={setAll}>Set to "__ALL__"</button>

  <h3>Computed Channel Filter:</h3>
  <pre>{channelFilter}</pre>
</div>
