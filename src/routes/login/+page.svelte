<script>
  import { login, signup, authError } from '$lib/stores/user.js';
  import { goto } from '$app/navigation';
  import { get } from 'svelte/store';

  let mode = 'login'; // or 'signup'
  let email = '';
  let password = '';
  let password2 = '';
  let message = '';

  async function handleLogin() {
    message = '';
    const result = await login(email, password);
    if (!result.error) {
      message = 'Login successful! Redirecting…';
      setTimeout(() => goto('/progress'), 1200);
    } else {
      message = get(authError);
    }
  }

  async function handleSignup() {
    message = '';
    if (password !== password2) {
      message = "Passwords don't match!";
      return;
    }
    const result = await signup(email, password);
    // If error, show mapped error. If not, tell user to check email.
    if (!result.error) {
      message = "Sign up successful! Please check your email to confirm your account before logging in.";
      // Optionally: mode = 'login';
    } else {
      message = get(authError);
    }
  }
</script>

<style>
/* ... styles as before ... */
.auth-container {
  max-width: 430px;
  margin: 3rem auto;
  background: #fff;
  border-radius: 13px;
  border: 1px solid #ececec;
  box-shadow: 0 2px 12px #ececec;
  padding: 2.1rem 2rem 1.4rem 2rem;
  text-align: center;
}
.auth-toggle-row {
  display: flex;
  justify-content: center;
  gap: 2.2em;
  margin-bottom: 2.2em;
}
.auth-toggle-btn {
  background: none;
  border: none;
  font-size: 1.18em;
  font-weight: 700;
  padding: 0.3em 1.2em 0.3em 1.2em;
  border-radius: 6px;
  color: #222;
  cursor: pointer;
  transition: background 0.14s, color 0.14s;
}
.auth-toggle-btn.active {
  background: #e93c2f;
  color: #fff;
}
input[type="email"],
input[type="password"] {
  width: 100%;
  padding: 0.8em 1em;
  margin-bottom: 1em;
  border: 1px solid #ececec;
  border-radius: 8px;
  background: #fafafa;
  font-size: 1.06rem;
  color: #181818;
}
button[type="submit"] {
  width: 100%;
  padding: 0.7em 0;
  font-size: 1.09rem;
  font-weight: 600;
  background: #e93c2f;
  color: #fff;
  border: none;
  border-radius: 8px;
  margin-top: 0.3em;
  cursor: pointer;
  transition: background 0.2s;
}
button[type="submit"]:hover { background: #b8271b; }
.message {
  margin-top: 1em;
  color: #0b9203;
  font-size: 1.04rem;
  min-height: 1.5em;
}
.auth-footer-row {
  margin-top: 2em;
  color: #888;
  font-size: 1em;
}
.auth-footer-row a {
  color: #e93c2f;
  margin-left: 0.4em;
  text-decoration: underline;
  cursor: pointer;
}
</style>

<div class="auth-container">
  <div class="auth-toggle-row">
    <button
      class="auth-toggle-btn {mode === 'login' ? 'active' : ''}"
      on:click={() => { mode = 'login'; message = ''; }}>
      Log In
    </button>
    <button
      class="auth-toggle-btn {mode === 'signup' ? 'active' : ''}"
      on:click={() => { mode = 'signup'; message = ''; }}>
      Sign Up
    </button>
  </div>

  {#if mode === 'login'}
    <form on:submit|preventDefault={handleLogin}>
      <input type="email" bind:value={email} placeholder="Email" autocomplete="email" required />
      <input type="password" bind:value={password} placeholder="Password" autocomplete="current-password" required />
      <button type="submit">Log In</button>
    </form>
    <div class="message">{message}</div>
    <div class="auth-footer-row">
      Don't have an account?
      <a on:click|preventDefault={() => { mode = 'signup'; message = ''; }}>Sign Up</a>
    </div>
  {:else}
    <form on:submit|preventDefault={handleSignup}>
      <input type="email" bind:value={email} placeholder="Email" autocomplete="email" required />
      <input type="password" bind:value={password} placeholder="Password" autocomplete="new-password" required />
      <input type="password" bind:value={password2} placeholder="Repeat password" autocomplete="new-password" required />
      <button type="submit">Sign Up</button>
    </form>
    <div class="message">{message}</div>
    <div class="auth-footer-row">
      Already have an account?
      <a on:click|preventDefault={() => { mode = 'login'; message = ''; }}>Log In</a>
    </div>
  {/if}
</div>
