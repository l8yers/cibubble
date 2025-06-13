// src/lib/stores/user.js
import { writable } from 'svelte/store';
import { supabase } from '../supabaseClient.js';

export const user = writable(null);
export const authError = writable('');

// Try to get current user/session on load
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

// Login function
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

// Logout function
export async function logout() {
  await supabase.auth.signOut();
  user.set(null);
}

// Listen to auth state changes and update store
supabase.auth.onAuthStateChange((_event, session) => {
  if (session?.user) {
    user.set(session.user);
    authError.set('');
  } else {
    user.set(null);
  }
});

// Immediately load user on import
loadUser();
