<script>
  import { onMount } from 'svelte';
  import { supabase } from '$lib/supabaseClient';

  let user = null;
  let myVideos = [];
  let watchedVideos = [];
  let email = '';
  let newEmail = '';
  let newPassword = '';
  let message = '';
  let watchTime = 0;
  let todayWatchTime = 0;
  let activityDays = [];
  let streak = 0;

  function formatMinutes(seconds) {
    if (!seconds) return '0 min';
    const m = Math.round(seconds / 60);
    return m > 0 ? `${m} min` : `${seconds} sec`;
  }

  function barColor(mins) {
    if (mins >= 120) return '#e93c2f';
    if (mins >= 60) return '#44c366';
    if (mins >= 30) return '#f9c846';
    if (mins >= 10) return '#f7ed85';
    if (mins > 0) return '#b7f6ed';
    return '#ececec';
  }

  async function fetchRecentActivity() {
    if (!user) return;
    const today = new Date();
    const dates = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      dates.push(d.toISOString().slice(0, 10));
    }
    const fromDate = dates[0];
    const toDate = dates[dates.length - 1];
    let { data: sessions } = await supabase
      .from('watch_sessions')
      .select('date,seconds')
      .eq('user_id', user.id)
      .gte('date', fromDate)
      .lte('date', toDate);

    const map = {};
    (sessions || []).forEach((s) => {
      map[s.date] = (map[s.date] || 0) + (s.seconds || 0);
    });
    activityDays = dates.map((date) => ({
      date,
      mins: Math.round((map[date] || 0) / 60)
    }));

    streak = 0;
    for (let i = activityDays.length - 1; i >= 0; i--) {
      if (activityDays[i].mins > 0) streak++;
      else break;
    }
  }

  onMount(async () => {
    const {
      data: { session }
    } = await supabase.auth.getSession();
    if (session?.user) {
      user = session.user;
      email = user.email;
      newEmail = email;

      // Fetch user's videos
      let { data: videos } = await supabase
        .from('videos')
        .select('*')
        .eq('added_by', user.id)
        .order('created', { ascending: false });
      myVideos = videos || [];

      // --- Total watch time ---
      let { data: allSessions } = await supabase
        .from('watch_sessions')
        .select('seconds')
        .eq('user_id', user.id);
      watchTime = (allSessions ?? []).reduce((acc, s) => acc + (s.seconds || 0), 0);

      // --- Today's watch time ---
      const today = new Date().toISOString().slice(0, 10);
      let { data: todaySessions } = await supabase
        .from('watch_sessions')
        .select('seconds')
        .eq('user_id', user.id)
        .eq('date', today);
      todayWatchTime = (todaySessions ?? []).reduce((acc, s) => acc + (s.seconds || 0), 0);

      // --- Recent activity and streak ---
      await fetchRecentActivity();

      // --- Fetch watched videos ---
      let { data: watchedSessions } = await supabase
        .from('watch_sessions')
        .select('video_id, date')
        .eq('user_id', user.id);

      const videoMap = {};
      for (const ws of watchedSessions ?? []) {
        if (ws.video_id && ws.date) {
          if (!videoMap[ws.video_id] || ws.date > videoMap[ws.video_id]) {
            videoMap[ws.video_id] = ws.date;
          }
        }
      }
      const videoIds = Object.keys(videoMap);

      if (videoIds.length) {
        let { data: vids } = await supabase.from('videos').select('*').in('id', videoIds);

        watchedVideos = (vids || [])
          .map((v) => ({
            ...v,
            lastWatched: videoMap[v.id]
          }))
          .sort((a, b) => (b.lastWatched || '').localeCompare(a.lastWatched || ''));
      } else {
        watchedVideos = [];
      }
    }
  });

  async function updateEmail() {
    message = '';
    if (!newEmail || newEmail === email) {
      message = 'No change.';
      return;
    }
    const { error } = await supabase.auth.updateUser({ email: newEmail });
    if (error) {
      message = error.message;
    } else {
      message = 'Email updated! Please check your inbox to confirm.';
      email = newEmail;
    }
  }

  async function updatePassword() {
    message = '';
    if (!newPassword) {
      message = 'Password cannot be empty.';
      return;
    }
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      message = error.message;
    } else {
      message = 'Password updated!';
      newPassword = '';
    }
  }
</script>

