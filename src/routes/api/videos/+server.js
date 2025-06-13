// src/routes/api/videos/+server.js
import { json } from '@sveltejs/kit';
import { supabase } from '$lib/supabaseClient';

export async function GET({ url }) {
  const page = Number(url.searchParams.get('page') ?? 1);
  const pageSize = Number(url.searchParams.get('pageSize') ?? 30);

  // Filters
  const levels = url.searchParams.get('levels')?.split(',').filter(Boolean);
  const tags = url.searchParams.get('tags')?.split(',').filter(Boolean);
  const country = url.searchParams.get('country');
  const channel = url.searchParams.get('channel');
  const playlist = url.searchParams.get('playlist');
  const sort = url.searchParams.get('sort') ?? 'random';
  const search = url.searchParams.get('search') ?? '';

  let query = supabase
    .from('videos')
    .select('*, playlist:playlist_id(title), channel:channel_id(name,country,tags)', { count: 'exact' });

  // Filtering
  if (levels && levels.length) query = query.in('level', levels);
  if (tags && tags.length) query = query.overlaps('tags', tags); // works if tags is a Postgres array
  if (country) query = query.eq('country', country);
  if (channel) query = query.eq('channel_id', channel);
  if (playlist) query = query.eq('playlist_id', playlist);
  if (search) query = query.ilike('title', `%${search}%`);

  // Sorting (add more as needed)
  if (sort === 'new') query = query.order('created_at', { ascending: false });
  else if (sort === 'old') query = query.order('created_at', { ascending: true });
  else if (sort === 'easy') query = query.order('level', { ascending: true });
  else if (sort === 'hard') query = query.order('level', { ascending: false });
  else query = query.order('id', { ascending: false }); // fallback

  // Pagination
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  query = query.range(from, to);

  const { data, count, error } = await query;

  if (error) {
    return json({ error: error.message }, { status: 500 });
  }

  return json({
    videos: data ?? [],
    total: count ?? 0,
    hasMore: to + 1 < (count ?? 0)
  });
}
