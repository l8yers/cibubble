import { json } from '@sveltejs/kit';
import { createClient } from '@supabase/supabase-js';

// You MUST set these secrets in Netlify/Supabase
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// --- API Handler ---
export async function POST({ locals }) {
  // Ensure user is authenticated
  const user = locals.user;
  if (!user) {
    return json({ error: 'Not authenticated' }, { status: 401 });
  }

  // Create Service Role client (server-side only!)
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  // Optionally: delete user data in your own tables
  // await admin.from('watch_sessions').delete().eq('user_id', user.id);

  // Actually delete the user from Supabase Auth
  const { error } = await admin.auth.admin.deleteUser(user.id);

  if (error) {
    return json({ error: error.message }, { status: 500 });
  }

  return json({ success: true });
}
