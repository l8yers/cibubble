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
    const params = {
      p_levels: levels?.length ? levels : null,
      p_tags: tags?.length ? tags : null,
      p_country: country || null,
      p_channel_ids: channel ? channel.split(',').filter(Boolean) : null,
      p_playlist: playlist || null,
      p_search: search || null,
      p_limit: pageSize
    };

    const { data, error } = await supabase.rpc('random_one_per_channel', params);

    if (error) return json({ error: error.message }, { status: 500 });

    return json({
      videos: data ?? [],
      total: data?.length ?? 0,
      hasMore: false // or data.length === pageSize if you want to allow more paging
    });
  }

  // --- NON-RANDOM LOGIC --- (unchanged)
  const page = Number(url.searchParams.get('page') ?? 1);
  let query = supabase
    .from('videos')
    .select('*, playlist:playlist_id(title), channel:channel_id(name,country,tags)', { count: 'exact' });

  if (levels && levels.length) query = query.in('level', levels);
  if (tags && tags.length) query = query.overlaps('tags', tags);
  if (country) query = query.eq('country', country);

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
  total: data?.length ?? 0,
  hasMore: true  // <-- always true for random, so button stays
});
}
