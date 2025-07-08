<script>
  import { user, userLoading, authChecked } from '$lib/stores/user.js';
  import { profile, profileLoading } from '$lib/stores/profile.js';
</script>

<h2>Admin Profile Store Test</h2>

<div>
  <strong>Auth Status:</strong><br>
  authChecked: {$authChecked ? 'true' : 'false'}<br>
  userLoading: {$userLoading ? 'true' : 'false'}<br>
  user: <pre style="display:inline;">{JSON.stringify($user, null, 2)}</pre>
</div>

<hr>

<div>
  <strong>Profile Row:</strong><br>
  profileLoading: {$profileLoading ? 'true' : 'false'}<br>
  profile: <pre style="display:inline;">{JSON.stringify($profile, null, 2)}</pre>
</div>

<hr>

{#if !$authChecked}
  <div>Checking authentication...</div>
{:else if $userLoading}
  <div>Loading user...</div>
{:else if !$user}
  <div>Not logged in</div>
{:else if $profileLoading}
  <div>Loading profile...</div>
{:else if !$profile}
  <div>No profile row found for this user.</div>
{:else}
  <div>
    <strong>is_admin:</strong>
    {$profile.is_admin === true
      ? '✅ TRUE'
      : $profile.is_admin === false
        ? '❌ FALSE'
        : String($profile.is_admin)}
  </div>
  {#if $profile.is_admin === true}
    <div style="color:green; font-weight:bold; font-size:1.3em; margin-top:1em;">
      ADMIN PANEL GOES HERE
    </div>
  {:else}
    <div style="color:#b22222;font-weight:bold;font-size:1.1em; margin-top:1em;">
      Not allowed (admin only).
    </div>
  {/if}
{/if}
