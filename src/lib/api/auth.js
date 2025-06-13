// src/lib/api/auth.js
import { supabase } from '../supabaseClient.js';

export async function signInWithEmail(email, password) {
  const { user, error, session } = await supabase.auth.signInWithPassword({ email, password });
  return { user, error, session };
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  return { error };
}

export async function getCurrentUser() {
  const { data, error } = await supabase.auth.getUser();
  return { user: data?.user, error };
}
