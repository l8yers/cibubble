<script>
  import { supabase } from '$lib/supabaseClient.js';

  let email = '';
  let password = '';
  let error = '';
  let mode = 'login'; // or 'signup'
  let message = '';

  async function handleSubmit() {
    error = '';
    message = '';
    if (mode === 'login') {
      const { error: err } = await supabase.auth.signInWithPassword({ email, password });
      if (err) error = err.message;
      else message = "Logged in! Go to your profile.";
    } else {
      const { error: err } = await supabase.auth.signUp({ email, password });
      if (err) error = err.message;
      else message = "Check your email for a confirmation link!";
    }
  }
</script>

<h2>{mode === 'login' ? "Login" : "Sign up"}</h2>
<form on:submit|preventDefault={handleSubmit}>
  <input bind:value={email} type="email" placeholder="Email" required>
  <input bind:value={password} type="password" placeholder="Password" required>
  <button type="submit">{mode === 'login' ? "Login" : "Sign up"}</button>
</form>
<button on:click={() => mode = (mode === 'login' ? 'signup' : 'login')}>
  {mode === 'login' ? "Need an account? Sign up" : "Have an account? Login"}
</button>
{#if error}<div style="color:red">{error}</div>{/if}
{#if message}<div style="color:green">{message}</div>{/if}
