<script>
  // All filter chip props and events
  export let filterChips = [];
  export let showReset = true;

  // Reset event
  export let onReset = () => {};

  // Each chip clear event
  export let onClearChip = (chip) => {};

  // Import your FilterChip component
  import FilterChip from './FilterChip.svelte';
</script>

<div class="chips-row">
  {#each filterChips as chip}
    <FilterChip
      type={chip.type}
      label={chip.label}
      value={chip.value}
      clearClass={chip.clearClass}
      onClear={() => onClearChip(chip)}
    />
  {/each}
  {#if showReset}
    <a
      href="#"
      class="reset-filters-link"
      on:click|preventDefault={onReset}
      >Reset filters</a
    >
  {/if}
</div>

<style>
.chips-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.38em;
  margin: 1.1em 0 1.4em 0;
  padding: 0;
}
.reset-filters-link {
  color: #d3212c;
  font-weight: 600;
  background: none;
  border: none;
  font-size: 1em;
  cursor: pointer;
  margin-left: 1.2em;
  padding: 0;
  box-shadow: none;
  border-radius: 0;
  letter-spacing: 0.02em;
  transition: color 0.14s;
}
.reset-filters-link:hover,
.reset-filters-link:focus {
  color: #a11a22;
}
@media (max-width: 700px) {
  .chips-row {
    gap: 0.18em;
    margin: 0.25em;
  }
  .reset-filters-link {
    font-size: 0.92em;
    margin-left: 0.44em;
    font-weight: 500;
  }
}
</style>
