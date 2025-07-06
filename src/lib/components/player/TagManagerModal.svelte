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

  $: availableTagOptions = TAG_OPTIONS.filter(opt => !tags.includes(opt));
  const TAG_COLORS = [
    '#254B8B','#953553','#296D3F','#5A2386','#3B3333','#DB4B2A',
    '#008080','#3D3946','#8E562E','#B80028','#205072','#34495E',
    '#1E2D3B','#232526','#36454F','#432818'
  ];
  function tagColor(tag) {
    let sum = 0;
    for (let i = 0; i < tag.length; i++) sum += tag.charCodeAt(i);
    return TAG_COLORS[sum % TAG_COLORS.length];
  }
  async function loadTags() {
    if (!channelId) { tags = []; return; }
    loading = true;
    const { data: chan, error } = await supabase
      .from('channels').select('tags').eq('id', channelId).maybeSingle();
    if (!chan || error) { tags = []; loading = false; return; }
    tags = (chan.tags || '').split(',').map(t => t.trim()).filter(Boolean);
    loading = false;
  }
  $: if (open && channelId) loadTags();
  function handleTagInput(e) { tagInput = e.target.value; addError = ''; }
  function handleSelectTag(e) { tagInput = e.target.value; addError = ''; }
  async function handleAddTag() {
    const tagToAdd = tagInput.trim();
    if (!tagToAdd) { addError = "Enter a tag."; return; }
    if (tags.some(t => t.toLowerCase() === tagToAdd.toLowerCase())) {
      addError = "Tag already added."; return;
    }
    saving = true; addError = '';
    const newTags = [...tags, tagToAdd].join(', ');
    const { error: chanError } = await supabase
      .from('channels').update({ tags: newTags }).eq('id', channelId);
    if (chanError) { addError = "Failed to add tag to channel. Try again."; saving = false; return; }
    const { error: bulkError } = await supabase.rpc('add_tag_to_channel_videos', {
      channel_id_input: channelId, tag_input: tagToAdd
    });
    if (bulkError) { addError = "Failed to add tag to videos. Try again."; saving = false; return; }
    tagInput = ''; saving = false; await loadTags();
  }
</script>

