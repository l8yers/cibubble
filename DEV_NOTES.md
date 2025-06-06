# CIBUBBLE – DEV NOTES

## What Works

- Supabase auth (users can sign up/in/out)
- User profiles (one per user)
- Users can add YouTube videos, playlists, and channels
- Videos are deduplicated, with full metadata fetched from YT API
- Responsive homepage grid with thumbnails, titles, difficulty, channel info
- Clicking video opens a player page
- Deployed to Vercel, custom domain, all env vars set

## What Needs Work

- **Watch time tracking**
  - Currently records watch time but is not accurate (see below)
  - Not reliably updating or aggregating on profile page

## Current Watch Logging Logic

- Player page uses JS timer (`setInterval`) to count seconds while playing
- On pause/tab close, calls API to save seconds watched to `watch_logs` table
- Profile page tries to aggregate total watch time per user/video

**Problems Noted:**
- May double-count or miss seconds on fast tab switches
- Not always saving on tab close if user navigates away quickly
- Need to aggregate all sessions (rows) in `watch_logs` for profile display

## Plan to Fix

1. **Improve Player Page Logic**
    - Use `visibilitychange` and `beforeunload` events for reliable saving
    - Only increment counter when state is `PLAYING`
    - On save, upsert to `watch_logs` or keep appending (aggregate later)
2. **Profile Aggregation**
    - Query `watch_logs` for all rows for the current user
    - Sum up `watched_seconds` for each video, display on profile

## Table Schemas

### Table: videos

| Field         | Type                      | Notes                     |
|---------------|---------------------------|---------------------------|
| id            | text, primary key         | YouTube video ID          |
| youtubeurl    | text                      | Full YouTube URL          |
| title         | text                      | Video title               |
| duration      | text                      | ISO8601                   |
| thumbnail     | text                      | URL                       |
| rating        | text                      | beginner/intermediate/etc |
| addedat       | timestamp with time zone  | Default: now()            |
| channeltitle  | text                      | Channel name              |
| channelid     | text                      | Channel ID                |

### Table: watch_logs

| Field          | Type                      | Notes                  |
|----------------|--------------------------|------------------------|
| id             | uuid, primary key         |                        |
| user_id        | uuid                      | Supabase auth UID      |
| video_id       | text                      | Foreign key to videos  |
| watched_seconds| integer                   |                        |
| watched_at     | timestamp with time zone  | Default: now()         |

## Known Pitfalls

- **Supabase/Postgres:** All column names are lowercase
- **RLS:** Needs insert/select policies for tables if RLS enabled
- **Supabase schema cache:** Can lag after altering tables/columns
- **YouTube API Quota:** High-volume fetches may hit limits

## Next Steps

1. Fix watch logging and aggregation for profile stats
2. Add more filters, search, and user UX polish
3. Create `dev` branch for ongoing changes

## Deploy/Branching Workflow

- Push `main` branch to deploy to Vercel
- Use `dev` branch for all new features, PR to `main` when ready

_Last updated: 2025-06-06_
