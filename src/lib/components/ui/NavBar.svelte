<script>
  import { user, logout } from '$lib/stores/user.js';
  import { onMount } from 'svelte';
  import { Settings as SettingsIcon } from 'lucide-svelte';

  let menuOpen = false;
  let accountDropdownOpen = false;

  function handleMenu(e) {
    e.stopPropagation();
    menuOpen = !menuOpen;
  }
  function closeMenu() {
    menuOpen = false;
  }
  function handleLogout() {
    logout();
    closeMenu();
    accountDropdownOpen = false;
  }
  function openAccountDropdown(e) {
    e.stopPropagation();
    accountDropdownOpen = !accountDropdownOpen;
  }

  onMount(() => {
    const handler = () => {
      if (window.innerWidth > 720) menuOpen = false;
    };
    window.addEventListener('resize', handler);

    const closeOnOutside = (e) => {
      if (menuOpen && !e.target.closest('.mobile-drawer') && !e.target.closest('.menu-toggle')) {
        menuOpen = false;
      }
      if (
        accountDropdownOpen &&
        !e.target.closest('.account-dropdown') &&
        !e.target.closest('.account-cog')
      ) {
        accountDropdownOpen = false;
      }
    };
    document.addEventListener('click', closeOnOutside);
    return () => {
      window.removeEventListener('resize', handler);
      document.removeEventListener('click', closeOnOutside);
    };
  });
</script>

<nav class="header" aria-label="Main Navigation">
  <a href="/" aria-label="CIBUBBLE Home" class="logo-link">
    <img src="/logo.png" alt="CIBUBBLE logo" class="logo-img" />
  </a>
  <button class="menu-toggle" aria-label="Open menu" on:click={handleMenu}>
    <svg class="menu-icon" fill="none" viewBox="0 0 24 24" stroke-width="2" aria-hidden="true">
      <path stroke-linecap="round" stroke-linejoin="round" d="M4 7h16M4 12h16M4 17h16"/>
    </svg>
  </button>

  <!-- Desktop links -->
  <div class="nav-links">
    <a class="nav-link" href="/">Watch</a>
    {#if $user}
      <a class="nav-link" href="/progress">Progress</a>
      <div class="account-cog" tabindex="0" aria-haspopup="true" aria-expanded={accountDropdownOpen} on:click={openAccountDropdown}>
        <SettingsIcon size={22} stroke="#101720" />
        {#if accountDropdownOpen}
          <div class="account-dropdown" tabindex="-1">
            <a href="/account" class="nav-link dropdown-link" on:click={() => accountDropdownOpen = false}>Account</a>
            <button class="nav-link dropdown-link" type="button" on:click={handleLogout}>Logout</button>
          </div>
        {/if}
      </div>
    {:else}
      <a class="nav-link" href="/login">Log In / Sign Up</a>
    {/if}
  </div>

  <!-- Mobile right-side drawer menu -->
  {#if menuOpen}
    <div class="drawer-backdrop" on:click={closeMenu}>
      <aside class="mobile-drawer" on:click|stopPropagation>
        <div class="drawer-top-row">
          <button class="drawer-close" aria-label="Close menu" on:click={closeMenu}>×</button>
        </div>
        <a class="drawer-item" href="/" on:click={closeMenu}>Watch</a>
        {#if $user}
          <a class="drawer-item" href="/progress" on:click={closeMenu}>Progress</a>
          <a class="drawer-item" href="/account" on:click={closeMenu}>Account</a>
          <button class="drawer-item" on:click={handleLogout} aria-label="Log out">Logout</button>
        {:else}
          <a class="drawer-item" href="/login" on:click={closeMenu}>Log In / Sign Up</a>
        {/if}
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
  padding: 0.6em 2vw;
  border-bottom: 1px solid #ececec;
  position: relative;
  z-index: 100;
  min-height: 55px;
}
.logo-img { height: 2.8em; width: auto; }
.logo-link { display: flex; align-items: center; }
.nav-links {
  display: flex;
  gap: 1.6em;
  align-items: center;
}
.nav-link, .logout-btn {
  color:  #101720;
  font-size: 1.08em;
  font-weight: 600;
  padding: 0.2em 0.6em;
  border-radius: 7px;
  text-decoration: none;
  background: none;
  border: none;
  cursor: pointer;
  transition: background 0.18s, color 0.18s;
  font-family: inherit;
}
.logout-btn { font-family: inherit; }

.account-cog {
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  margin-left: 0.1em;
  position: relative;
  height: 2.1em;
  width: 2.1em;
}
.account-dropdown {
  position: absolute;
  top: 2.5em;
  right: 0;
  min-width: 130px;
  background: #fff;
  border: 1px solid #ececec;
  border-radius: 11px;
  box-shadow: 0 3px 16px #242b3322;
  z-index: 1112;
  padding: 0.55em 0.18em;     /* More padding than before */
  display: flex;
  flex-direction: column;
  gap: 0.07em;
}
.dropdown-link {
  /* Inherit nav-link but make sure width/flex works in dropdown */
  display: block;
  text-align: left;
  width: 100%;
  margin: 0;
  font-weight: 500;          /* LESS bold than nav-link */
}
.account-dropdown .dropdown-link {
  padding-left: 1em;
  padding-right: 1em;
}
.account-dropdown .dropdown-link:focus,
.account-dropdown .dropdown-link:hover {
  background: #e6f1fb;
  color: #eb1000;
  outline: none;
}

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
  width: 55vw;
  max-width: 340px;
  min-width: 210px;
  height: 100vh;
  box-shadow: -4px 0 24px #2e9be633;
  display: flex;
  flex-direction: column;
  padding: 1.05em 0.9em 1em 1em;
  position: relative;
  animation: drawerSlideIn .19s cubic-bezier(.37,1.24,.34,.97);
  box-sizing: border-box;
}
@keyframes drawerSlideIn {
  from { transform: translateX(60px); opacity: 0.73; }
  to { transform: translateX(0); opacity: 1; }
}
.drawer-top-row {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  margin-bottom: 0.4em;
  padding-right: 0.1em;
}
.drawer-close {
  background: none;
  border: none;
  font-size: 2.1em;
  color: #eb1000;
  cursor: pointer;
  margin-bottom: 0.15em;
  line-height: 1;
  padding: 0;
  transition: color 0.12s;
}
.drawer-close:hover { color: #e93c2f; }
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
  color: #eb1000;
  outline: none;
}

@media (max-width: 720px) {
  .header {
    position: sticky;
    top: 0;
    z-index: 2100;
    background: #fff;
    padding: 0 !important;
    min-height: unset;
    height: 48px;
    align-items: center;
  }
  .nav-links { display: none; }
  .menu-toggle { display: block; }
  .logo-link {
    padding: 0 !important;
    margin: 0 !important;
  }
  .logo-img {
    display: block;
    margin-left: 0.7em ;
    padding: 0 !important;
    height: 2.1em !important;
    max-height: 38px !important;
    width: auto !important;
    align-self: center;
  }
}

@media (min-width: 721px) {
  .drawer-backdrop, .mobile-drawer { display: none !important; }
}
</style>
