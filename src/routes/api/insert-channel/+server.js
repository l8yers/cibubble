import { supabase } from '$lib/supabaseClient';

export async function POST({ request }) {
  const body = await request.json();

  const { id, name, thumbnail, level, country, tags } = body;

  if (!id || !name || !level) {
    return new Response(JSON.stringify({ error: 'Missing required fields.' }), { status: 400 });
  }

  const { error } = await supabase
    .from('channels')
    .insert([
      {
        id,
        name,
        thumbnail,
        level,
        country: country || null,
        tags: tags || null,
      },
    ]);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  return new Response(JSON.stringify({ success: true }), { status: 200 });
}
