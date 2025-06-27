<script>
  import { onMount } from 'svelte';
  let accepted = false;

  onMount(() => {
    if (typeof window !== 'undefined') {
      accepted = window.localStorage.getItem('cookieConsent') === 'yes';
      console.log('CookieConsent loaded, accepted:', accepted);
    }
  });

  function acceptCookies() {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('cookieConsent', 'yes');
      accepted = true;
      console.log('Accepted set, banner should vanish');
    }
  }
</script>

{#if !accepted}
<div id="cookie-banner-test" style="
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100vw;
  height: auto;
  background: #222;
  color: #fff;
  z-index: 99999;
  font-size: 1.1em;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding: 1.1em 2em;
  box-shadow: 0 -2px 12px #0006;
  border-top: 3px solid #e93c2f;
  text-align: left;
  ">
<span>
  CIBUBBLE uses local storage for login and site preferences. By using the site, you agree to this.
  <a href="/privacy" target="_blank" rel="noopener" style="color:#e93c2f;text-decoration:underline;margin-left:0.7em;font-size:1em;">Learn more</a>.
</span>
  <button on:click={acceptCookies} style="background:#e93c2f;color:#fff;border:none;padding:0.5em 1.5em;border-radius:9px;font-size:1em;font-weight:700;cursor:pointer;margin-left:1.7em;">OK</button>
</div>

{/if}
