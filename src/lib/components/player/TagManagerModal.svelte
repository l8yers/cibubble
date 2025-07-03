<script>
  import { supabase } from '$lib/supabaseClient';
  import { TAG_OPTIONS } from '$lib/constants';
  import { createEventDispatcher } from 'svelte';
  import { goto } from '$app/navigation';

  export let open = false;
  export let channelId = null;

  let loading = false;
  let tags = [];
  let tagInput = '';
  let addError = '';
  let saving = false;
  const dispatch = createEventDispatcher();

  // Only show tag options not already in use
  $: availableTagOptions = TAG_OPTIONS.filter(opt => !tags.includes(opt));

  // Dark color palette for tag badges
  const TAG_COLORS = [
    '#254B8B', // dark blue
    '#953553', // dark magenta
    '#296D3F', // deep green
    '#5A2386', // purple
    '#3B3333', // charcoal
    '#DB4B2A', // dark orange-red
    '#008080', // teal
    '#3D3946', // slate
    '#8E562E', // brown
    '#B80028', // deep red
    '#205072', // midnight blue
    '#34495E', // dark grey blue
    '#1E2D3B', // nearly black blue
    '#232526', // blackish
    '#36454F', // onyx
    '#432818', // dark espresso
  ];
  function tagColor(tag) {
    let sum = 0;
    for (let i = 0; i < tag.length; i++) sum += tag.charCodeAt(i);
    return TAG_COLORS[sum % TAG_COLORS.length];
  }

  // Load channel tags (comma separated string)
  async function loadTags() {
    if (!channelId) {
      tags = [];
      return;
    }
    loading = true;

    const { data: chan, error } = await supabase
      .from('channels')
      .select('tags')
      .eq('id', channelId)
      .maybeSingle();

    if (!chan || error) {
      tags = [];
      loading = false;
      return;
    }
    tags = (chan.tags || '')
      .split(',')
      .map(t => t.trim())
      .filter(Boolean);
    loading = false;
  }

  // Load tags when modal is opened and channelId is set
  $: if (open && channelId) loadTags();

  function handleTagInput(e) {
    tagInput = e.target.value;
    addError = '';
  }

  function handleSelectTag(e) {
    tagInput = e.target.value;
    addError = '';
  }

  async function handleAddTag() {
    const tagToAdd = tagInput.trim();
    if (!tagToAdd) {
      addError = "Enter a tag.";
      return;
    }
    if (tags.some(t => t.toLowerCase() === tagToAdd.toLowerCase())) {
      addError = "Tag already added.";
      return;
    }
    saving = true;
    addError = '';

    // Step 1: Update channel tags
    const newTags = [...tags, tagToAdd].join(', ');
    const { error: chanError } = await supabase
      .from('channels')
      .update({ tags: newTags })
      .eq('id', channelId);
    if (chanError) {
      addError = "Failed to add tag to channel. Try again.";
      saving = false;
      return;
    }

    // Step 2: Bulk update all videos for this channel using the new SQL function
    const { error: bulkError } = await supabase.rpc(
      'add_tag_to_channel_videos',
      {
        channel_id_input: channelId,
        tag_input: tagToAdd
      }
    );
    if (bulkError) {
      addError = "Failed to add tag to videos. Try again.";
      saving = false;
      return;
    }

    // Reload tag list & reset input
    tagInput = '';
    saving = false;
    await loadTags();
  }
</script>

