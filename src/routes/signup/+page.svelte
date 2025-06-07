<script>
  import { supabase } from '$lib/supabaseClient';

  let email = '';
  let password = '';
  let message = '';

  async function signup() {
    message = '';
    const { error } = await supabase.auth.signUp({
      email,
      password
    });
    if (error) {
      message = error.message;
    } else {
      message = 'Signup successful! Check your email to confirm.';
    }
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
</style>

<div class="auth-container">
  <h2>Sign Up</h2>
  <input type="email" bind:value={email} placeholder="Email" autocomplete="email" />
  <input type="password" bind:value={password} placeholder="Password" autocomplete="new-password" />
  <button on:click={signup}>Sign Up</button>
  <div class="message">{message}</div>
  <div style="margin-top:1em; color:#888;">
    Already have an account?
    <a href="/login" style="color:#e93c2f;">Log In</a>
  </div>
</div>
