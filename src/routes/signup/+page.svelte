<script>
  import { signup, authError } from '$lib/stores/user.js';
  import { goto } from '$app/navigation';
  import { onDestroy } from 'svelte';

  let email = '';
  let password = '';
  let message = '';
  let pending = false;

  // Subscribe to the authError store
  let unsubscribe;
  $: errorMsg = $authError;

  // Clear message when user changes input
  $: if (email || password) {
    if (message && !pending) message = '';
  }

  async function handleSignup() {
    pending = true;
    message = '';
    const { error, data } = await signup(email, password);
    console.log("Signup result:", { error, data });
    if (!error) {
      message = 'Signup successful! Check your email to confirm.';
      setTimeout(() => goto('/login'), 1200);
    } else {
      message = $authError || (error && error.message) || "Unknown error";
    }
    pending = false;
  }
</script>

<style>
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
button {
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
button:hover { background: #b8271b; }
.message {
  margin-top: 1em;
  color: #0b9203;
  font-size: 1.04rem;
  min-height: 1.5em;
}
.error {
  color: #c90000;
  min-height: 1.5em;
  font-size: 1.04rem;
  margin-top: 0.8em;
}
</style>

<div class="auth-container">
  <h2>Sign Up</h2>
  <input
    type="email"
    bind:value={email}
    placeholder="Email"
    autocomplete="email"
    required
  />
  <input
    type="password"
    bind:value={password}
    placeholder="Password"
    autocomplete="new-password"
    required
  />
  <button on:click={handleSignup} disabled={pending}>
    {pending ? 'Signing Up…' : 'Sign Up'}
  </button>
  {#if message}
    <div class="message">{message}</div>
  {/if}
  {#if errorMsg && !message}
    <div class="error">{errorMsg}</div>
  {/if}
  <div style="margin-top:1em; color:#888;">
    Already have an account?
    <a href="/login" style="color:#e93c2f;">Log In</a>
  </div>
</div>
