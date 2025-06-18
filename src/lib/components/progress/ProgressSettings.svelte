<script>
  export let email = '';
  export let newEmail = '';
  export let setNewEmail;
  export let newPassword = '';
  export let setNewPassword;
  export let message = '';
  export let updateEmail;
  export let updatePassword;
  export let back;
</script>

<div class="settings-panel">
  <div class="settings-header-row">
    <div class="section-title">Account Settings</div>
    <a class="settings-link" on:click={back} tabindex="0">← Back</a>
  </div>
  <div class="profile-row"><b>Email:</b> {email}</div>
  <div>
    <input type="email" bind:value={newEmail} placeholder="New email" autocomplete="email" />
    <button on:click={updateEmail}>Change Email</button>
  </div>
  <div>
    <input
      type="password"
      bind:value={newPassword}
      placeholder="New password"
      autocomplete="new-password"
    />
    <button on:click={updatePassword}>Change Password</button>
  </div>
  <div class="message">{message}</div>
</div>

<style>
.settings-panel {
  margin-top: 2.2em;
}
.settings-header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.6em;
  gap: 2em;
}
.section-title {
  color: #181818;
  font-size: 1.25rem;
  font-weight: bold;
  letter-spacing: 0.3px;
}
.settings-link {
  color: #2562e9;
  font-size: 1.06em;
  text-decoration: none;
  font-weight: 500;
  cursor: pointer;
  transition: color 0.16s;
}
.settings-link:hover, .settings-link:focus {
  color: #e93c2f;
  text-decoration: underline;
}
.profile-row {
  margin-bottom: 1.3em;
}
input[type='email'],
input[type='password'] {
  width: 100%;
  padding: 0.7em 1em;
  font-size: 1.07rem;
  border: 1px solid #ececec;
  border-radius: 8px;
  background: #fafafa;
  margin-bottom: 0.9em;
  color: #181818;
}
button {
  padding: 0.6em 1.7em;
  font-size: 1.04rem;
  background: #e93c2f;
  color: #fff;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  margin-right: 1em;
  margin-bottom: 0.5em;
  transition: background 0.18s;
}
button:hover {
  background: #b8271b;
}
.message {
  color: #26890d;
  margin-bottom: 1em;
  min-height: 1.5em;
}
</style>
