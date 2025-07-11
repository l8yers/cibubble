<script>
  import { user } from '$lib/stores/user.js';
  import { goto } from '$app/navigation';
  import { supabase } from '$lib/supabaseClient';

  let email = '';
  let newEmail = '';
  let newPassword = '';
  let message = '';

  // Delete account modal state
  let showDeleteModal = false;
  let deleteConfirmInput = '';
  let deleteError = '';
  let deleting = false;

  $: email = $user?.email ?? '';

  async function updateEmail() {
    message = '';
    if (!newEmail) {
      message = 'Please enter a new email address.';
      return;
    }
    const { error } = await supabase.auth.updateUser({ email: newEmail });
    if (error) {
      message = `Failed to update email: ${error.message}`;
    } else {
      message = 'Check your new email inbox to confirm the change.';
      newEmail = '';
    }
  }

  async function updatePassword() {
    message = '';
    if (!newPassword) {
      message = 'Please enter a new password.';
      return;
    }
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      message = `Failed to update password: ${error.message}`;
    } else {
      message = 'Password updated.';
      newPassword = '';
    }
  }

  function back() {
    goto('/');
  }

  async function handleDeleteAccount() {
    deleteError = '';
    deleting = true;
    // Optionally: remove all user-related data from DB here

    const { error } = await supabase.auth.signOut();
    if (error) {
      deleteError = "Error signing out: " + error.message;
      deleting = false;
      return;
    }
    // Actually delete the user from Supabase Auth
    const res = await fetch('/api/delete-user', { method: 'POST', credentials: 'include' });
    if (!res.ok) {
      deleteError = 'Error deleting account. Please try again later.';
      deleting = false;
      return;
    }
    // Done
    deleting = false;
    goto('/');
  }

  function openDeleteModal() {
    showDeleteModal = true;
    deleteConfirmInput = '';
    deleteError = '';
  }

  function closeDeleteModal() {
    showDeleteModal = false;
    deleteConfirmInput = '';
    deleteError = '';
  }

  $: deleteAllowed =
    deleteConfirmInput.trim().toLowerCase() === 'delete account';
</script>

<div class="settings-page">
  <div class="settings-header-row">
    <div class="section-title">Account Settings</div>
    <a class="settings-link" on:click={back} tabindex="0">← Back</a>
  </div>
  <div class="profile-row">
    <span class="profile-label">Email:</span>
    <span class="profile-email">{email}</span>
  </div>
  <div class="form-row">
    <input
      type="email"
      bind:value={newEmail}
      placeholder="New email"
      autocomplete="email"
    />
    <button class="change-btn" on:click={updateEmail}>Change Email</button>
  </div>
  <div class="form-row">
    <input
      type="password"
      bind:value={newPassword}
      placeholder="New password"
      autocomplete="new-password"
    />
    <button class="change-btn" on:click={updatePassword}>Change Password</button>
  </div>
  <div class="message">{message}</div>

  <div class="delete-row">
    <button class="delete-btn" type="button" on:click={openDeleteModal}>
      Delete Account
    </button>
  </div>
</div>

