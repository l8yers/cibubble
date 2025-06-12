// src/routes/admin/+page.server.js
import { redirect, error } from '@sveltejs/kit';
import { createServerSupabaseClient } from '@supabase/auth-helpers-sveltekit';

export async function load({ locals }) {
  // Check for env vars (debug)
  if (!process.env.VITE_SUPABASE_URL || !process.env.VITE_SUPABASE_ANON_KEY) {
    throw error(500, 'Supabase env vars missing');
  }

  const supabase = createServerSupabaseClient({ locals });

  // Get session (handle both null and errors)
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) throw error(500, 'Supabase session error: ' + sessionError.message);
  if (!session?.user?.id) throw redirect(303, '/login');

  // Query for profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', session.user.id)
    .single();

  if (profileError) throw error(500, 'Supabase profile error: ' + profileError.message);
  if (!profile?.is_admin) throw redirect(303, '/');

  return {
    userId: session.user.id,
    isAdmin: true
  };
}
