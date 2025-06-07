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
  height: 3em;
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
.nav-link {
  color: #181818;
  font-size: 1.08em;
  font-weight: 500;
  padding: 0.2em 0.6em;
  border-radius: 7px;
  text-decoration: none;
  transition: background 0.18s, color 0.18s;
}
.nav-link:hover {
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
    <a class="nav-link" href="/profile">Profile</a>
    <a class="nav-link" href="/faq">FAQ</a>
  </div>
</nav>
