<script>
  import { onMount } from 'svelte';
  import { supabase } from '$lib/supabaseClient.js';
  import { writable } from 'svelte/store';

  // User store for reactive login/logout
  export const currentUser = writable(null);

  // Fetch current user on mount
  onMount(async () => {
    const { data } = await supabase.auth.getUser();
    currentUser.set(data?.user ?? null);

    // Listen for login/logout
    supabase.auth.onAuthStateChange((_event, session) => {
      currentUser.set(session?.user ?? null);
    });
  });

  // To subscribe in template
  let user = null;
  currentUser.subscribe(value => user = value);

  function logOut() {
    supabase.auth.signOut();
    window.location.href = "/login";
  }
</script>

<nav class="navbar">
  <a href="/" class="logo">
    <img src="/logo.png" alt="CIBUBBLE" />
  </a>
  <div class="nav-links">
    <a href="/add-video">Add Video</a>
    {#if user}
      <a href="/profile">Profile</a>
      <button class="logout-btn" on:click={logOut}>Log Out</button>
    {:else}
      <a href="/login">Login</a>
    {/if}
  </div>
</nav>

<slot />

<style>
  .navbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: #fff;
    border-bottom: 1px solid #eee;
    padding: 0.7em 3vw;
    font-family: inherit;
    min-height: 60px;
    position: sticky;
    top: 0;
    z-index: 10;
  }
  .logo {
    display: flex;
    align-items: center;
    gap: 0.6em;
    text-decoration: none;
    font-weight: 700;
    color: #191919;
    font-size: 1.23em;
    letter-spacing: 0.04em;
  }
  .logo img {
    height: 54px;
    width: auto;
    display: block;
  }
  .nav-links {
    display: flex;
    align-items: center;
    gap: 1.1em;
  }
  .nav-links a {
    color: #191919;
    text-decoration: none;
    font-weight: 500;
    font-size: 1.05em;
    padding: 0.22em 0.7em;
    border-radius: 6px;
    transition: background 0.12s;
  }
  .nav-links a:hover {
    background: #f1f1f1;
  }
  .logout-btn {
    background: none;
    border: none;
    color: #dc3c3c;
    font-weight: 600;
    font-size: 1.02em;
    cursor: pointer;
    padding: 0.22em 0.7em;
    border-radius: 6px;
    transition: background 0.12s;
  }
  .logout-btn:hover {
    background: #ffeaea;
  }
  @media (max-width: 650px) {
    .navbar {
      flex-direction: column;
      align-items: flex-start;
      padding: 0.7em 1vw;
      min-height: unset;
    }
    .nav-links {
      gap: 0.5em;
      margin-top: 0.2em;
    }
    .logo span { font-size: 1em; }
  }
</style>
