<script>
  import { user } from '$lib/stores/user.js';
  import { get } from 'svelte/store';

  let form = {
    date: new Date().toISOString().slice(0,10),
    hours: "",
    minutes: "",
    comment: ""
  };
  let error = "";
  let submitting = false;
  let success = "";
  let debugUserId = "";

  function resetForm() {
    form = {
      date: new Date().toISOString().slice(0,10),
      hours: "",
      minutes: "",
      comment: ""
    };
    error = "";
    submitting = false;
    success = "";
    debugUserId = "";
  }

  async function submitManualEntry() {
    error = "";
    success = "";
    submitting = true;

    // Get the current logged-in user
    const currentUser = get(user);
    if (!currentUser) {
      error = "You must be logged in!";
      submitting = false;
      return;
    }
    const userId = currentUser.id;
    debugUserId = userId;

    // Check basic form
    if (!form.date || ((!form.hours || +form.hours === 0) && (!form.minutes || +form.minutes === 0))) {
      error = "Please enter a date and at least some time.";
      submitting = false;
      return;
    }

    const seconds = (+form.hours || 0) * 3600 + (+form.minutes || 0) * 60;

    // Upload to your API endpoint (update if you use a different endpoint)
    const res = await fetch('/api/addManualSession', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        date: form.date,
        seconds,
        comment: form.comment,
        user_id: userId
      })
    });
    let data;
    try {
      data = await res.json();
    } catch (e) {
      error = "Server did not respond with JSON";
      submitting = false;
      return;
    }

    if (!res.ok || data.error) {
      error = data?.error || "Failed to add session.";
      submitting = false;
      return;
    }
    resetForm();
    success = "Session added!";
    if (typeof $$props.onAdded === "function") $$props.onAdded();
  }
</script>

<form class="manual-time-form" on:submit|preventDefault={submitManualEntry}>
  <label>Date
    <input type="date" bind:value={form.date} required>
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
  {#if success}<div class="form-success">{success}</div>{/if}
  {#if debugUserId}
    <div class="debug">User ID: <span style="font-family:monospace;">{debugUserId}</span></div>
  {/if}
  <div class="manual-btn-row">
    <button type="submit" disabled={submitting}>Add Time</button>
    <button type="button" on:click={resetForm}>Cancel</button>
  </div>
</form>

<style>
.manual-time-form {
  background: #fff;
  border-radius: 14px;
  padding: 1.4em 1.8em 1.2em 1.8em;
  margin: 0.7em 0 1.4em 0;
  box-shadow: 0 1px 4px #e2e2e733;
  max-width: 440px;
}
.manual-time-form label {
  display: block;
  margin-bottom: 0.7em;
  font-size: 1em;
  color: #555;
}
.manual-time-form input[type="date"],
.manual-time-form input[type="number"],
.manual-time-form textarea {
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
.manual-time-form textarea {
  min-height: 32px;
  max-height: 80px;
  resize: vertical;
}
.manual-btn-row {
  margin-top: 1em;
  display: flex;
  gap: 0.7em;
}
.manual-time-form button[type="submit"] {
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
.manual-time-form button[type="submit"]:hover {
  background: #b8271b;
}
.manual-time-form button[type="button"] {
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
.manual-time-form button[type="button"]:hover {
  background: #eaeaea;
  color: #e93c2f;
}
.form-error {
  color: #d12f19;
  margin-bottom: 1em;
}
.form-success {
  color: #26890d;
  margin-bottom: 1em;
}
.debug {
  margin: 0.7em 0 0.3em 0;
  font-size: 0.95em;
  color: #b3a100;
  background: #fff8d1;
  padding: 0.4em 1em;
  border-radius: 7px;
}
</style>
