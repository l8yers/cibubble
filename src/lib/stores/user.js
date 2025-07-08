import { writable } from 'svelte/store';
import { supabase } from '$lib/supabaseClient';
import { goto } from '$app/navigation';

export const user = writable(undefined);      // undefined = not checked yet
export const userLoading = writable(true);
export const authChecked = writable(false);
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
  return error.message || 'Authentication error.';
}

// NEW: fetch profile for user id
async function fetchProfile(userId) {
  if (!userId) return null;
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (error) return null;
    return data;
  } catch (err) {
    return null;
  }
}

// Load user from Supabase (on mount and after auth changes)
export async function loadUser() {
  userLoading.set(true);
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) {
    user.set(null);
    userLoading.set(false);
    authChecked.set(true);
    return;
  }

  // Fetch and merge profile row
  const profileRow = await fetchProfile(data.user.id);
  user.set({
    ...data.user,
    profile: profileRow,
  });
  userLoading.set(false);
  authChecked.set(true);
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

// Logout
export async function logout() {
  userLoading.set(true);
  await supabase.auth.signOut();
  user.set(null);
  userLoading.set(false);
  authChecked.set(true);
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
supabase.auth.onAuthStateChange(async (event, session) => {
  if (session?.user) {
    // Fetch and merge profile row for new user
    const profileRow = await fetchProfile(session.user.id);
    user.set({
      ...session.user,
      profile: profileRow,
    });
  } else {
    user.set(null);
  }
  userLoading.set(false); 
  authChecked.set(true);
});
