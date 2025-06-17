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
  const sort = url.searchParams.get('sort') ?? 'new';
  const search = url.searchParams.get('search') ?? '';

  if (Array.isArray(levels) && levels.length === 0) {
    return json({ videos: [], total: 0, hasMore: false });
  }

  // --- RANDOM LOGIC ---
  if (sort === 'random') {
    let idQuery = supabase.from('videos').select('id', { count: 'exact' });
    if (levels && levels.length) idQuery = idQuery.in('level', levels);
    if (tags && tags.length) idQuery = idQuery.overlaps('tags', tags);
    if (country) idQuery = idQuery.eq('country', country);

    // PATCH: channel as list or eq
    if (channel) {
      const channelList = channel.split(',').filter(Boolean);
      if (channelList.length > 1) {
        idQuery = idQuery.in('channel_id', channelList);
      } else {
        idQuery = idQuery.eq('channel_id', channelList[0]);
      }
    }

    if (playlist) idQuery = idQuery.eq('playlist_id', playlist);
    if (search) idQuery = idQuery.ilike('title', `%${search}%`);

    const { data: idsData, count, error: idError } = await idQuery;

    if (idError) return json({ error: idError.message }, { status: 500 });
    if (!idsData || idsData.length === 0) return json({ videos: [], total: 0, hasMore: true });

    const shuffled = idsData.sort(() => 0.5 - Math.random());
    const chosenIds = shuffled.slice(0, pageSize).map(obj => obj.id);

    let dataQuery = supabase
      .from('videos')
      .select('*, playlist:playlist_id(title), channel:channel_id(name,country,tags)')
      .in('id', chosenIds);

    if (levels && levels.length) dataQuery = dataQuery.in('level', levels);
    if (tags && tags.length) dataQuery = dataQuery.overlaps('tags', tags);
    if (country) dataQuery = dataQuery.eq('country', country);

    // PATCH: channel as list or eq
    if (channel) {
      const channelList = channel.split(',').filter(Boolean);
      if (channelList.length > 1) {
        dataQuery = dataQuery.in('channel_id', channelList);
      } else {
        dataQuery = dataQuery.eq('channel_id', channelList[0]);
      }
    }

    if (playlist) dataQuery = dataQuery.eq('playlist_id', playlist);
    if (search) dataQuery = dataQuery.ilike('title', `%${search}%`);

    const { data, error } = await dataQuery;
    if (error) return json({ error: error.message }, { status: 500 });

    const idToVideo = Object.fromEntries(data.map(v => [v.id, v]));
    const sortedVideos = chosenIds.map(id => idToVideo[id]).filter(Boolean);

    return json({
      videos: sortedVideos,
      total: count ?? 0,
      hasMore: true
    });
  }

  // --- NON-RANDOM LOGIC ---
  const page = Number(url.searchParams.get('page') ?? 1);
  let query = supabase
    .from('videos')
    .select('*, playlist:playlist_id(title), channel:channel_id(name,country,tags)', { count: 'exact' });

  if (levels && levels.length) query = query.in('level', levels);
  if (tags && tags.length) query = query.overlaps('tags', tags);
  if (country) query = query.eq('country', country);

  // PATCH: channel as list or eq
  if (channel) {
    const channelList = channel.split(',').filter(Boolean);
    if (channelList.length > 1) {
      query = query.in('channel_id', channelList);
    } else {
      query = query.eq('channel_id', channelList[0]);
    }
  }

  if (playlist) query = query.eq('playlist_id', playlist);
  if (search) query = query.ilike('title', `%${search}%`);

  if (sort === 'new') {
    query = query.order('published', { ascending: false });
  } else if (sort === 'old') {
    query = query.order('published', { ascending: true });
  } else if (sort === 'short') {
    query = query.order('length', { ascending: true });
  } else if (sort === 'long') {
    query = query.order('length', { ascending: false });
  } else {
    query = query.order('id', { ascending: false });
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  query = query.range(from, to);

  const { data, count, error } = await query;
  if (error) return json({ error: error.message }, { status: 500 });

  return json({
    videos: data ?? [],
    total: count ?? 0,
    hasMore: to + 1 < (count ?? 0)
  });
}
