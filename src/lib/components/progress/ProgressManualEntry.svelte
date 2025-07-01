<script>
  import { user } from '$lib/stores/user.js';
  import { supabase } from '$lib/supabaseClient';
  import { get } from 'svelte/store';

  export let onAdded = () => {};
  export let onCancel; // <-- use this for closing the modal

  const SENTINEL_DATE = '1975-01-01';

  let form = {
    date: new Date().toISOString().slice(0,10),
    hours: "",
    minutes: "",
    comment: ""
  };
  let useNoDate = false;
  let error = "";
  let submitting = false;
  let success = "";

  function resetForm() {
    form = {
      date: new Date().toISOString().slice(0,10),
      hours: "",
      minutes: "",
      comment: ""
    };
    useNoDate = false;
    error = "";
    submitting = false;
    success = "";
  }

  async function submitManualEntry() {
    error = "";
    success = "";
    submitting = true;

    const currentUser = get(user);
    if (!currentUser) {
      error = "You must be logged in!";
      submitting = false;
      return;
    }
    const userId = currentUser.id;

    // Validation
    if ((!useNoDate && !form.date) || ((!form.hours || +form.hours === 0) && (!form.minutes || +form.minutes === 0))) {
      error = "Please enter a date (or select 'No date') and at least some time.";
      submitting = false;
      return;
    }

    const seconds = (+form.hours || 0) * 3600 + (+form.minutes || 0) * 60;
    const insertDate = useNoDate ? SENTINEL_DATE : form.date;

    const { error: insertError } = await supabase.from('watch_sessions').insert([{
      user_id: userId,
      seconds,
      date: insertDate,
      source: form.comment
    }]);

    if (insertError) {
      error = insertError.message || "Failed to add session.";
      submitting = false;
      return;
    }
    resetForm();
    success = "Session added!";
    if (typeof onAdded === "function") onAdded();
    submitting = false;
    if (typeof onCancel === "function") onCancel(); // Close after add
  }
</script>

<form class="manual-edit-form" on:submit|preventDefault={submitManualEntry} autocomplete="off">
  <div class="form-title-row">
    <span>Add Outside Time Entry</span>
    <button
      type="button"
      class="close-x-btn"
      aria-label="Close"
      on:click={() => { if (onCancel) onCancel(); }}>
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
    <textarea rows="2" bind:value={form.comment} placeholder="E.g. Dreaming Spanish, podcast…"></textarea>
  </label>
  {#if error}<div class="form-error">{error}</div>{/if}
  {#if success}<div class="form-success">{success}</div>{/if}
  <div class="manual-btn-row">
    <button type="submit" disabled={submitting}>Add Time</button>
    <button type="button" on:click={() => { resetForm(); if (onCancel) onCancel(); }}>Cancel</button>
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
  margin-top: 0.4em;
  font-size: 1em;
  padding: 0.5em 0.8em;
  border: 1px solid #ececec;
  border-radius: 8px;
  background: #fafafa;
  margin-bottom: 0.7em;
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
  min-height: 32px;
  max-height: 80px;
  resize: vertical;
}
.manual-btn-row {
  margin-top: 1em;
  display: flex;
  gap: 0.7em;
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
  margin-bottom: 1em;
}
.form-success {
  color: #26890d;
  margin-bottom: 1em;
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