{#if open}
  <div class="cb-modal-overlay" on:click={(e) => { if (e.target === e.currentTarget) dispatch('close') }}>
    <div class="cb-modal-content" role="dialog" aria-modal="true">
      <div class="cb-modal-header">
        <h2>Manage Channel Tags</h2>
        <button class="cb-close-btn" on:click={() => dispatch('close')} aria-label="Close">&times;</button>
      </div>

      <div class="cb-section">
        <div class="cb-section-title">Channel Tags</div>
        <div class="cb-tags-row">
          {#if loading}
            <div class="cb-loading">Loading…</div>
          {:else if tags.length === 0}
            <div class="cb-no-tags">No tags assigned</div>
          {:else}
            {#each tags as tagId}
              <a
                class="cb-tag-badge"
                style="background:{tagColor(tagId)};color:#fff;"
                href={"/?tags=" + encodeURIComponent(tagId)}
                on:click|preventDefault={() => goto(`/?tags=${encodeURIComponent(tagId)}`)}
                title="View all videos with this tag"
              >
                {tagId}
              </a>
            {/each}
          {/if}
        </div>
      </div>

      <div class="cb-section cb-section-add">
        <div class="cb-section-title">Add a Tag</div>
        <div class="cb-add-row">
          {#if availableTagOptions.length > 0}
            <select class="cb-tag-select" on:change={handleSelectTag} bind:value={tagInput} disabled={saving}>
              <option value="">Choose Existing…</option>
              {#each availableTagOptions as tag}
                <option value={tag}>{tag}</option>
              {/each}
            </select>
          {:else}
            <span class="cb-no-options" style="color:#b3bad6;">All tag options used</span>
          {/if}
          <span class="cb-add-sep">or</span>
          <input
            type="text"
            class="cb-tag-input"
            placeholder="Create new tag"
            bind:value={tagInput}
            on:input={handleTagInput}
            autocomplete="off"
            spellcheck="false"
            maxlength="32"
            disabled={saving}
          />
          <button class="cb-add-btn" type="button" on:click={handleAddTag} disabled={saving}>
            {saving ? "Adding…" : "Add"}
          </button>
        </div>
        {#if addError}
          <div class="cb-add-error">{addError}</div>
        {/if}
      </div>
    </div>
  </div>
{/if}

<style>
.cb-modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  background: rgba(245,247,251,0.93);
  display: flex;
  align-items: center;
  justify-content: center;
}

.cb-modal-content {
  background: #fff;
  color: #212d41;
  min-width: 340px;
  max-width: 94vw;
  border-radius: 12px;
  box-shadow: 0 6px 28px #e2e5ee99;
  padding: 1.7em 2em 1.4em 2em;
  display: flex;
  flex-direction: column;
  gap: 1.2em;
  font-family: inherit;
  font-size: 1.07em;
}

.cb-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 0.1em;
  border-bottom: 1.5px solid #f1f2f7;
}

.cb-close-btn {
  background: none;
  border: none;
  color: #b0b8c9;
  font-size: 1.6em;
  cursor: pointer;
  border-radius: 6px;
  padding: 0 0.5em;
  transition: background 0.12s, color 0.13s;
}
.cb-close-btn:hover,
.cb-close-btn:focus-visible {
  background: #f3f3fb;
  color: #e14747;
}

.cb-section {
  background: #fafbfc;
  border: 1px solid #f1f2f7;
  border-radius: 9px;
  padding: 1.2em 1.15em 1em 1.15em;
  display: flex;
  flex-direction: column;
  gap: 0.5em;
  margin-bottom: 0.23em;
}

.cb-section-title {
  font-weight: 700;
  font-size: 1.04em;
  color: #222b44;
  margin-bottom: 0.41em;
  letter-spacing: 0.03em;
}

.cb-tags-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5em;
  min-height: 2em;
}

.cb-tag-badge {
  background: #f1f2f6;
  color: #31333b;
  border-radius: 7px;
  padding: 0.33em 0.9em;
  font-size: 0.99em;
  font-weight: 700;
  letter-spacing: 0.01em;
  border: 1.2px solid #e2e4ea;
  box-shadow: 0 1px 4px #dae3fa14;
  margin-bottom: 0.04em;
  text-transform: uppercase;
  text-decoration: none;
  transition: background 0.13s, color 0.13s;
}
.cb-tag-badge[style] { /* Tag badges with inline color (added) */
  border: none !important;
  box-shadow: 0 1px 6px #0002;
  color: #fff !important;
  text-shadow: 0 1px 8px #0003;
}
.cb-tag-badge:hover,
.cb-tag-badge:focus {
  background: #e2e9f5;
  color: #db2e34;
}

.cb-no-tags {
  color: #b0b8c9;
  font-size: 1em;
  padding: 0.53em 0;
  font-weight: 500;
}

.cb-loading {
  color: #9bb2d5;
  font-size: 0.98em;
  padding: 0.5em 0;
}

.cb-section-add {
  background: #f7faff;
  border: 1.2px solid #e3ebf5;
}

.cb-add-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.36em;
  margin-bottom: 0.07em;
}

.cb-tag-select {
  font-size: 1em;
  padding: 0.39em 0.8em;
  border-radius: 8px;
  border: 1.2px solid #d0d4e4;
  background: #fff;
  color: #444;
  font-weight: 500;
  min-width: 9em;
  outline: none;
  transition: border 0.13s;
  max-width: 210px;
}
.cb-tag-select:focus {
  border: 1.5px solid #395edb;
}

.cb-no-options {
  font-size: 0.98em;
  padding: 0.3em 0.5em;
}

.cb-add-sep {
  font-size: 1.02em;
  color: #b3bad6;
  padding: 0 0.13em;
  font-weight: 400;
  user-select: none;
}

.cb-tag-input {
  font-size: 0.99em;
  border-radius: 8px;
  border: 1.2px solid #d0d4e4;
  padding: 0.39em 0.9em;
  background: #fff;
  color: #444;
  font-weight: 500;
  outline: none;
  min-width: 8em;
  transition: border 0.13s;
}
.cb-tag-input:focus {
  border: 1.5px solid #395edb;
}

.cb-add-btn {
  font-size: 0.98em;
  font-weight: 700;
  padding: 0.42em 1.11em;
  border-radius: 8px;
  background: #e14747;
  color: #fff;
  border: none;
  box-shadow: 0 1px 4px #ead7d733;
  cursor: pointer;
  margin-left: 0.12em;
  margin-top: 0.04em;
  transition: background 0.13s;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}
.cb-add-btn:disabled {
  opacity: 0.75;
  cursor: not-allowed;
}
.cb-add-btn:hover,
.cb-add-btn:focus {
  background: #c53b3b;
}

.cb-add-error {
  color: #e14747;
  margin-top: 0.13em;
  font-size: 0.98em;
  font-weight: 500;
  min-height: 1.7em;
}

@media (max-width: 600px) {
  .cb-modal-content {
    min-width: 92vw;
    padding: 1em 0.4em 0.8em 0.4em;
  }
  .cb-section {
    padding: 0.7em 0.2em 0.6em 0.2em;
  }
  .cb-tags-row {
    min-height: 1.4em;
  }
}
</style>
