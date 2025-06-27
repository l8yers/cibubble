<script>
  import { onMount } from 'svelte';
  import { user, loadUser } from '$lib/stores/user.js';
  import ProgressHistory from '$lib/components/progress/ProgressHistory.svelte';
  import { writable } from 'svelte/store';
  import * as utils from '$lib/utils/utils.js';

  export const windowWidth = writable(typeof window !== 'undefined' ? window.innerWidth : 1200);

  let watchedVideos = [];
  let showSaved = true; // Placeholder for toggle if needed

  onMount(() => {
    const updateWidth = () => windowWidth.set(window.innerWidth);
    window.addEventListener('resize', updateWidth);
    updateWidth();
    loadUser();
    fetchWatched();
    return () => window.removeEventListener('resize', updateWidth);
  });

  async function fetchWatched() {
    // TODO: Replace with actual fetching logic, this is placeholder
    watchedVideos = [];
  }
</script>

{#if $user === undefined}
  <div style="text-align:center; margin:3em;">Loading...</div>
{:else if !$user}
  <div class="profile-main" style="text-align:center;">
    <div style="margin:2em 0;">
      Not logged in.<br /><a href="/login" class="video-link">Login here</a>
    </div>
  </div>
{:else}
  <div class="profile-main">
    <div class="profile-header-row">
      <div class="section-title">Saved Videos</div>
    </div>
    <!-- Saved Videos Row Placeholder -->
    <div class="saved-videos-row" style="margin-bottom:2em;">
      [Saved videos row coming soon...]
    </div>

    <ProgressHistory {watchedVideos} {utils} />
  </div>
{/if}

<style>
.profile-main {
  max-width: 1700px;
  margin: 2.2rem auto 2.2rem auto;
  padding: 2rem 3vw 2.3rem 3vw;
  background: #fff;
  border-radius: 14px;
  border: 1px solid #ececec;
}
.profile-header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.6em;
  gap: 2em;
}
.section-title {
  color: #181818;
  font-size: 1.25rem;
  font-weight: bold;
  letter-spacing: 0.3px;
}
.video-link {
  color: #2562e9;
  text-decoration: underline;
  font-weight: 500;
}
.saved-videos-row {
  min-height: 80px;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  background: #fafafd;
  border-radius: 11px;
  border: 1px solid #e9eaf0;
  padding: 1.4em 1.1em;
  font-size: 1.08em;
  color: #767676;
  margin-bottom: 2.1em;
}
@media (max-width: 600px) {
  .profile-main {
    padding: 1.1rem 0.6rem 1.3rem 0.6rem;
    border-radius: 0;
    margin: 0;
  }
  .profile-header-row {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1em;
    gap: 0.7em;
    font-size: 0.9rem;
  }
  .saved-videos-row {
    padding: 1em 0.6em;
    font-size: 1em;
    margin-bottom: 1.5em;
  }
}

</style>
