<script context="module">
  export async function load({ params, fetch }) {
    const channelId = params.id;
    const res = await fetch(`/api/channel?id=${channelId}`);
    if (!res.ok) return { status: 404 };
    const { channel, playlists } = await res.json();
    return { props: { channel, playlists } };
  }
</script>

<script>
  export let channel, playlists;
</script>

<style>
.header { margin-bottom: 2em; }
.header-title { font-size: 1.55rem; font-weight: 700; margin-bottom: 0.16em; }
.header-meta { color: #777; }
.grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.4em; }
.card { background: #fff; border-radius: 13px; box-shadow: 0 2px 10px #eee; overflow: hidden;}
.thumb { width: 100%; aspect-ratio: 16/9; object-fit: cover;}
.card-body { padding: 0.9em 1em; }
.card-title { font-weight: 600; font-size: 1.07em; }
</style>

<div class="header">
  <div class="header-title">{channel.name}</div>
</div>

<div class="grid">
  {#each playlists as pl}
    <div class="card">
      <a href={`/playlist/${pl.id}`}>
        <img class="thumb" src={pl.thumbnail} alt={pl.title} />
      </a>
      <div class="card-body">
        <div class="card-title">{pl.title}</div>
      </div>
    </div>
  {/each}
</div>