{#if showDeleteModal}
  <div class="modal-backdrop">
    <div class="modal">
      <div class="modal-title">Delete Account</div>
      <div class="modal-desc">
        <p>
          Are you sure you want to permanently delete your account? <b>This cannot be undone.</b>
        </p>
        <p>
          To confirm, type <code>delete account</code> below.
        </p>
      </div>
      <input
        class="delete-confirm-input"
        type="text"
        placeholder="Type: delete account"
        bind:value={deleteConfirmInput}
        autocomplete="off"
        disabled={deleting}
      />
      {#if deleteError}
        <div class="modal-error">{deleteError}</div>
      {/if}
      <div class="modal-actions">
        <button on:click={closeDeleteModal} type="button" disabled={deleting}>Cancel</button>
        <button
          class="delete-btn"
          type="button"
          disabled={!deleteAllowed || deleting}
          on:click={handleDeleteAccount}
        >
          {deleting ? 'Deleting…' : 'Delete Account'}
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
:root {
  --cibubble-red: #e93c2f;
  --cibubble-red-dark: #b8271b;
  --cibubble-accent: #fff6f5;
  --cibubble-shadow: 0 2px 16px #ececec20;
  --cibubble-radius: 15px;
}

.settings-page {
  max-width: 410px;
  width: 100%;
  margin: 0 auto;
  margin-top: 3.5em;
  background: #fff;
  padding: 2.3em 2.0em 2.1em 2.0em;
  border-radius: var(--cibubble-radius);
  box-shadow: var(--cibubble-shadow);
  display: flex;
  flex-direction: column;
  gap: 0.7em;
}
.settings-header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.2em;
}
.section-title {
  color: #101010;
  font-size: 1.32rem;
  font-weight: 800;
  letter-spacing: 0.2px;
  margin-bottom: 0.1em;
}
.settings-link {
  color: #2562e9;
  font-size: 1.07em;
  text-decoration: none;
  font-weight: 500;
  cursor: pointer;
  border-radius: 7px;
  padding: 0.11em 0.56em;
  transition: color 0.14s, background 0.13s;
}
.settings-link:hover, .settings-link:focus {
  color: var(--cibubble-red);
  background: var(--cibubble-accent);
  text-decoration: underline;
  outline: 1.5px solid var(--cibubble-red);
}
.profile-row {
  display: flex;
  align-items: center;
  font-size: 1.07em;
  background: var(--cibubble-accent);
  border-radius: 7px;
  padding: 0.52em 1em;
  margin-bottom: 0.6em;
  font-weight: 500;
  gap: 0.45em;
}
.profile-label {
  color: var(--cibubble-red);
  margin-right: 0.22em;
  font-weight: 600;
}
.profile-email {
  word-break: break-all;
  color: #444;
  font-weight: 500;
}
.form-row {
  display: flex;
  flex-direction: column;
  gap: 0.18em;
  margin-bottom: 0.5em;
}
input[type='email'],
input[type='password'] {
  width: 100%;
  padding: 0.75em 1em;
  font-size: 1.05rem;
  border: 1.2px solid #ececec;
  border-radius: 8px;
  background: #fafafa;
  color: #232323;
  margin-bottom: 0.5em;
  outline: none;
  transition: border 0.13s, box-shadow 0.13s;
}
input:focus {
  border: 1.5px solid var(--cibubble-red);
  box-shadow: 0 2px 7px #e93c2f13;
  background: #fff9f7;
}
.change-btn {
  width: 100%;
  padding: 0.78em 0;
  font-size: 1.04rem;
  background: var(--cibubble-red);
  color: #fff;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 700;
  margin-bottom: 0.35em;
  margin-top: 0.05em;
  box-shadow: 0 1.5px 7px #e93c2f18;
  transition: background 0.18s, box-shadow 0.14s;
}
.change-btn:hover, .change-btn:focus {
  background: var(--cibubble-red-dark);
  outline: 1.5px solid #b8271b;
}
.message {
  color: #26890d;
  min-height: 1.5em;
  font-size: 1.05em;
  font-weight: 500;
  letter-spacing: 0.01em;
  margin-top: 0.2em;
}
.delete-row {
  margin-top: 1.8em;
  display: flex;
  justify-content: center;
}
.delete-btn {
  background: var(--cibubble-red);
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 1.04rem;
  font-weight: 700;
  padding: 0.75em 2em;
  cursor: pointer;
  transition: background 0.19s, box-shadow 0.14s;
  box-shadow: 0 1.5px 7px #e93c2f18;
}
.delete-btn:disabled {
  background: #ccc;
  color: #fff;
  cursor: not-allowed;
  opacity: 0.67;
}
.delete-btn:hover, .delete-btn:focus {
  background: var(--cibubble-red-dark);
  outline: 1.5px solid #b8271b;
}

.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(30,40,60, 0.20);
  z-index: 4000;
  display: flex;
  align-items: center;
  justify-content: center;
}
.modal {
  background: #fff;
  border-radius: 12px;
  padding: 2.1em 1.6em 1.45em 1.6em;
  box-shadow: 0 4px 30px #e93c2f22;
  max-width: 330px;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 0.7em;
}
.modal-title {
  font-size: 1.21em;
  font-weight: 700;
  color: var(--cibubble-red);
  margin-bottom: 0.21em;
}
.modal-desc {
  font-size: 1.04em;
  color: #232323;
  margin-bottom: 0.38em;
}
.delete-confirm-input {
  width: 100%;
  padding: 0.67em 1em;
  border: 1.2px solid #ececec;
  border-radius: 7px;
  margin-bottom: 0.61em;
  font-size: 1.05em;
  background: #fafafa;
  color: #232323;
  outline: none;
  transition: border 0.13s, box-shadow 0.13s;
}
.delete-confirm-input:focus {
  border: 1.5px solid var(--cibubble-red);
  box-shadow: 0 2px 7px #e93c2f13;
  background: #fff9f7;
}
.modal-error {
  color: var(--cibubble-red);
  margin-bottom: 0.28em;
  font-weight: 500;
  min-height: 1.2em;
  font-size: 1em;
}
.modal-actions {
  display: flex;
  gap: 1.2em;
  justify-content: flex-end;
  margin-top: 0.1em;
}
.modal-actions button {
  padding: 0.6em 1.7em;
  font-size: 1.01em;
  border-radius: 7px;
  border: none;
  font-weight: 600;
  background: #f3f3f3;
  color: #181818;
  cursor: pointer;
  transition: background 0.13s;
}
.modal-actions .delete-btn {
  background: var(--cibubble-red);
  color: #fff;
  font-weight: 700;
}
.modal-actions button:focus {
  outline: 1.5px solid #2562e9;
}
@media (max-width: 800px) {
  .settings-page {
    max-width: 99vw;
    padding: 1.12em 0.35em 1.6em 0.35em;
    border-radius: 10px;
    margin-top: 1.4em;
    font-size: 0.98em;
  }
  .modal {
    max-width: 96vw;
    padding: 1.3em 0.5em 1.12em 0.5em;
  }
}
</style>
