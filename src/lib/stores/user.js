import { writable } from 'svelte/store';
import { supabase } from '$lib/supabaseClient';
import { goto } from '$app/navigation';

export const user = writable(undefined);      // 'undefined' means "not checked yet"
export const userLoading = writable(true);
export const authChecked = writable(false);
export const authError = writable('');

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

// === NEW: Fetch profile row
async function fetchProfile(userId) {
  if (!userId) return null;
  console.log("[user.js] fetchProfile for userId:", userId);
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  if (error) {
    console.warn("[user.js] fetchProfile error:", error);
    return null;
  }
  console.log("[user.js] fetchProfile returned:", data);
  return data;
}

export async function loadUser() {
  console.log("[user.js] loadUser called");
  userLoading.set(true);
  const { data, error } = await supabase.auth.getUser();
  console.log("[user.js] getUser returned:", { data, error });
  if (error || !data?.user) {
    user.set(null);
    userLoading.set(false);
    authChecked.set(true);
    console.log("[user.js] No user found, set null");
    return;
  }
  // Fetch profile row for is_admin, etc.
  const profile = await fetchProfile(data.user.id);
  user.set({ ...data.user, profile });
  userLoading.set(false);
  authChecked.set(true);
  console.log("[user.js] User set:", { ...data.user, profile });
}

export async function login(email, password) {
  authError.set('');
  userLoading.set(true);
  const { error, data } = await supabase.auth.signInWithPassword({ email, password });
  if (error) authError.set(mapAuthError(error));
  await loadUser();
  userLoading.set(false);
  return { error, data };
}

export async function logout() {
  userLoading.set(true);
  await supabase.auth.signOut();
  user.set(null);
  userLoading.set(false);
  authChecked.set(true);
  const keepTheme = localStorage.getItem('theme');
  localStorage.clear();
  if (keepTheme) localStorage.setItem('theme', keepTheme);
  sessionStorage.clear();
  goto('/');
}

export async function signup(email, password) {
  authError.set('');
  userLoading.set(true);
  const { error, data } = await supabase.auth.signUp({ email, password });
  if (error) authError.set(mapAuthError(error));
  await loadUser();
  userLoading.set(false);
  return { error, data };
}

export async function updateEmail(newEmail) {
  authError.set('');
  userLoading.set(true);
  const { error, data } = await supabase.auth.updateUser({ email: newEmail });
  if (error) authError.set(mapAuthError(error));
  await loadUser();
  userLoading.set(false);
  return { error, data };
}

export async function updatePassword(newPassword) {
  authError.set('');
  userLoading.set(true);
  const { error, data } = await supabase.auth.updateUser({ password: newPassword });
  if (error) authError.set(mapAuthError(error));
  await loadUser();
  userLoading.set(false);
  return { error, data };
}

// === UPDATED: Also fetch profile on auth state changes
supabase.auth.onAuthStateChange(async (event, session) => {
  console.log("[user.js] onAuthStateChange:", { event, session });
  if (session?.user) {
    const profile = await fetchProfile(session.user.id);
    user.set({ ...session.user, profile });
    console.log("[user.js] onAuthStateChange user set:", { ...session.user, profile });
  } else {
    user.set(null);
    console.log("[user.js] onAuthStateChange user set: null");
  }
  userLoading.set(false);
  authChecked.set(true);
});
