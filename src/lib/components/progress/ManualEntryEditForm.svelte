<script>
  import { createEventDispatcher } from 'svelte';
  export let entry = {};
  export let SENTINEL_DATE = '1975-01-01';
  export let onCancel;
  const dispatch = createEventDispatcher();

  let form = {
    date: entry.date === SENTINEL_DATE ? "" : entry.date,
    hours: entry.totalSeconds ? Math.floor(entry.totalSeconds / 3600) : "",
    minutes: entry.totalSeconds ? Math.round((entry.totalSeconds % 3600) / 60) : "",
    comment: entry.source || ""
  };
  let useNoDate = entry.date === SENTINEL_DATE;
  let error = "";
  let submitting = false;

  function handleSubmit(e) {
    e.preventDefault();
    if ((!useNoDate && !form.date) || ((!form.hours || +form.hours === 0) && (!form.minutes || +form.minutes === 0))) {
      error = "Please enter a date (or select 'No date') and at least some time.";
      return;
    }
    error = "";
    submitting = true;
    const seconds = (+form.hours || 0) * 3600 + (+form.minutes || 0) * 60;
    dispatch('submit', {
      ...entry,
      date: useNoDate ? SENTINEL_DATE : form.date,
      totalSeconds: seconds,
      source: form.comment
    });
    submitting = false;
  }
</script>

<form class="manual-edit-form" on:submit={handleSubmit} autocomplete="off">
  <div class="form-title-row">
    <span>Edit Outside Time Entry</span>
    <button
      type="button"
      class="close-x-btn"
      aria-label="Close"
      on:click={() => { if (onCancel) onCancel(); dispatch('cancel'); }}>
      ×
    </button>
  </div>
  <label>Date
    <input type="date" bind:value={form.date} required={!useNoDate} disabled={useNoDate} />
  </label>
  <label class="no-date-checkbox">
    <input type="checkbox" bind:checked={useNoDate} />
    No date / Don't show on calendar
  </label>
  <label>Hours
    <input type="number" min="0" bind:value={form.hours} placeholder="0" />
  </label>
  <label>Minutes
    <input type="number" min="0" max="59" bind:value={form.minutes} placeholder="0" />
  </label>
  <label>Comments/Source (optional)
    <textarea rows="2" bind:value={form.comment} placeholder="E.g. Dreaming Spanish, podcast…" />
  </label>
  {#if error}<div class="form-error">{error}</div>{/if}
  <div class="manual-btn-row">
    <button type="submit" disabled={submitting}>Save</button>
    <button type="button" on:click={() => { if (onCancel) onCancel(); dispatch('cancel'); }}>Cancel</button>
  </div>
</form>

<style>
.manual-edit-form {
  background: #fff;
  border-radius: 18px;
  padding: 2em 2.2em 1.7em 2.2em;
  margin: 1.2em 0 2em 0;
  box-shadow: 0 2px 18px #e2e2e722, 0 1.5px 7px #ffeaea15;
  max-width: 440px;
  min-width: 260px;
  font-family: inherit;
  position: relative;
  transition: box-shadow 0.18s;
}
.form-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 1.15em;
  font-weight: 800;
  color: #e93c2f;
  margin-bottom: 1.2em;
  letter-spacing: 0.01em;
}
.close-x-btn {
  background: none;
  border: none;
  color: #e93c2f;
  font-size: 1.6em;
  font-weight: 400;
  line-height: 1;
  border-radius: 50%;
  padding: 0.06em 0.45em 0.11em 0.45em;
  cursor: pointer;
  transition: background 0.13s, color 0.13s;
  margin-left: 0.35em;
  margin-top: -0.16em;
}
.close-x-btn:hover, .close-x-btn:focus {
  background: #fff6f6;
  color: #b8271b;
  outline: none;
}
.manual-edit-form label {
  display: block;
  margin-bottom: 0.7em;
  font-size: 1em;
  color: #444e69;
  font-weight: 600;
  letter-spacing: 0.01em;
}
.no-date-checkbox {
  margin-bottom: 1em;
  font-weight: 500;
  font-size: 0.99em;
  color: #7a7a7a;
  display: flex;
  align-items: center;
  gap: 0.5em;
  user-select: none;
}
.manual-edit-form input[type="date"],
.manual-edit-form input[type="number"],
.manual-edit-form textarea {
  width: 100%;
  margin-top: 0.32em;
  font-size: 1em;
  padding: 0.52em 0.87em;
  border: 1.5px solid #f5d8d8;
  border-radius: 8px;
  background: #fdf9f9;
  margin-bottom: 0.75em;
  color: #181818;
  font-family: inherit;
  transition: border 0.13s;
}
.manual-edit-form input[type="date"]:focus,
.manual-edit-form input[type="number"]:focus,
.manual-edit-form textarea:focus {
  border-color: #e93c2f;
  outline: none;
  background: #fff;
}
.manual-edit-form textarea {
  min-height: 38px;
  max-height: 120px;
  resize: vertical;
}
.manual-btn-row {
  margin-top: 1.18em;
  display: flex;
  gap: 0.9em;
  justify-content: flex-end;
}
.manual-edit-form button[type="submit"] {
  background: linear-gradient(120deg, #e93c2f 70%, #ffb3ac 120%);
  color: #fff;
  border: none;
  border-radius: 8px;
  font-weight: 700;
  font-size: 1.09em;
  padding: 0.66em 2.1em;
  cursor: pointer;
  transition: background 0.18s, color 0.16s;
  box-shadow: 0 1px 2px #e2e2e722;
  letter-spacing: 0.01em;
}
.manual-edit-form button[type="submit"]:hover,
.manual-edit-form button[type="submit"]:focus {
  background: #b8271b;
  color: #fff;
  outline: none;
}
.manual-edit-form button[type="button"] {
  background: #f6f6f6;
  color: #7a7a7a;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 1.04em;
  padding: 0.66em 1.5em;
  cursor: pointer;
  transition: background 0.14s, color 0.14s;
  letter-spacing: 0.01em;
}
.manual-edit-form button[type="button"]:hover,
.manual-edit-form button[type="button"]:focus {
  background: #fff3f1;
  color: #e93c2f;
  outline: none;
}
.form-error {
  color: #d12f19;
  font-size: 1.01em;
  margin-bottom: 1em;
  margin-top: 0.4em;
  text-align: left;
}
@media (max-width: 500px) {
  .manual-edit-form {
    padding: 1.1em 0.5em 1em 0.5em;
    max-width: 99vw;
    min-width: 0;
    border-radius: 9px;
  }
  .form-title-row {
    font-size: 1em;
    margin-bottom: 0.8em;
  }
  .manual-btn-row {
    flex-direction: column;
    gap: 0.5em;
  }
}
</style>
