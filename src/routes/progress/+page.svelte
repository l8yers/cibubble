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
    // Last 14 days
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

    // Sum seconds for each day
    const map = {};
    (sessions || []).forEach(s => {
      map[s.date] = (map[s.date] || 0) + (s.seconds || 0);
    });
    activityDays = dates.map(date => ({
      date,
      mins: Math.round((map[date] || 0) / 60)
    }));

    // Streak
    streak = 0;
    for (let i = activityDays.length - 1; i >= 0; i--) {
      if (activityDays[i].mins > 0) streak++;
      else break;
    }
  }

  onMount(async () => {
    const { data: { session } } = await supabase.auth.getSession();
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

      // Use latest date per video for sorting
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
        let { data: vids } = await supabase
          .from('videos')
          .select('*')
          .in('id', videoIds);

        // Attach last watched date for sorting
        watchedVideos = (vids || []).map(v => ({
          ...v,
          lastWatched: videoMap[v.id]
        }))
        // Sort by most recent watch
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
.stats-row {
  color: #222;
  font-size: 1.07em;
  margin-bottom: 0.7em;
}
.streak-row {
  font-size: 1em;
  color: #2562e9;
  margin-bottom: 0.7em;
  font-weight: 500;
}
.activity-bar-graph {
  display: flex;
  gap: 8px;
  align-items: end;
  margin: 1.1em 0 0.2em 0;
  height: 54px;
}
.activity-bar {
  width: 24px;
  border-radius: 5px 5px 2px 2px;
  background: #ececec;
  position: relative;
  transition: height 0.2s, background 0.2s;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  cursor: pointer;
}
.activity-bar-today {
  outline: 2px solid #2562e9;
  box-shadow: 0 0 0 2px #e8e8fa;
}
.activity-labels {
  display: flex;
  gap: 8px;
  margin-top: 3px;
  font-size: 0.91em;
  color: #888;
  justify-content: start;
}
.profile-row {
  margin-bottom: 1.3em;
}
input[type="email"],
input[type="password"] {
  width: 100%;
  padding: 0.7em 1em;
  font-size: 1.07rem;
  border: 1px solid #ececec;
  border-radius: 8px;
  background: #fafafa;
  margin-bottom: 0.9em;
  color: #181818;
}
button {
  padding: 0.6em 1.7em;
  font-size: 1.04rem;
  background: #e93c2f;
  color: #fff;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  margin-right: 1em;
  margin-bottom: 0.5em;
  transition: background 0.18s;
}
button:hover {
  background: #b8271b;
}
.message {
  color: #26890d;
  margin-bottom: 1em;
  min-height: 1.5em;
}
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
.history-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 18px;
  margin-bottom: 1em;
}
@media (max-width: 1100px) {
  .history-grid { grid-template-columns: repeat(4, 1fr); }
}
@media (max-width: 900px) {
  .history-grid { grid-template-columns: repeat(3, 1fr); }
}
@media (max-width: 700px) {
  .history-grid { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 500px) {
  .history-grid { grid-template-columns: 1fr; }
}
.video-card {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 1.5px 7px #ececec;
  min-width: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  transition: box-shadow 0.15s;
}
.video-card:hover {
  box-shadow: 0 4px 24px #e93c2f33;
}
.thumb-link {
  display: block;
  border-radius: 12px 12px 0 0;
  overflow: hidden;
}
.thumbnail {
  width: 100%;
  aspect-ratio: 16/9;
  object-fit: cover;
}
.video-info {
  padding: 0.5em 0.8em 0.8em 0.8em;
}
.video-title {
  font-weight: 500;
  font-size: 0.99em;
  margin-bottom: 0.3em;
  color: #1b2028;
  line-height: 1.18;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.video-meta {
  display: flex;
  align-items: center;
  gap: 0.4em;
  margin-bottom: 0.1em;
}
.badge {
  border-radius: 8px;
  padding: 0.10em 0.45em;
  font-size: 0.81em;
  font-weight: 500;
  color: #fff;
  background: #e93c2f;
  text-transform: capitalize;
}
.badge.Superbeginner { background: #2e9be6; }
.badge.Beginner { background: #44c366; }
.badge.Intermediate { background: #e93c2f; }
.badge.Advanced { background: #f9c846; color: #181818; }
.video-length {
  background: #ececec;
  color: #333;
  border-radius: 6px;
  font-size: 0.83em;
  padding: 0.04em 0.6em;
  margin-left: 0.1em;
}
.video-channel {
  font-size: 0.89em;
  color: #666;
}
.watched-date {
  font-size: 0.81em;
  color: #aaa;
  margin-top: 0.17em;
}
.videos-list {
  margin-top: 1em;
  padding-left: 0;
  list-style: none;
}
.video-item {
  margin-bottom: 0.6em;
  border-bottom: 1px solid #ececec;
  padding-bottom: 0.7em;
}
.video-link {
  color: #e93c2f;
  text-decoration: none;
  font-weight: 500;
}
.video-link:hover {
  text-decoration: underline;
  color: #181818;
}
</style>

{#if !user}
  <div class="profile-main" style="text-align:center;">
    <div style="margin:2em 0;">Not logged in.<br/><a href="/login" class="video-link">Login here</a></div>
  </div>
{:else}
  <div class="profile-main">
    <div class="section-title">Progress</div>

    <!-- Stats and graph at the top -->
    <div class="stats-row"><b>Total watch time:</b> {formatMinutes(watchTime)}</div>
    <div class="stats-row"><b>Today's watch time:</b> {formatMinutes(todayWatchTime)}</div>
    <div class="streak-row">
      🔥 <b>Streak:</b> {streak} day{streak === 1 ? '' : 's'} active
    </div>

    <div style="font-size:0.98em; color:#888; margin-bottom:0.2em;">Minutes watched per day (last 14 days)</div>
    <div class="activity-bar-graph">
      {#each activityDays as d, i}
        <div
          class="activity-bar {i === activityDays.length - 1 ? 'activity-bar-today' : ''}"
          style="height:{Math.min(d.mins, 120)/1.2}px; background:{barColor(d.mins)}"
          title={`Date: ${d.date}\n${d.mins} min`}
        ></div>
      {/each}
    </div>
    <div class="activity-labels">
      {#each activityDays as d, i}
        <div style="width:24px; text-align:center">
          {i % 2 === 0 ? d.date.slice(5) : ''}
        </div>
      {/each}
    </div>
    <div style="font-size:0.87em; color:#aaa; margin-top:0.2em;">Days (oldest &rarr; today)</div>

    <!-- Watched Videos (as a 5-wide compact grid) -->
    <div class="history-section">
      <div class="history-header">
        <span class="section-title" style="margin:0;">History</span>
        <a href="/history" class="view-all-link">View all</a>
      </div>
      {#if watchedVideos.length === 0}
        <div>No videos watched yet.</div>
      {:else}
        <div class="history-grid">
          {#each watchedVideos.slice(0, 15) as v}
            <div class="video-card">
              <a href={`/video/${v.id}`} class="thumb-link">
                <img class="thumbnail" src={v.thumbnail || '/no_thumb_nail.png'} alt="Video thumbnail" />
              </a>
              <div class="video-info">
                <div class="video-title" title={v.title}>{v.title}</div>
                <div class="video-meta">
                  <span class="badge {v.level}">{v.level}</span>
                  <span class="video-length">{formatMinutes(v.length)}</span>
                </div>
                <div class="video-channel">{v.channel_name}</div>
                <div class="watched-date">Last watched: {v.lastWatched}</div>
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </div>

    <div class="section-title">My Videos</div>
    {#if myVideos.length === 0}
      <div>No videos added yet.</div>
    {:else}
      <ul class="videos-list">
        {#each myVideos as v}
          <li class="video-item">
            <a href={`/video/${v.id}`} class="video-link">{v.title}</a>
            <div style="color:#888; font-size:0.94em;">{v.channel_name}</div>
          </li>
        {/each}
      </ul>
    {/if}

    <div class="section-title">Account</div>
    <div class="profile-row"><b>Email:</b> {email}</div>
    <div>
      <input type="email" bind:value={newEmail} placeholder="New email" autocomplete="email" />
      <button on:click={updateEmail}>Change Email</button>
    </div>
    <div>
      <input type="password" bind:value={newPassword} placeholder="New password" autocomplete="new-password" />
      <button on:click={updatePassword}>Change Password</button>
    </div>
    <div class="message">{message}</div>
  </div>
{/if}
