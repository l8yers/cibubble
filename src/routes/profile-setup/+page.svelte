<script>
  import { supabase } from '$lib/supabaseClient.js';
  import { goto } from '$app/navigation';
  let username = '';
  let error = '';
  let message = '';
  let user = null;

  // Get current user
  async function getUser() {
    const { data } = await supabase.auth.getUser();
    return data?.user;
  }

  onMount(async () => {
    user = await getUser();
    if (!user) goto('/login');
  });

  async function handleProfileSetup(e) {
    e.preventDefault();
    error = '';
    message = '';
    if (!username) {
      error = "Please enter a username.";
      return;
    }
    // Insert or update profile (id = user.id)
    const { error: profileError } = await supabase.from('profiles').upsert([
      {
        id: user.id,
        username
      }
    ]);
    if (profileError) {
      error = "Could not set username: " + profileError.message;
      return;
    }
    message = "Username saved! Redirecting...";
    setTimeout(() => goto('/'), 1200);
  }
</script>

<form class="profile-setup-form" on:submit={handleProfileSetup}>
  <h2>Choose a Username</h2>
  <input type="text" bind:value={username} placeholder="Username (unique)" required minlength="3" maxlength="24" autocomplete="username" />
  <button type="submit">Save Username</button>
  {#if error}<div class="error">{error}</div>{/if}
  {#if message}<div class="success">{message}</div>{/if}
</form>

<style>
  .profile-setup-form {
    max-width: 400px;
    margin: 4em auto;
    background: #fff;
    padding: 2em 2.5em;
    border-radius: 15px;
    box-shadow: 0 2px 18px #0001;
    display: flex;
    flex-direction: column;
    gap: 1.1em;
  }
  .profile-setup-form h2 {
    margin-bottom: 1.2em;
    text-align: center;
    font-weight: 700;
    color: #234;
  }
  .profile-setup-form input {
    font-size: 1.05em;
    padding: 0.5em 0.8em;
    border: 1.2px solid #ddd;
    border-radius: 6px;
    background: #fafbfc;
    transition: border 0.2s;
  }
  .profile-setup-form input:focus {
    border: 1.3px solid #1975d2;
    background: #fff;
  }
  .profile-setup-form button {
    margin-top: 0.8em;
    padding: 0.55em 0;
    font-size: 1.1em;
    background: #1677f4;
    color: #fff;
    border: none;
    border-radius: 7px;
    font-weight: 700;
    cursor: pointer;
    transition: background 0.15s;
  }
  .profile-setup-form button:hover {
    background: #1556a4;
  }
  .error {
    color: #c13;
    background: #ffeaea;
    border: 1px solid #ffc7c7;
    border-radius: 4px;
    padding: 0.5em;
    font-size: 1em;
    text-align: center;
  }
  .success {
    color: #185c1b;
    background: #e5ffd6;
    border: 1px solid #b6ef8c;
    border-radius: 4px;
    padding: 0.5em;
    font-size: 1em;
    text-align: center;
  }
</style>
