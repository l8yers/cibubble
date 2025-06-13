<script>
  import { user, logout } from '$lib/stores/user.js';
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
</style>

<nav class="header">
  <a href="/" class="logo-row">
    <img src="/logo.png" alt="CIBUBBLE logo" class="logo-img" />
  </a>
  <div class="nav-links">
    <a class="nav-link" href="/">Home</a>
    <a class="nav-link" href="/admin">ADMIN</a>
    <!-- <a class="nav-link" href="/faq">FAQ</a> -->
    {#if $user}
      <a class="nav-link" href="/progress">Progress</a>
      <button class="logout-btn" on:click={logout}>Logout</button>
    {:else}
      <a class="nav-link" href="/signup">Sign Up</a>
      <a class="nav-link" href="/login">Login</a>
    {/if}
  </div>
</nav>
