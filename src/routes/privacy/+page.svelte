<script>
  // Still nothing fancy needed!
</script>

<div class="privacy-layout">
  <h1 class="privacy-title">Privacy Policy</h1>
  <div class="privacy-meta">Last updated: June 2025</div>

  <div class="privacy-card">
    <p>
      CIBUBBLE (“we”, “our”, or “us”) values your privacy. This policy explains how we collect, use, and store your information when you use our website.
    </p>

    <h2>What We Collect</h2>
    <ul>
      <li><strong>Email address:</strong> If you sign up for an account, we collect your email to create and manage your profile.</li>
      <li><strong>Login Information:</strong> We use Supabase for authentication. Supabase stores authentication tokens in your browser (local storage or cookies).</li>
      <li><strong>Preferences:</strong> We store your language, theme, and video preferences in your browser (local storage) to personalize your experience.</li>
      <li><strong>Analytics (Optional):</strong> We do not use Google Analytics or third-party analytics tools at this time. If this changes, this policy will be updated and you’ll be notified.</li>
    </ul>

    <h2>How We Use Your Data</h2>
    <ul>
      <li>To manage your account and allow you to log in.</li>
      <li>To track your progress and personalize the site.</li>
      <li>To maintain site security and prevent abuse.</li>
    </ul>

    <h2>Cookies & Local Storage</h2>
    <p>
      We use cookies and local storage to keep you logged in and save your settings (like theme and language). These are required for the site to function.
    </p>

    <h2>How We Share Data</h2>
    <ul>
      <li>We do not sell or share your personal data with advertisers or third parties.</li>
      <li>Your account data is stored securely by our backend provider (Supabase).</li>
      <li>If required by law, we may provide data to legal authorities.</li>
    </ul>

    <h2>Data Retention</h2>
    <ul>
      <li>Your data is kept as long as you have an account. You can request deletion any time by contacting us.</li>
    </ul>

    <h2>Your Rights</h2>
    <ul>
      <li>You can request your data or ask for deletion at any time.</li>
      <li>Email <a href="mailto:support@cibubble.com">support@cibubble.com</a> for any privacy questions.</li>
    </ul>

    <h2>Contact</h2>
    <p>
      For questions or concerns, email <a href="mailto:support@cibubble.com">support@cibubble.com</a>.
    </p>

    <p>
      <strong>By using CIBUBBLE, you agree to this privacy policy.</strong>
    </p>
  </div>
</div>

<style>
  .privacy-layout {
    max-width: 800px;
    margin: 2.2em auto 2em auto;
    padding: 0 1.3em;
    display: flex;
    flex-direction: column;
    align-items: center;
    min-height: 65vh;
  }
  .privacy-title {
    font-size: 2.1rem;
    font-weight: 900;
    letter-spacing: 0.13em;
    color: #232338;
    text-align: center;
    margin-bottom: 0.5em;
    text-transform: uppercase;
  }
  .privacy-meta {
    font-size: 1em;
    color: #8787a0;
    margin-bottom: 2.1em;
    text-align: center;
  }
  .privacy-card {
    background: #fff;
    border-radius: 20px;
    box-shadow: 0 3px 22px 0 #e9eaee18;
    border: 1.2px solid #ededf2;
    padding: 2em 2.2em 2.2em 2.2em;
    font-size: 1.09em;
    color: #353553;
    line-height: 1.65;
    width: 100%;
    max-width: 720px;
  }
  .privacy-card h2 {
    font-size: 1.13em;
    color: #5c6274;
    font-weight: 800;
    margin-top: 1.55em;
    margin-bottom: 0.49em;
    letter-spacing: 0.09em;
    text-transform: uppercase;
  }
  .privacy-card ul {
    margin-bottom: 1.2em;
    margin-top: 0.3em;
    padding-left: 1.1em;
  }
  .privacy-card li {
    margin-bottom: 0.44em;
    font-size: 1em;
  }
  .privacy-card a {
    color: #e93c2f;
    text-decoration: underline dotted #e93c2f77 1.3px;
    font-weight: 700;
    transition: color 0.15s;
  }
  .privacy-card a:hover,
  .privacy-card a:focus {
    color: #fd6c6c;
    text-decoration: underline;
  }
  .privacy-card strong {
    color: #232338;
    font-weight: 800;
  }

  @media (max-width: 600px) {
    .privacy-layout {
      padding: 0 0.15em;
      margin: 1.1em 0 1em 0;
    }
    .privacy-title {
      font-size: 1.25rem;
      letter-spacing: 0.06em;
      margin-bottom: 0.27em;
    }
    .privacy-meta {
      font-size: 0.92em;
      margin-bottom: 1.2em;
    }
    .privacy-card {
      padding: 1.1em 0.7em 1.2em 0.7em;
      font-size: 0.97em;
      border-radius: 12px;
    }
    .privacy-card h2 {
      font-size: 1em;
      margin-top: 1.1em;
      margin-bottom: 0.3em;
    }
    .privacy-card ul {
      padding-left: 1em;
    }
    .privacy-card li {
      font-size: 0.98em;
      margin-bottom: 0.24em;
    }
  }

  :global(body.dark) .privacy-card {
    background: #232338;
    color: #efeff9;
    border: 1.2px solid #303054;
  }
  :global(body.dark) .privacy-title {
    color: #fff;
  }
  :global(body.dark) .privacy-meta {
    color: #bfc3d7;
  }
  :global(body.dark) .privacy-card h2 {
    color: #aabbee;
  }
  :global(body.dark) .privacy-card strong {
    color: #fff;
  }
</style>
