<script>
  export let entry = {};
  export let SENTINEL_DATE = '1975-01-01';
  export let onSubmit;
  export let onCancel;
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
    onSubmit({
      ...entry,
      date: useNoDate ? SENTINEL_DATE : form.date,
      totalSeconds: seconds,
      source: form.comment
    });
    submitting = false;
  }
</script>

<form class="manual-edit-form" on:submit={handleSubmit}>
  <label>Date
    <input type="date" bind:value={form.date} required={!useNoDate} disabled={useNoDate}>
  </label>
  <label class="no-date-checkbox">
    <input type="checkbox" bind:checked={useNoDate}>
    No date / Don't show on calendar
  </label>
  <label>Hours
    <input type="number" min="0" bind:value={form.hours} placeholder="0">
  </label>
  <label>Minutes
    <input type="number" min="0" max="59" bind:value={form.minutes} placeholder="0">
  </label>
  <label>Comments/Source (optional)
    <textarea rows="2" bind:value={form.comment} placeholder="E.g. Dreaming Spanish, podcast…"></textarea>
  </label>
  {#if error}<div class="form-error">{error}</div>{/if}
  <div class="manual-btn-row">
    <button type="submit" disabled={submitting}>Save</button>
    <button type="button" on:click={onCancel}>Cancel</button>
  </div>
</form>

<style>
.manual-edit-form {
  background: #fff;
  border-radius: 14px;
  padding: 1.4em 1.8em 1.2em 1.8em;
  margin: 0.7em 0 1.4em 0;
  box-shadow: 0 1px 4px #e2e2e733;
  max-width: 440px;
}
.manual-edit-form label {
  display: block;
  margin-bottom: 0.7em;
  font-size: 1em;
  color: #555;
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
  margin-top: 0.4em;
  font-size: 1em;
  padding: 0.5em 0.8em;
  border: 1px solid #ececec;
  border-radius: 8px;
  background: #fafafa;
  margin-bottom: 0.7em;
  color: #181818;
}
.manual-edit-form textarea {
  min-height: 32px;
  max-height: 80px;
  resize: vertical;
}
.manual-btn-row {
  margin-top: 1em;
  display: flex;
  gap: 0.7em;
}
.manual-edit-form button[type="submit"] {
  background: #e93c2f;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 1.07em;
  padding: 0.6em 1.7em;
  cursor: pointer;
  transition: background 0.18s;
}
.manual-edit-form button[type="submit"]:hover {
  background: #b8271b;
}
.manual-edit-form button[type="button"] {
  background: #f6f6f6;
  color: #7a7a7a;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  font-size: 1em;
  padding: 0.6em 1.1em;
  cursor: pointer;
  transition: background 0.15s, color 0.14s;
}
.manual-edit-form button[type="button"]:hover {
  background: #eaeaea;
  color: #e93c2f;
}
.form-error {
  color: #d12f19;
  margin-bottom: 1em;
}
</style>
