<script>
  import { supabase } from '$lib/supabaseClient.js';
  import { goto } from '$app/navigation';
  let email = '';
  let password = '';
  let error = '';
  let loading = false;

  async function handleLogin(e) {
    e.preventDefault();
    error = '';
    loading = true;

    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      error = authError.message;
      loading = false;
      return;
    }

    goto('/');
  }
</script>

<form class="auth-form" on:submit={handleLogin}>
  <h2>Sign In</h2>
  <input
    type="email"
    bind:value={email}
    placeholder="Email"
    required
    autocomplete="email"
    autofocus
  />
  <input
    type="password"
    bind:value={password}
    placeholder="Password"
    required
    autocomplete="current-password"
  />
  <button type="submit" disabled={loading}>{loading ? "Signing in..." : "Sign In"}</button>
  {#if error}
    <div class="error">{error}</div>
  {/if}
  <div class="switch-link" style="margin-top:1em">
    Don’t have an account? <a href="/signup">Sign up</a>
  </div>
</form>

<style>
  .auth-form {
    max-width: 400px;
    margin: 3.5em auto;
    background: #fff;
    padding: 2em 2.5em;
    border-radius: 15px;
    box-shadow: 0 2px 18px #0001;
    display: flex;
    flex-direction: column;
    gap: 1.1em;
  }
  .auth-form h2 {
    margin-bottom: 1.2em;
    text-align: center;
    font-weight: 700;
    color: #234;
  }
  .auth-form input {
    font-size: 1.05em;
    padding: 0.5em 0.8em;
    border: 1.2px solid #ddd;
    border-radius: 6px;
    outline: none;
    background: #fafbfc;
    transition: border 0.2s;
  }
  .auth-form input:focus {
    border: 1.3px solid #1975d2;
    background: #fff;
  }
  .auth-form button {
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
  .auth-form button:hover {
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
  .switch-link {
    text-align: center;
    font-size: 0.97em;
    color: #246;
    margin-top: 1.1em;
  }
</style>
