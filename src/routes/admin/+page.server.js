import { redirect } from '@sveltejs/kit';
import { createClient } from '@supabase/supabase-js';

export async function load({ cookies }) {
  const supabase = createClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY,
    {
      global: {
        headers: {
          Authorization: cookies.get('sb-access-token')
            ? `Bearer ${cookies.get('sb-access-token')}`
            : ''
        }
      }
    }
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw redirect(303, '/login');
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single();
  if (!profile?.is_admin) throw redirect(303, '/');
  return {};
}
