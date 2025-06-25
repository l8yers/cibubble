<script>
  export let video;
  export let utils;
</script>

<div class="player-meta-row">
  <span
    class="player-diff-badge"
    style="background: {utils.difficultyColor(video.level)};"
  >
    {utils.difficultyLabel(video.level)}
  </span>
  {#if video.length}
    <span class="player-duration">{utils.formatLength(video.length)}</span>
  {/if}
</div>

<style>
.player-meta-row {
  display: flex;
  align-items: center;
  gap: 1em;
  font-size: 1.04em;
  color: #888;
  margin-bottom: 1.1rem;
}
.player-diff-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 38px;
  height: 30px;
  font-size: 0.99em;
  font-weight: 700;
  padding: 0 1em;
  border-radius: 8px;
  color: #fff;
  background: var(--diff-color, #bbb);
  border: 2px solid #fff;
  letter-spacing: 0.01em;
  box-shadow: 0 1px 6px #0001;
  white-space: nowrap;
  margin-right: 0.65em;
  text-shadow: 0 1px 3px #0002;
  transition: box-shadow 0.13s;
}
.player-channel {
  font-size: 1.01em;
  color: #3c68ad;
  font-weight: 500;
  max-width: 160px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.player-duration {
  font-size: 0.99em;
  color: #adadad;
  margin-left: auto;
}
</style>