{#if open}
  <div class="cb-modal-overlay" on:click={(e) => { if (e.target === e.currentTarget) dispatch('close') }}>
    <form class="cb-modal-content tag-modal" role="dialog" aria-modal="true" on:submit|preventDefault={handleAddTag}>
      <div class="cb-modal-header">
        <div class="tag-modal-title">Manage Channel Tags</div>
        <button class="cb-close-btn" type="button" on:click={() => dispatch('close')} aria-label="Close">&times;</button>
      </div>

      <div class="tag-section">
        <div class="tag-label">Channel Tags</div>
        <div class="tag-badge-list">
          {#if loading}
            <div class="tag-loading">Loading…</div>
          {:else if tags.length === 0}
            <div class="tag-empty">No tags assigned</div>
          {:else}
            {#each tags as tagId}
              <a
                class="tag-badge"
                style="background:{tagColor(tagId)}"
                href={"/?tags=" + encodeURIComponent(tagId)}
                on:click|preventDefault={() => goto(`/?tags=${encodeURIComponent(tagId)}`)}
                title="View all videos with this tag"
              >{tagId}</a>
            {/each}
          {/if}
        </div>
      </div>

      <div class="tag-section tag-add-section">
        <div class="tag-label">Add a Tag</div>
        <div class="tag-add-row">
          <select class="tag-select" on:change={handleSelectTag} bind:value={tagInput} disabled={saving}>
            <option value="">Choose Existing…</option>
            {#each availableTagOptions as tag}
              <option value={tag}>{tag}</option>
            {/each}
          </select>
          <span class="tag-add-sep">or</span>
          <input
            type="text"
            class="tag-input"
            placeholder="Create new tag"
            bind:value={tagInput}
            on:input={handleTagInput}
            autocomplete="off"
            spellcheck="false"
            maxlength="32"
            disabled={saving}
          />
        </div>
        <button class="tag-add-btn" type="submit" disabled={saving}>
          {saving ? "Adding…" : "Add"}
        </button>
        {#if addError}
          <div class="tag-add-error">{addError}</div>
        {/if}
      </div>
    </form>
  </div>
{/if}

<style>
.cb-modal-overlay {
  position: fixed; inset: 0; z-index: 1000;
  background: rgba(24,24,30,0.47);
  display: flex; align-items: center; justify-content: center;
}
.cb-modal-content.tag-modal {
  background: #fff;
  color: #101720;
  min-width: 330px;
  max-width: 94vw;
  border-radius: 18px;
  box-shadow: 0 4px 32px #0002, 0 2px 8px #e93c2f10;
  padding: 2em 2em 1.5em 2em;
  display: flex;
  flex-direction: column;
  gap: 1.4em;
  font-family: inherit;
  font-size: 1.09em;
  margin: 0 0.7em;
  border: 1.5px solid #ededf3;
}
.cb-modal-header {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 0.3em;
}
.tag-modal-title {
  font-weight: 700; font-size: 1.19em; color: #e93c2f; letter-spacing: 0.02em;
}
.cb-close-btn {
  background: none; border: none; color: #e93c2f;
  font-size: 1.6em; cursor: pointer; border-radius: 50%;
  padding: 0 0.42em;
  transition: background 0.12s, color 0.13s;
}
.cb-close-btn:hover, .cb-close-btn:focus-visible {
  background: #fff6f6; color: #b8271b; outline: none;
}
.tag-section {
  background: #fafbfc;
  border-radius: 12px;
  border: 1px solid #ededf3;
  padding: 1.18em 1.2em 1em 1.2em;
  display: flex; flex-direction: column; gap: 0.54em;
  margin-bottom: 0.17em;
}
.tag-label {
  font-weight: 600;
  font-size: 1.05em;
  color: #212d41;
  margin-bottom: 0.25em;
  letter-spacing: 0.01em;
}
.tag-badge-list {
  display: flex; flex-wrap: wrap; gap: 0.5em; min-height: 2.2em;
}
.tag-badge {
  display: inline-block;
  background: #e3e3e3;
  color: #fff;
  border-radius: 5px;         /* NOT a pill, subtle rounding */
  padding: 0.32em 1em;
  font-size: 1em;
  font-weight: 600;
  letter-spacing: 0.03em;
  margin-bottom: 0.1em;
  text-transform: uppercase;
  text-decoration: none;
  box-shadow: 0 1px 6px #0001;
  transition: background 0.13s, color 0.13s;
  outline: none;
  border: none;
}
.tag-badge:hover, .tag-badge:focus {
  opacity: 0.94;
  filter: brightness(1.06) saturate(1.2);
}
.tag-loading, .tag-empty {
  color: #b0b8c9;
  font-size: 1em;
  font-weight: 500;
  padding: 0.53em 0;
}
.tag-add-section {
  background: #f9f6fa;
  border: 1.2px solid #f3e4ec;
}
.tag-add-row {
  display: flex; flex-wrap: wrap;
  align-items: stretch; gap: 0.5em; margin-bottom: 0.55em;
}
.tag-select, .tag-input {
  font-size: 1em;
  padding: 0.65em 1em;
  border-radius: 7px;
  border: 1.3px solid #e1e5ec;
  background: #fff;
  color: #212d41;
  font-weight: 500;
  outline: none;
  min-width: 7.5em;
  max-width: 240px;
  margin-bottom: 0.06em;
  transition: border 0.13s;
}
.tag-select:focus, .tag-input:focus {
  border: 1.7px solid #e93c2f;
}
.tag-add-sep {
  font-size: 1em; color: #b3bad6;
  padding: 0 0.19em; font-weight: 500; user-select: none;
}
.tag-add-btn {
  width: 100%;
  margin-top: 0.15em;
  padding: 0.78em 0;
  border-radius: 8px;
  background: linear-gradient(90deg, #e93c2f 35%, #f35b36 90%);
  color: #fff;
  font-size: 1.04em;
  font-weight: 700;
  border: none;
  box-shadow: 0 1px 4px #ead7d733;
  cursor: pointer;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  transition: background 0.12s;
}
.tag-add-btn:disabled {
  opacity: 0.75; cursor: not-allowed;
}
.tag-add-btn:hover, .tag-add-btn:focus {
  background: #cc3329;
}
.tag-add-error {
  color: #e14747;
  margin-top: 0.13em;
  font-size: 0.99em;
  font-weight: 500;
  min-height: 1.3em;
}

/* --------- MOBILE ----------- */
@media (max-width: 600px) {
  .cb-modal-content.tag-modal {
    min-width: 97vw;
    max-width: 99vw;
    border-radius: 11px;
    padding: 1.09em 0.82em 1.1em 0.82em;
    font-size: 0.96em;
    gap: 1.1em;
  }
  .cb-modal-header {
    margin-bottom: 0.09em;
  }
  .tag-modal-title {
    font-size: 1em;
  }
  .cb-close-btn {
    font-size: 1.19em; padding: 0 0.41em; border-radius: 8px;
  }
  .tag-section {
    padding: 1.09em 0.77em 0.99em 0.77em;
    border-radius: 6px;
    font-size: 0.98em;
    margin-bottom: 0.15em;
    gap: 0.6em;
  }
  .tag-label {
    font-size: 0.95em; margin-bottom: 0.15em;
  }
  .tag-badge-list {
    gap: 0.19em; min-height: 1.12em;
  }
  .tag-badge {
    padding: 0.34em 0.74em;
    font-size: 0.92em;
    border-radius: 5px;      /* less round on mobile too */
    margin-bottom: 0.05em;
  }
  .tag-add-row {
    gap: 0.25em; margin-bottom: 0.16em; flex-direction: column;
  }
  .tag-select, .tag-input {
    font-size: 0.94em; padding: 0.66em 1.04em;
    border-radius: 6px; min-width: 96%; max-width: 100%;
  }
  .tag-add-btn {
    margin-top: 0.11em;
    padding: 0.56em 0;
    font-size: 0.98em;
    border-radius: 7px;
    width: 100%;
  }
  .tag-add-error {
    font-size: 0.95em; min-height: 1.1em;
  }
}
</style>
