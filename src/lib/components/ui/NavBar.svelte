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

  <!-- Mobile right-side drawer menu -->
  {#if menuOpen}
    <div class="drawer-backdrop" on:click={closeMenu}>
      <aside class="mobile-drawer" on:click|stopPropagation>
        <div class="drawer-top-row">
          <div class="drawer-theme-toggle">
            <ThemeToggle {dark} {toggleDark} />
          </div>
          <button class="drawer-close" aria-label="Close menu" on:click={closeMenu}>×</button>
        </div>
        <a class="drawer-item" href="/" on:click={closeMenu}>Watch</a>
        {#if $user}
          <a class="drawer-item" href="/progress" on:click={closeMenu}>Progress</a>
          <button class="drawer-item" on:click={handleLogout}>Logout</button>
        {:else}
          <a class="drawer-item" href="/signup" on:click={closeMenu}>Sign Up</a>
          <a class="drawer-item" href="/login" on:click={closeMenu}>Login</a>
        {/if}
        <div class="drawer-theme-row" style="display: none;">
          <!-- Hidden: theme toggle is now at the top row -->
        </div>
      </aside>
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

/* --- Mobile Right Drawer --- */
.drawer-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(30,40,60, 0.13);
  z-index: 2000;
  display: flex;
  justify-content: flex-end;
  animation: backdropFade .17s;
}
@keyframes backdropFade {
  from { opacity: 0; }
  to { opacity: 1; }
}
.mobile-drawer {
  background: #fff;
  width: 75vw;
  max-width: 340px;
  min-width: 210px;
  height: 100vh;
  box-shadow: -4px 0 24px #2e9be633;
  display: flex;
  flex-direction: column;
  padding: 1.05em 0.9em 1em 1em;
  position: relative;
  animation: drawerSlideIn .19s cubic-bezier(.37,1.24,.34,.97);
  border-radius: 0;
  box-sizing: border-box;
}
@keyframes drawerSlideIn {
  from { transform: translateX(60px); opacity: 0.73; }
  to { transform: translateX(0); opacity: 1; }
}

/* --- Drawer top row --- */
.drawer-top-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.4em;
  padding-right: 0.1em;
}
.drawer-theme-toggle {
  display: flex;
  align-items: center;
}

/* --- Drawer close --- */
.drawer-close {
  background: none;
  border: none;
  font-size: 2.1em;
  color: #2e9be6;
  cursor: pointer;
  margin-bottom: 0.15em;
  margin-right: 0;
  line-height: 1;
  padding: 0;
  transition: color 0.12s;
  border-radius: 0;
}
.drawer-close:hover { color: #e93c2f; }

/* --- Drawer items --- */
.drawer-item {
  margin: 0.16em 0 0.32em 0;
  font-size: 1.09em;
  font-weight: 600;
  color: #23253c;
  background: none;
  border: none;
  text-align: left;
  padding: 0.46em 0.5em 0.46em 0.15em;
  border-radius: 0;
  cursor: pointer;
  transition: background 0.11s, color 0.13s;
  display: block;
  text-decoration: none;
  letter-spacing: 0.01em;
}
.drawer-item:hover, .drawer-item:focus {
  background: #e6f1fb;
  color: #2e9be6;
  outline: none;
}

/* Hide bottom theme row */
.drawer-theme-row {
  display: none;
}

/* Dark mode for drawer */
body.dark-mode .mobile-drawer {
  background: #161c23;
  box-shadow: -6px 0 18px #0009, -1px 0 5px #2e9be633;
}
body.dark-mode .drawer-item {
  color: #f4f7fa;
  background: none;
}
body.dark-mode .drawer-item:hover, body.dark-mode .drawer-item:focus {
  background: #223040;
  color: #6bb8ff;
}
body.dark-mode .drawer-close {
  color: #6bb8ff;
}

/* Responsive rules */
@media (max-width: 720px) {
  .nav-links { display: none; }
  .menu-toggle { display: block; }
  .header { min-height: 44px; }
  .mobile-drawer { min-height: calc(100vh - 0px); }
  .logo-img {
    height: 2.15em !important;
    max-height: 40px !important;
  }
}
@media (min-width: 721px) {
  .drawer-backdrop, .mobile-drawer { display: none !important; }
}
</style>
