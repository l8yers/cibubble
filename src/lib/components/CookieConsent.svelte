<script>
  import { onMount, onDestroy } from 'svelte';
  let accepted = false;
  let el;

  onMount(() => {
    if (typeof window !== 'undefined') {
      accepted = window.localStorage.getItem('cookieConsent') === 'yes';
      // Dynamically move this element to <body>
      el = document.createElement('div');
      el.id = "cookie-consent-root";
      document.body.appendChild(el);
      updateBanner();
    }
  });

  onDestroy(() => {
    if (el && el.parentNode) el.parentNode.removeChild(el);
  });

  function acceptCookies() {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('cookieConsent', 'yes');
      accepted = true;
      updateBanner();
    }
  }

  function updateBanner() {
    if (el) {
      el.innerHTML = !accepted ? `
        <div style="
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          background: #222;
          color: #fff;
          padding: 1.1em 2em;
          z-index: 2147483647;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 1.1em;
          box-shadow: 0 -2px 12px #0006;
          border-top: 3px solid #e93c2f;
        ">
          <span>
            CIBUBBLE uses local storage for login and site preferences. By using the site, you agree to this.
            <a href="/privacy" target="_blank" rel="noopener" style="color:#e93c2f;text-decoration:underline;margin-left:0.7em;font-size:1em;">Learn more</a>.
          </span>
          <button style="background:#e93c2f;color:#fff;border:none;padding:0.5em 1.5em;border-radius:9px;font-size:1.1em;font-weight:700;cursor:pointer;margin-left:1.7em;" onclick="document.getElementById('cookie-consent-root').svelteAcceptCookies()">OK</button>
        </div>
      ` : '';
      // Make the accept function available to the raw HTML
      el.svelteAcceptCookies = acceptCookies;
    }
  }
</script>
