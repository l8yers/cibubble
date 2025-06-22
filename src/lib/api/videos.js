// src/lib/api/videos.js
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
    // 'tags' is assumed to be an array, and in DB as a string/array
    // For proper tag filtering you may need to adjust logic if tags is CSV/text in DB
    tags.forEach(tag => {
      query = query.contains('tags', [tag]);
    });
  }
  if (country) {
    query = query.eq('country', country);
  }
  if (channel) {
    // channel can be CSV of IDs, or just one
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
    // naive search, adjust for your columns
    query = query.ilike('title', `%${search}%`);
  }

  // Sorting
  if (sort === 'new') {
    query = query.order('created_at', { ascending: false });
  } else if (sort === 'old') {
    query = query.order('created_at', { ascending: true });
  } else if (sort === 'random') {
    // Supabase doesn't support random, you could shuffle on client or use a Postgres function
  } // add more sort options as needed

  // Pagination
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  query = query.range(from, to);

  const { data, error, count } = await query;
  if (error) throw new Error(error.message);

  // Optional: Support "hasMore" logic
  const hasMore = data.length === pageSize;

  return { videos: data, hasMore };
}

// (Optional: Keep your old full dump fetch)
export async function fetchAllVideos() {
  return await supabase
    .from('videos')
    .select('*, playlist:playlist_id(title), channel:channel_id(name,country,tags)')
    .limit(2000);
}
