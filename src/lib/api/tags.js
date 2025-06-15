import { supabase } from '$lib/supabaseClient';

// Add (or create) a tag and link it to a channel
export async function addTagToChannel(channelId, tagName) {
  // 1. Find existing tag
  let { data: tag, error } = await supabase
    .from('tags')
    .select('*')
    .eq('name', tagName)
    .maybeSingle();

  if (!tag) {
    // 2. Create new tag
    let { data: newTag, error: insertErr } = await supabase
      .from('tags')
      .insert([{ name: tagName }])
      .select()
      .maybeSingle();
    if (insertErr) throw insertErr;
    tag = newTag;
  }

  // 3. Link to channel (upsert prevents duplicates)
  const { error: linkErr } = await supabase
    .from('channel_tags')
    .insert([{ channel_id: channelId, tag_id: tag.id }], { upsert: true });
  if (linkErr) throw linkErr;

  return tag;
}

// Get all tags (for autocomplete)
export async function getAllTags() {
  const { data, error } = await supabase
    .from('tags')
    .select('*')
    .order('name', { ascending: true });
  if (error) throw error;
  return data;
}

// Get tags for a given channel
export async function getTagsForChannel(channelId) {
  // First, try the join table method (for old channels)
  const { data, error } = await supabase
    .from('channel_tags')
    .select('tag_id, tags(name)')
    .eq('channel_id', channelId);

  // If there are joined tags, use them
  if (!error && data && data.length > 0) {
    return data
      .map(row => ({ id: row.tag_id, name: row.tags?.name }))
      .filter(t => t.name);
  }

  // Otherwise, fall back to the comma-separated tags field on channels
  const { data: channelRow } = await supabase
    .from('channels')
    .select('tags')
    .eq('id', channelId)
    .maybeSingle();

  if (!channelRow || !channelRow.tags) return [];
  return channelRow.tags
    .split(',')
    .map(t => ({ name: t.trim() }))
    .filter(t => t.name);
}


// Get top N tags
export async function getTopTags(limit = 20) {
  const { data, error } = await supabase.rpc('get_top_tags', { limit_num: limit });
  if (error) throw error;
  return data;
}
