<script>
  import { user } from '$lib/stores/user.js';
  import { supabase } from '$lib/supabaseClient';
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

    // Validation
    if (!form.date || ((!form.hours || +form.hours === 0) && (!form.minutes || +form.minutes === 0))) {
      error = "Please enter a date and at least some time.";
      submitting = false;
      return;
    }

    const seconds = (+form.hours || 0) * 3600 + (+form.minutes || 0) * 60;

    // Insert directly into Supabase from client (not via API endpoint)
    const { error: insertError } = await supabase.from('watch_sessions').insert([{
      user_id: userId,
      seconds,
      date: form.date,
      comment: form.comment
    }]);

    if (insertError) {
      error = insertError.message || "Failed to add session.";
      submitting = false;
      return;
    }
    resetForm();
    success = "Session added!";
    if (typeof $$props.onAdded === "function") $$props.onAdded();
    submitting = false;
  }
</script>
