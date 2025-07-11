import { json } from '@sveltejs/kit';
import { createClient } from '@supabase/supabase-js';

// ONLY USE service_role key server-side!
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY // NOT the anon/public key!
);

// SvelteKit endpoint (POST)
export async function POST({ locals, request }) {
  // Optional: Confirm user is logged in
  const { user } = locals;
  if (!user || !user.id) {
    return json({ error: 'Not authenticated' }, { status: 401 });
  }

  // Delete user from Supabase Auth
  const { error } = await supabase.auth.admin.deleteUser(user.id);

  if (error) {
    return json({ error: error.message }, { status: 500 });
  }

  // Optionally: clean up user's data in your DB here

  return json({ success: true });
}
