import { json } from '@sveltejs/kit';
import { supabase } from '$lib/supabaseClient';

export async function GET({ url }) {
  try {
    // Log incoming query params and context
    console.log('---- API CALL /api/videos ----');
    console.log('Raw search:', url.search);
    const paramsObj = Object.fromEntries(url.searchParams.entries());
    console.log('Query params:', paramsObj);

    const pageSize = Number(url.searchParams.get('pageSize') ?? 30);

    // Filters
    const levelsParam = url.searchParams.get('levels');
    const levels = levelsParam && levelsParam.trim().length > 0
      ? levelsParam.split(',').filter(Boolean)
      : null;
    const tags = url.searchParams.get('tags')?.split(',').filter(Boolean);
    const country = url.searchParams.get('country');
    const channel = url.searchParams.get('channel');
    const playlist = url.searchParams.get('playlist');
    const sort = url.searchParams.get('sort') ?? 'new';
    const search = url.searchParams.get('search') ?? '';

    // Log decoded filter values
    console.log({ sort, levels, tags, country, channel, playlist, search });

    // --- RANDOM: Use random_videos only ---
    if (sort === 'random') {
      const params = {
        p_levels: levels && levels.length ? levels : null,
        // p_tags: tags?.length ? tags : null,
        // p_country: country || null,
        // p_channel_ids: channel ? channel.split(',').filter(Boolean) : null,
        // p_playlist: playlist || null,
        // p_search: search || null,
        p_limit: pageSize
      };
      console.log("Calling Supabase RPC random_videos with", params);
      const { data, error } = await supabase.rpc('random_videos', params);
      if (error) {
        console.error('Supabase RPC random_videos error:', error);
        return json({ error: error.message }, { status: 500 });
      }
      // Log sample returned
      console.log("Random videos returned:", (data || []).slice(0,2));
      return json({
        videos: data ?? [],
        total: data?.length ?? 0,
        hasMore: true // For "random", always allow Load More
      });
    }

    // --- LATEST: Get the latest video from each channel and sort by published desc ---
    if (sort === 'latest') {
      const page = Number(url.searchParams.get('page') ?? 1);
      const pageSize = Number(url.searchParams.get('pageSize') ?? 50);
      const offset = (page - 1) * pageSize;
      const params = {
        p_levels: levels && levels.length ? levels : null,
        p_tags: tags?.length ? tags : null,
        p_country: country || null,
        p_channel_ids: channel ? channel.split(',').filter(Boolean) : null,
        p_playlist: playlist || null,
        p_search: search || null,
        p_limit: pageSize,
        p_offset: offset
      };
      console.log("Calling Supabase RPC latest_one_per_channel_paged with", params);

      const { data, error } = await supabase.rpc('latest_one_per_channel_paged', params);

      if (error) {
        console.error('Supabase RPC latest_one_per_channel_paged error:', error);
        return json({ error: error.message }, { status: 500 });
      }

      // Log sample returned
      console.log("Latest videos returned:", (data || []).slice(0,2));
      return json({
        videos: data ?? [],
        total: data?.length ?? 0,
        hasMore: (data?.length ?? 0) === pageSize
      });
    }

    // --- NON-RANDOM: Standard paginated query ---
    const page = Number(url.searchParams.get('page') ?? 1);
    let query = supabase
      .from('videos')
      .select('*, playlist:playlist_id(title), channel:channel_id(name,country,tags)', { count: 'exact' });

    // PATCH: Only filter by level if levels is non-null and non-empty
    if (levels && levels.length) query = query.in('level', levels);

    // --- PATCH: Channel tags filter ---
    let channelIdsByTag = null;
    if (tags && tags.length) {
      // Find all channels with ANY of the requested tags
      const { data: tagChannels, error: tagChErr } = await supabase
        .from('channels')
        .select('id,tags');

      if (tagChErr) {
        console.error('Supabase tagChannels error:', tagChErr);
        return json({ error: tagChErr.message }, { status: 500 });
      }

      // Filter channels whose tags array (or comma string) matches ANY requested tag
      const normalizedTags = tags.map(t => t.toLowerCase().trim());
      channelIdsByTag = (tagChannels || [])
        .filter(ch => {
          if (!ch.tags) return false;
          const chTags = Array.isArray(ch.tags)
            ? ch.tags.map(t => t.toLowerCase().trim())
            : String(ch.tags).split(',').map(t => t.toLowerCase().trim()).filter(Boolean);
          return normalizedTags.some(tag => chTags.includes(tag));
        })
        .map(ch => ch.id);

      // If no channels matched, return empty early
      if (!channelIdsByTag.length) {
        console.log("No channels matched tags, returning empty");
        return json({ videos: [], total: 0, hasMore: false });
      }
    }

    if (channelIdsByTag && channelIdsByTag.length) {
      query = query.in('channel_id', channelIdsByTag);
    } else if (channel) {
      const channelList = channel.split(',').filter(Boolean);
      if (channelList.length > 1) {
        query = query.in('channel_id', channelList);
      } else {
        query = query.eq('channel_id', channelList[0]);
      }
    }

    if (country) query = query.eq('country', country);
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

    console.log("Final Supabase query about to execute. From:", from, "To:", to);

    const { data, count, error } = await query;
    if (error) {
      console.error('Supabase videos table query error:', error);
      return json({ error: error.message }, { status: 500 });
    }

    // Log sample video data
    if (data && data.length) {
      console.log('First 2 videos returned:');
      console.log(
        JSON.stringify(
          data.slice(0, 2).map(v => ({
            id: v.id,
            title: v.title,
            level: v.level,
            length: v.length,
            published: v.published
          })), null, 2
        )
      );
    } else {
      console.log('No videos returned!');
    }

    return json({
      videos: data ?? [],
      total: count ?? 0,
      hasMore: to + 1 < (count ?? 0)
    });
  } catch (err) {
    console.error('Unhandled error in /api/videos:', err, err.stack);
    return json({ error: err.message || String(err) }, { status: 500 });
  }
}
