import { json } from '@sveltejs/kit';
import { supabase } from '$lib/supabaseClient';

const TEST_UUID = '11111111-2222-3333-4444-555555555555'; // For quick dev test

export async function POST({ request }) {
  const body = await request.json();
  const { date, seconds, comment, user_id } = body;

  console.log("API received:", body);

  // Basic test/fallback: use TEST_UUID if nothing provided
  const uid = user_id || TEST_UUID;

  // Basic UUID check
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uid || !uuidRegex.test(uid) || !date || !seconds) {
    console.log("Bad request: ", { uid, date, seconds });
    return json({ error: 'Missing or invalid fields' }, { status: 400 });
  }

  const { error } = await supabase
    .from('watch_sessions')
    .insert([
      {
        user_id: uid,
        date,
        seconds,
        source: comment || 'manual'
      }
    ]);

  if (error) {
    console.log("Supabase insert error:", error.message);
    return json({ error: error.message }, { status: 500 });
  }

  console.log("Manual session added for user:", uid, "date:", date, "seconds:", seconds);
  return json({ success: true });
}