{#if !user}
  <div class="profile-main" style="text-align:center;">
    <div style="margin:2em 0;">
      Not logged in.<br /><a href="/login" class="video-link">Login here</a>
    </div>
  </div>
{:else}
  <div class="profile-main">
    <div class="section-title">Progress</div>

    <!-- DREAMING SPANISH STYLE STATS BOXES -->
    <div class="stats-boxes-row">
      <div class="stat-box">
        <div class="stat-label">Total Watch Time</div>
        <div class="stat-value">{formatMinutes(watchTime)}</div>
      </div>
      <div class="stat-box">
        <div class="stat-label">Today's Watch Time</div>
        <div class="stat-value">{formatMinutes(todayWatchTime)}</div>
      </div>
      <div class="stat-box">
        <div class="stat-label">Streak</div>
        <div class="stat-value">
          <span style="font-size:1.5em;">🔥</span>
          {streak} day{streak === 1 ? '' : 's'}
        </div>
      </div>
      <div class="stat-box calendar-box">
        <div class="stat-label">Calendar</div>
        <div class="mini-calendar">
          {#each activityDays as d, i}
            <div
              class="calendar-day {i === activityDays.length - 1 ? 'calendar-today' : ''}"
              style="background:{barColor(d.mins)}"
              title={`Date: ${d.date}\n${d.mins} min`}
            ></div>
          {/each}
        </div>
        <div class="calendar-labels">
          {#each activityDays as d, i}
            <div>{i % 2 === 0 ? d.date.slice(5) : ''}</div>
          {/each}
        </div>
      </div>
    </div>

    <!-- HISTORY: Horizontal row, scrollable, front-page cards, no last watched, no length -->
    <div class="history-section">
      <div class="history-header">
        <span class="section-title" style="margin:0;">History</span>
        <a href="/history" class="view-all-link">View all</a>
      </div>
      {#if watchedVideos.length === 0}
        <div>No videos watched yet.</div>
      {:else}
        <div class="history-scroll-row">
          {#each watchedVideos.slice(0, 15) as v}
            <a href={`/video/${v.id}`} class="ci-card">
              <span class="ci-thumb-link">
                <img
                  class="ci-thumb-img"
                  src={v.thumbnail || '/no_thumb_nail.png'}
                  alt="Video thumbnail"
                />
              </span>
              <div class="ci-card-info">
                <span class="ci-badge {v.level}">{v.level}</span>
                <span class="ci-title" title={v.title}>{v.title}</span>
                <div class="ci-channel">{v.channel_name}</div>
              </div>
            </a>
          {/each}
        </div>
      {/if}
    </div>

    <!-- MY VIDEOS: Horizontal row, scrollable, matches History section -->
    <div class="history-section">
      <div class="history-header">
        <span class="section-title" style="margin:0;">My Videos</span>
        <a href="/my-videos" class="view-all-link">View all</a>
      </div>
      {#if myVideos.length === 0}
        <div>No videos added yet.</div>
      {:else}
        <div class="history-scroll-row">
          {#each myVideos.slice(0, 15) as v}
            <a href={`/video/${v.id}`} class="ci-card">
              <span class="ci-thumb-link">
                <img
                  class="ci-thumb-img"
                  src={v.thumbnail || '/no_thumb_nail.png'}
                  alt="Video thumbnail"
                />
              </span>
              <div class="ci-card-info">
                <span class="ci-badge {v.level}">{v.level}</span>
                <span class="ci-title" title={v.title}>{v.title}</span>
                <div class="ci-channel">{v.channel_name}</div>
              </div>
            </a>
          {/each}
        </div>
      {/if}
    </div>

    <div class="section-title">Account</div>
    <div class="profile-row"><b>Email:</b> {email}</div>
    <div>
      <input type="email" bind:value={newEmail} placeholder="New email" autocomplete="email" />
      <button on:click={updateEmail}>Change Email</button>
    </div>
    <div>
      <input
        type="password"
        bind:value={newPassword}
        placeholder="New password"
        autocomplete="new-password"
      />
      <button on:click={updatePassword}>Change Password</button>
    </div>
    <div class="message">{message}</div>
  </div>
{/if}

<style>
  .profile-main {
    max-width: 1200px;
    margin: 2.2rem auto 0 auto;
    padding: 2rem 3vw 2.3rem 3vw;
    background: #fff;
    border-radius: 14px;
    border: 1px solid #ececec;
    box-shadow: 0 2px 12px #ececec;
  }
  .section-title {
    color: #181818;
    font-size: 1.25rem;
    font-weight: bold;
    margin: 1.7em 0 1em 0;
    letter-spacing: 0.3px;
  }

  /* DREAMING SPANISH STATS BOXES */
  .stats-boxes-row {
    display: flex;
    gap: 2.1em;
    margin: 1.6em 0 2.2em 0;
    flex-wrap: wrap;
    align-items: stretch;
  }
  .stat-box {
    background: #fafafa;
    border-radius: 15px;
    box-shadow: 0 2px 16px #ececec;
    padding: 1.3em 2em 1.2em 2em;
    min-width: 172px;
    min-height: 94px;
    flex: 1 1 172px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }
  .stat-label {
    color: #aaa;
    font-size: 1.01em;
    font-weight: 600;
    letter-spacing: 0.05em;
    margin-bottom: 0.5em;
  }
  .stat-value {
    font-size: 1.5em;
    color: #222;
    font-weight: 700;
    letter-spacing: 0.01em;
    display: flex;
    align-items: center;
    gap: 0.3em;
  }
  .calendar-box {
    min-width: 210px;
    padding: 1.1em 1.3em;
    justify-content: start;
    align-items: stretch;
  }
  .mini-calendar {
    display: flex;
    gap: 3px;
    margin-bottom: 0.22em;
    margin-top: 0.4em;
    min-height: 16px;
  }
  .calendar-day {
    width: 14px;
    height: 22px;
    border-radius: 5px;
    background: #ececec;
    outline: none;
    box-shadow: 0 0 0 1px #e6e6e6;
    transition: background 0.16s;
  }
  .calendar-today {
    outline: 2px solid #2562e9;
  }
  .calendar-labels {
    display: flex;
    gap: 3px;
    font-size: 0.80em;
    color: #bbb;
    justify-content: start;
  }
  .calendar-labels > div {
    width: 14px;
    text-align: center;
  }
  @media (max-width: 820px) {
    .stats-boxes-row { flex-direction: column; gap: 1.3em; }
    .stat-box { min-width: unset; width: 100%; }
  }

  /* ----------- HISTORY (watched videos row) ----------- */
  .history-section {
    margin-top: 2.2em;
  }
  .history-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1em;
  }
  .view-all-link {
    font-size: 1em;
    color: #2562e9;
    text-decoration: none;
    font-weight: 500;
  }
  .history-scroll-row {
    display: flex;
    flex-direction: row;
    gap: 24px;
    overflow-x: auto;
    padding-bottom: 2px;
    margin-bottom: 2em;
    scrollbar-width: thin;
  }
  .history-scroll-row::-webkit-scrollbar {
    height: 8px;
    background: #f3f3f3;
  }
  .history-scroll-row::-webkit-scrollbar-thumb {
    background: #dcdcdc;
    border-radius: 8px;
  }

  .ci-card {
    background: #fff;
    border-radius: 14px;
    box-shadow: 0 2px 10px #ececec;
    min-width: 196px;
    max-width: 196px;
    flex: 0 0 196px;
    display: flex;
    flex-direction: column;
    text-align: left;
    padding: 0;
    cursor: pointer;
    transition: box-shadow 0.18s;
    font-family: Inter, Arial, sans-serif;
  }
  .ci-card:hover {
    box-shadow: 0 6px 32px #e93c2f22;
  }

  .ci-thumb-link {
    display: block;
    border-radius: 14px 14px 0 0;
    overflow: hidden;
  }
  .ci-thumb-img {
    width: 100%;
    aspect-ratio: 16/9;
    object-fit: cover;
    background: #f3f3f3;
  }

  .ci-card-info {
    padding: 0.8em 1em 1.1em 1em;
  }
  .ci-title {
    font-weight: 600;
    font-size: 1.07em;
    margin: 0.24em 0 0.09em 0;
    color: #222;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .ci-badge {
    border-radius: 8px;
    padding: 0.1em 0.48em;
    font-size: 0.87em;
    font-weight: 500;
    color: #fff;
    background: #e93c2f;
    margin-bottom: 0.1em;
    text-transform: capitalize;
    display: inline-block;
    margin-right: 0.4em;
  }
  .ci-badge.Superbeginner {
    background: #2e9be6;
  }
  .ci-badge.Beginner {
    background: #44c366;
  }
  .ci-badge.Intermediate {
    background: #e93c2f;
  }
  .ci-badge.Advanced {
    background: #f9c846;
    color: #181818;
  }
  .ci-channel {
    font-size: 0.92em;
    color: #888;
    margin-top: 0.11em;
  }
  @media (max-width: 600px) {
    .ci-card,
    .history-scroll-row {
      min-width: 150px;
      max-width: 150px;
    }
    .ci-thumb-img {
      aspect-ratio: 16/9;
    }
  }
</style>
