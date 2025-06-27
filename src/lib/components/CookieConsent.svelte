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
  height: 90px;
  background: #e93c2f;
  color: #fff;
  z-index: 1000000;
  font-size: 2em;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-top: 5px solid yellow;
  box-shadow: 0 0 30px #000;
  text-align: center;
  ">
  <div>
    🚨 BANNER TEST: Bottom Banner! 🚨
  </div>
  <button on:click={acceptCookies} style="font-size:1em;padding:1em 2em;margin-top:2em;">OK</button>
</div>
{/if}
