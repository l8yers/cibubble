import { writable } from 'svelte/store';
import { supabase } from '$lib/supabaseClient';

export const user = writable(null);
export const authError = writable('');

// Load user from Supabase (on mount and after auth changes)
export async function loadUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error) {
    user.set(null);
    return;
  }
  user.set(data?.user || null);
}

// Login
export async function login(email, password) {
  authError.set('');
  const { error, data } = await supabase.auth.signInWithPassword({ email, password });
  if (error) authError.set(error.message);
  await loadUser();
  return { error, data };
}

// Logout
export async function logout() {
  await supabase.auth.signOut();
  user.set(null);
}

// Signup
export async function signup(email, password) {
  authError.set('');
  const { error, data } = await supabase.auth.signUp({ email, password });
  if (error) authError.set(error.message);
  await loadUser();
  return { error, data };
}

// Update Email
export async function updateEmail(newEmail) {
  authError.set('');
  const { error, data } = await supabase.auth.updateUser({ email: newEmail });
  if (error) authError.set(error.message);
  await loadUser();
  return { error, data };
}

// Update Password
export async function updatePassword(newPassword) {
  authError.set('');
  const { error, data } = await supabase.auth.updateUser({ password: newPassword });
  if (error) authError.set(error.message);
  await loadUser();
  return { error, data };
}

// Keep Svelte store in sync with Supabase on all auth events
supabase.auth.onAuthStateChange((event, session) => {
  user.set(session?.user || null);
});
