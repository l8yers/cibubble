// Run with: node migrate_channel_tags.js

import { createClient } from '@supabase/supabase-js';

// Use your Supabase keys here or pull from env vars
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function migrateChannelTags() {
  // 1. Get all channels with tags
  const { data: channels, error } = await supabase
    .from('channels')
    .select('id, tags')
    .not('tags', 'is', null);

  if (error) {
    console.error('Failed to fetch channels:', error);
    process.exit(1);
  }

  let totalTagsAdded = 0;

  for (const chan of channels) {
    if (!chan.tags) continue;
    const tags = chan.tags.split(',').map(t => t.trim()).filter(Boolean);

    for (const tagName of tags) {
      // Ensure tag exists
      let { data: tag, error: tagErr } = await supabase
        .from('tags')
        .select('*')
        .eq('name', tagName)
        .maybeSingle();
      if (tagErr) {
        console.error(`Failed to fetch/create tag '${tagName}':`, tagErr);
        continue;
      }
      if (!tag) {
        // Create the tag if it doesn't exist
        let { data: newTag, error: insertErr } = await supabase
          .from('tags')
          .insert([{ name: tagName }])
          .select()
          .maybeSingle();
        if (insertErr) {
          console.error(`Failed to insert tag '${tagName}':`, insertErr);
          continue;
        }
        tag = newTag;
      }

      // Link channel and tag
      const { error: linkErr } = await supabase
        .from('channel_tags')
        .insert([{ channel_id: chan.id, tag_id: tag.id }], { upsert: true });
      if (linkErr) {
        console.error(`Failed to link channel ${chan.id} and tag '${tagName}':`, linkErr);
        continue;
      }
      totalTagsAdded++;
      console.log(`Linked channel ${chan.id} to tag '${tagName}'`);
    }
  }
  console.log(`Migration complete. Total tags linked: ${totalTagsAdded}`);
  process.exit(0);
}

migrateChannelTags();
