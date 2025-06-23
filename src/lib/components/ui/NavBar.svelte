<script>
  import { user, logout } from '$lib/stores/user.js';
  import ThemeToggle from '$lib/components/ui/ThemeToggle.svelte';
  import { onMount } from 'svelte';

  let dark = false;
  let menuOpen = false;

  function setDarkMode(enabled) {
    if (enabled) {
      document.body.classList.add('dark-mode');
      localStorage.setItem('theme', 'dark');
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
      const link = document.getElementById('dark-css');
      if (link) link.remove();
    }
  }
  function toggleDark() {
    dark = !dark;
    setDarkMode(dark);
  }
  onMount(() => {
    dark = localStorage.getItem('theme') === 'dark' || document.body.classList.contains('dark-mode');
    setDarkMode(dark);
    const handler = () => {
      if (window.innerWidth > 720) menuOpen = false;
    };
    window.addEventListener('resize', handler);
    // Click outside closes menu
    const closeOnOutside = (e) => {
      if (menuOpen && !e.target.closest('.mobile-dropdown') && !e.target.closest('.menu-toggle')) {
        menuOpen = false;
      }
    };
    document.addEventListener('click', closeOnOutside);
    return () => {
      window.removeEventListener('resize', handler);
      document.removeEventListener('click', closeOnOutside);
    };
  });

  function handleMenu(e) {
    e.stopPropagation();
    menuOpen = !menuOpen;
  }
  function closeMenu() { menuOpen = false; }
  function handleLogout() { logout(); closeMenu(); }
</script>

<nav class="header">
  <a href="/" aria-label="CIBUBBLE Home">
    <img src="/logo.png" alt="CIBUBBLE logo" class="logo-img" />
  </a>
  <button class="menu-toggle" aria-label="Open menu" on:click={handleMenu}>
    <svg class="menu-icon" fill="none" viewBox="0 0 24 24" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round" d="M4 7h16M4 12h16M4 17h16"/>
    </svg>
  </button>

  <!-- Desktop links -->
  <div class="nav-links">
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

  <!-- Mobile full-width dropdown menu -->
  {#if menuOpen}
    <div class="mobile-dropdown">
      <div class="dropdown-inner">
        <button class="mobile-menu-close" aria-label="Close menu" on:click={closeMenu}>×</button>
        <a class="mobile-menu-item" href="/" on:click={closeMenu}>Watch</a>
        {#if $user}
          <a class="mobile-menu-item" href="/progress" on:click={closeMenu}>Progress</a>
          <button class="mobile-menu-item" on:click={handleLogout}>Logout</button>
        {:else}
          <a class="mobile-menu-item" href="/signup" on:click={closeMenu}>Sign Up</a>
          <a class="mobile-menu-item" href="/login" on:click={closeMenu}>Login</a>
        {/if}
        <div class="mobile-theme-row">
          <ThemeToggle {dark} {toggleDark} />
        </div>
      </div>
    </div>
  {/if}
</nav>

<style>
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fff;
  padding: 0.8em 2vw;
  border-bottom: 1px solid #ececec;
  position: relative;
  z-index: 100;
  min-height: 55px;
}
.logo-img { height: 3em; width: auto; }
.nav-links {
  display: flex;
  gap: 1.6em;
  align-items: center;
}
.nav-link, .logout-btn {
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
.nav-link:hover, .logout-btn:hover { background: #f7f7f7; color: #e93c2f; }
.logout-btn { font-family: inherit; }

/* Hamburger menu (mobile only) */
.menu-toggle {
  display: none;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.6em;
  margin-left: 1em;
}
.menu-icon { width: 2em; height: 2em; stroke: #181818; }

/* --- Mobile FULL WIDTH Dropdown --- */
.mobile-dropdown {
  position: fixed;
  left: 0; right: 0; top: 55px; /* or match header height */
  background: rgba(255,255,255,0.97);
  width: 100vw;
  min-height: calc(100vh - 55px);
  z-index: 1100;
  animation: dropdown .15s cubic-bezier(.68,-0.55,.27,1.55);
  box-shadow: 0 10px 32px #0001;
  display: flex;
  flex-direction: column;
  align-items: stretch;
}
@keyframes dropdown {
  from { transform: translateY(-16px); opacity: 0.6;}
  to { transform: translateY(0); opacity: 1;}
}
.dropdown-inner {
  width: 100%;
  max-width: 440px;
  margin: 0 auto;
  padding: 2em 1em 2em 1em;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 0.5em;
}
.mobile-menu-close {
  align-self: flex-end;
  background: none;
  border: none;
  font-size: 2.2em;
  color: #888;
  cursor: pointer;
  margin-bottom: 0.5em;
  margin-right: 0.1em;
}
.mobile-menu-item {
  margin: 0.5em 0 0.7em 0;
  font-size: 1.13em;
  font-weight: 600;
  color: #181818;
  background: none;
  border: none;
  text-align: left;
  padding: 0.5em 0.7em;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.10s;
  display: block;
  text-decoration: none;
}
.mobile-menu-item:hover, .mobile-menu-item:focus {
  background: #f2f5ff;
  color: #0077ff;
}
.mobile-theme-row {
  margin-top: 1.3em;
  border-top: 1.5px solid #eee;
  padding-top: 1em;
  display: flex;
  align-items: center;
  gap: 0.8em;
  font-size: 1em;
  justify-content: flex-start;
}

/* Responsive rules */
@media (max-width: 720px) {
  .nav-links { display: none; }
  .menu-toggle { display: block; }
  .header { min-height: 44px; }
  .mobile-dropdown { top: 44px; min-height: calc(100vh - 44px); }
}
@media (min-width: 721px) {
  .mobile-dropdown, .dropdown-inner { display: none !important; }
}
</style>
