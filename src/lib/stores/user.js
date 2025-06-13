import { writable } from 'svelte/store';
import { supabase } from '../supabaseClient.js';

export const user = writable(null);
export const authError = writable('');

// Load the current session/user on app start
export async function loadUser() {
  const { data, error } = await supabase.auth.getSession();
  if (data?.session?.user) {
    user.set(data.session.user);
    authError.set('');
  } else {
    user.set(null);
    authError.set(error?.message || '');
  }
}

// Login
export async function login(email, password) {
  const { error, data } = await supabase.auth.signInWithPassword({ email, password });
  if (data?.user) {
    user.set(data.user);
    authError.set('');
  } else {
    user.set(null);
    authError.set(error?.message || 'Login failed');
  }
}

// Logout
export async function logout() {
  await supabase.auth.signOut();
  user.set(null);
}

// Keep store updated on any auth change
supabase.auth.onAuthStateChange((_event, session) => {
  if (session?.user) {
    user.set(session.user);
    authError.set('');
  } else {
    user.set(null);
  }
});

// Initial load
loadUser();
