import { json } from '@sveltejs/kit';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  throw new Error('SUPABASE_URL and SERVICE_ROLE_KEY must be set in environment variables');
}

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

export async function POST({ request }) {
  // Get the JWT access token sent in the Authorization header
  const authHeader = request.headers.get('authorization');
  if (!authHeader) {
    return json({ error: 'Missing token' }, { status: 401 });
  }

  const token = authHeader.replace('Bearer ', '');

  // Validate and decode the JWT using the Supabase Admin client
  const { data, error } = await admin.auth.getUser(token);

  if (error || !data?.user) {
    return json({ error: 'Not authorized' }, { status: 401 });
  }

  const userId = data.user.id;

  // Actually delete the user
  const { error: deleteError } = await admin.auth.admin.deleteUser(userId);
  if (deleteError) {
    return json({ error: deleteError.message }, { status: 500 });
  }

  return json({ success: true });
}
