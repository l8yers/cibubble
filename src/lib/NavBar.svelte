<script>
  export let user = null; // Placeholder for future auth
</script>

<style>
.navbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.7rem 2vw;
  background: #18181b;
  border-bottom: 1px solid #242424;
}
.nav-logo {
  font-size: 1.2rem;
  font-weight: bold;
  color: #fff;
  letter-spacing: 1px;
  text-decoration: none;
}
.nav-links {
  display: flex;
  gap: 1.3rem;
}
.nav-link {
  color: #bbb;
  text-decoration: none;
  font-size: 1rem;
  transition: color 0.2s;
}
.nav-link:hover { color: #fff; }
.user-btn {
  background: #333;
  color: #fff;
  border: none;
  border-radius: 1rem;
  padding: 0.3em 1.1em;
  font-size: 1rem;
  margin-left: 1rem;
  cursor: pointer;
  transition: background 0.2s;
}
.user-btn:hover { background: #555; }
</style>

<nav class="navbar">
  <a class="nav-logo" href="/">CIBUBBLE</a>
  <div class="nav-links">
    <a class="nav-link" href="/">Home</a>
    <a class="nav-link" href="/add-video">Add Video</a>
    <a class="nav-link" href="/profile">Profile</a>
    <a class="nav-link" href="/faq">FAQ</a>
    {#if user}
      <button class="user-btn">Logout</button>
    {:else}
      <a class="nav-link" href="/login">Login</a>
    {/if}
  </div>
</nav>
