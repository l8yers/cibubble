import { writable } from 'svelte/store';
import { supabase } from '$lib/supabaseClient';
import { goto } from '$app/navigation';

export const user = writable(undefined);      // 'undefined' means "not checked yet"
export const userLoading = writable(true);    // true = loading, false = ready
export const authError = writable('');

// Helper: map Supabase errors to user-friendly text
function mapAuthError(error) {
  if (!error) return '';
  if (error.message?.includes('Invalid login credentials')) {
    return 'Email or password is incorrect.';
  }
  if (error.message?.includes('User already registered')) {
    return 'That email is already registered.';
  }
  if (error.message?.includes('Password should be at least')) {
    return 'Password is too short.';
  }
  // Add more mappings as needed
  return error.message || 'Authentication error.';
}

// Load user from Supabase (on mount and after auth changes)
export async function loadUser() {
  userLoading.set(true);
  const { data, error } = await supabase.auth.getUser();
  if (error) {
    user.set(null);
    userLoading.set(false);
    return;
  }
  user.set(data?.user || null);
  userLoading.set(false);
}

// Login
export async function login(email, password) {
  authError.set('');
  userLoading.set(true);
  const { error, data } = await supabase.auth.signInWithPassword({ email, password });
  if (error) authError.set(mapAuthError(error));
  await loadUser();
  userLoading.set(false);
  return { error, data };
}

// Logout: Clear user, localStorage/sessionStorage except theme, and redirect
export async function logout() {
  userLoading.set(true);
  await supabase.auth.signOut();
  user.set(null);
  userLoading.set(false);
  // Keep theme only
  const keepTheme = localStorage.getItem('theme');
  localStorage.clear();
  if (keepTheme) localStorage.setItem('theme', keepTheme);
  sessionStorage.clear();
  goto('/');
}

// Signup
export async function signup(email, password) {
  authError.set('');
  userLoading.set(true);
  const { error, data } = await supabase.auth.signUp({ email, password });
  if (error) authError.set(mapAuthError(error));
  await loadUser();
  userLoading.set(false);
  return { error, data };
}

// Update Email
export async function updateEmail(newEmail) {
  authError.set('');
  userLoading.set(true);
  const { error, data } = await supabase.auth.updateUser({ email: newEmail });
  if (error) authError.set(mapAuthError(error));
  await loadUser();
  userLoading.set(false);
  return { error, data };
}

// Update Password
export async function updatePassword(newPassword) {
  authError.set('');
  userLoading.set(true);
  const { error, data } = await supabase.auth.updateUser({ password: newPassword });
  if (error) authError.set(mapAuthError(error));
  await loadUser();
  userLoading.set(false);
  return { error, data };
}

// Keep Svelte store in sync with Supabase on all auth events
supabase.auth.onAuthStateChange((event, session) => {
  user.set(session?.user || null);
  userLoading.set(false); // <-- always mark loading as done on any auth event
});
