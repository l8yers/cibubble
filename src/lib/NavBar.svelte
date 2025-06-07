<script>
  import { onMount } from 'svelte';
  import { supabase } from '$lib/supabaseClient';
  import { goto } from '$app/navigation';

  let session = null;

  onMount(async () => {
    const { data: { session: sess } } = await supabase.auth.getSession();
    session = sess;
    supabase.auth.onAuthStateChange((event, { session: sess }) => {
      session = sess;
    });
  });

  async function logout() {
    await supabase.auth.signOut();
    session = null;
    goto('/');
  }
</script>

<style>
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fff;
  padding: 0.8em 2vw;
  border-bottom: 1px solid #ececec;
}
.logo-row {
  display: flex;
  align-items: center;
  gap: 0.65em;
  text-decoration: none;
}
.logo-img {
  height: 3.6em;
  width: auto;
  vertical-align: middle;
}
.logo-title {
  font-size: 1.37em;
  font-weight: bold;
  letter-spacing: 1px;
  color: #181818;
}
.nav-links {
  display: flex;
  gap: 1.6em;
}
.nav-link, .nav-btn {
  color: #181818;
  font-size: 1.08em;
  font-weight: 500;
  padding: 0.2em 0.6em;
  border-radius: 7px;
  text-decoration: none;
  background: none;
  border: none;
  cursor: pointer;
  transition: background 0.18s, color 0.18s;
}
.nav-link:hover, .nav-btn:hover {
  background: #f7f7f7;
  color: #e93c2f;
}
</style>

<nav class="header">
  <a href="/" class="logo-row">
    <img src="/logo.png" alt="CIBUBBLE logo" class="logo-img" />
  </a>
  <div class="nav-links">
    <a class="nav-link" href="/">Home</a>
    <a class="nav-link" href="/add-video">Add Video</a>
    <a class="nav-link" href="/faq">FAQ</a>
    {#if session}
      <a class="nav-link" href="/profile">Profile</a>
      <button class="nav-btn" on:click={logout}>Logout</button>
    {:else}
      <a class="nav-link" href="/login">Login / Sign Up</a>
    {/if}
  </div>
</nav>
