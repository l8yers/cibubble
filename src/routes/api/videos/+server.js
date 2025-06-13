// src/routes/api/videos/+server.js
import { json } from '@sveltejs/kit';
import { supabase } from '$lib/supabaseClient';

export async function GET({ url }) {
  const pageSize = Number(url.searchParams.get('pageSize') ?? 30);

  // Filters
  const levels = url.searchParams.get('levels')?.split(',').filter(Boolean);
  const tags = url.searchParams.get('tags')?.split(',').filter(Boolean);
  const country = url.searchParams.get('country');
  const channel = url.searchParams.get('channel');
  const playlist = url.searchParams.get('playlist');
  const sort = url.searchParams.get('sort') ?? 'random';
  const search = url.searchParams.get('search') ?? '';

  // --- RANDOM LOGIC ---
  if (sort === 'random') {
    // 1. Get all IDs matching filters
    let idQuery = supabase.from('videos').select('id', { count: 'exact' });
    if (levels && levels.length) idQuery = idQuery.in('level', levels);
    if (tags && tags.length) idQuery = idQuery.overlaps('tags', tags);
    if (country) idQuery = idQuery.eq('country', country);
    if (channel) idQuery = idQuery.eq('channel_id', channel);
    if (playlist) idQuery = idQuery.eq('playlist_id', playlist);
    if (search) idQuery = idQuery.ilike('title', `%${search}%`);

    const { data: idsData, count, error: idError } = await idQuery;

    if (idError) {
      return json({ error: idError.message }, { status: 500 });
    }
    if (!idsData || idsData.length === 0) {
      return json({ videos: [], total: 0, hasMore: true });
    }

    // 2. Randomly pick up to pageSize IDs
    function shuffle(arr) {
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr;
    }
    const shuffled = shuffle([...idsData]);
    const chosenIds = shuffled.slice(0, pageSize).map(obj => obj.id);

    // 3. Fetch full video rows for these IDs
    let dataQuery = supabase
      .from('videos')
      .select('*, playlist:playlist_id(title), channel:channel_id(name,country,tags)')
      .in('id', chosenIds);

    const { data, error } = await dataQuery;

    if (error) {
      return json({ error: error.message }, { status: 500 });
    }

    // (Optional: randomize result order to match chosenIds, not DB)
    const idToVideo = Object.fromEntries(data.map(v => [v.id, v]));
    const sortedVideos = chosenIds.map(id => idToVideo[id]).filter(Boolean);

    return json({
      videos: sortedVideos,
      total: count ?? 0,
      hasMore: true // No real paging for random, but you could add more logic here
    });
  }

  // --- NON-RANDOM LOGIC (unchanged) ---
  const page = Number(url.searchParams.get('page') ?? 1);
  let query = supabase
    .from('videos')
    .select('*, playlist:playlist_id(title), channel:channel_id(name,country,tags)', { count: 'exact' });

  if (levels && levels.length) query = query.in('level', levels);
  if (tags && tags.length) query = query.overlaps('tags', tags);
  if (country) query = query.eq('country', country);
  if (channel) query = query.eq('channel_id', channel);
  if (playlist) query = query.eq('playlist_id', playlist);
  if (search) query = query.ilike('title', `%${search}%`);

  if (sort === 'new') query = query.order('created_at', { ascending: false });
  else if (sort === 'old') query = query.order('created_at', { ascending: true });
  else if (sort === 'easy') query = query.order('level', { ascending: true });
  else if (sort === 'hard') query = query.order('level', { ascending: false });
  else query = query.order('id', { ascending: false }); // fallback

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
