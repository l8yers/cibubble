<script>
  import { user, logout } from '$lib/stores/user.js';
  import { onMount } from 'svelte';
  import ThemeToggle from '$lib/components/ui/ThemeToggle.svelte';
  

  let dark = false;
  let menuOpen = false;

  function setDarkMode(enabled) {
    if (enabled) {
      document.body.classList.add('dark-mode');
      localStorage.setItem('theme', 'dark');
      // Add dark.css dynamically if not present
      if (!document.getElementById('dark-css')) {
        const link = document.createElement('link');
        link.id = 'dark-css';
        link.rel = 'stylesheet';
        link.href = '/dark.css';
        document.head.appendChild(link);
      }
    } else {
      document.body.classList.remove('dark-mode');
      localStorage.setItem('theme', 'light');
      // Remove dark.css if present
      const link = document.getElementById('dark-css');
      if (link) link.remove();
    }
  }

  function toggleDark() {
    dark = !dark;
    setDarkMode(dark);
  }

  // On mount, set initial dark state and menu resize handler
  onMount(() => {
    // Handles reloads and SSR hydration
    dark = localStorage.getItem('theme') === 'dark' || document.body.classList.contains('dark-mode');
    setDarkMode(dark);

    // Responsive menu close on resize
    const handler = () => {
      if (window.innerWidth > 720) menuOpen = false;
    };
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  });
</script>

<style>
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fff;
  padding: 0.8em 2vw;
  border-bottom: 1px solid #ececec;
  position: relative;
}

.logo-row {
  display: flex;
  align-items: center;
  gap: 0.65em;
  text-decoration: none;
}

.logo-img {
  height: 3.7em;
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
  align-items: center;
}

.nav-link,
.logout-btn {
  color: #181818;
  font-size: 1.08em;
  font-weight: 600;
  padding: 0.2em 0.6em;
  border-radius: 7px;
  text-decoration: none;
  transition: background 0.18s, color 0.18s;
  background: none;
  border: none;
  cursor: pointer;
}

.nav-link:hover,
.logout-btn:hover {
  background: #f7f7f7;
  color: #e93c2f;
}
.logout-btn {
  font-family: inherit;
}

/* Hamburger menu styles */
.menu-toggle {
  display: none;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.6em;
  margin-left: 1em;
}

.menu-icon {
  width: 2em;
  height: 2em;
  display: block;
  stroke: #181818;
}

/* Mobile */
@media (max-width: 720px) {
  .nav-links {
    display: none;
    position: absolute;
    top: 100%;
    right: 0;
    background: #fff;
    box-shadow: 0 6px 24px 0 #0002;
    flex-direction: column;
    gap: 0.5em;
    width: 66vw;
    max-width: 18em;
    padding: 1em 0.5em;
    border-radius: 0 0 1em 1em;
    z-index: 20;
  }
  .nav-links.open {
    display: flex;
  }
  .menu-toggle {
    display: block;
  }
}
</style>

<nav class="header">
<a href="/" on:click={e => { e.preventDefault(); window.location.href = '/'; }}>

    <img src="/logo.png" alt="CIBUBBLE logo" class="logo-img" />
  </a>
  <button class="menu-toggle" aria-label="Open menu" on:click={() => menuOpen = !menuOpen}>
    <!-- Hamburger icon SVG -->
    <svg class="menu-icon" fill="none" viewBox="0 0 24 24" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round" d="M4 7h16M4 12h16M4 17h16"/>
    </svg>
  </button>
  <div class="nav-links {menuOpen ? 'open' : ''}">
    <a class="nav-link" href="/">Watch</a>
    {#if $user}
      <a class="nav-link" href="/progress">Progress</a>
      <button class="logout-btn" on:click={logout}>Logout</button>
    {:else}
      <a class="nav-link" href="/signup">Sign Up</a>
      <a class="nav-link" href="/login">Login</a>
    {/if}
    <ThemeToggle {dark} {toggleDark} />
  </div>
</nav>
