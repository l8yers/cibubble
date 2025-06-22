import { supabase } from '../supabaseClient.js';

// Main paginated/filterable video fetch
export async function fetchVideos({
  page = 1,
  pageSize = 50,
  levels = [],
  tags = [],
  country = '',
  channel = '',
  playlist = '',
  sort = 'new',
  search = ''
} = {}) {
  let query = supabase
    .from('videos')
    .select('*, playlist:playlist_id(title), channel:channel_id(name,country,tags)');

  // Filters
  if (levels.length) {
    query = query.in('level', levels);
  }
  if (tags.length) {
    // Assuming tags stored as array or JSONB; adjust if stored differently
    tags.forEach(tag => {
      query = query.contains('tags', [tag]);
    });
  }
  if (country) {
    query = query.eq('country', country);
  }
  if (channel) {
    // Support multiple channels via CSV string or single ID
    if (channel.includes(',')) {
      query = query.in('channel_id', channel.split(','));
    } else {
      query = query.eq('channel_id', channel);
    }
  }
  if (playlist) {
    query = query.eq('playlist_id', playlist);
  }
  if (search) {
    // Simple title search, case-insensitive
    query = query.ilike('title', `%${search}%`);
  }

  // Sorting — FIXED to use published date (when video was published)
  if (sort === 'new') {
    query = query.order('published', { ascending: false });
  } else if (sort === 'old') {
    query = query.order('published', { ascending: true });
  } else if (sort === 'random') {
    // Random sort not supported natively by Supabase/Postgres, can shuffle client-side if needed
  }

  // Pagination
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  query = query.range(from, to);

  const { data, error, count } = await query;
  if (error) throw new Error(error.message);

  // Check if more results available for pagination
  const hasMore = data.length === pageSize;

  return { videos: data, hasMore };
}

// Optional: Fetch all videos (legacy or admin usage)
export async function fetchAllVideos() {
  return await supabase
    .from('videos')
    .select('*, playlist:playlist_id(title), channel:channel_id(name,country,tags)')
    .limit(2000);
}

// Fetch newest video per channel (from your materialized view or similar)
export async function fetchNewestPerChannel(limit = 50) {
  let { data, error } = await supabase
    .from('newest_per_channel')
    .select('*, playlist:playlist_id(title), channel:channel_id(name,country,tags)')
    .order('published', { ascending: false }) // also order by published here
    .limit(limit);

  if (error) throw new Error(error.message);
  return { videos: data };
}
