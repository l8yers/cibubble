// src/lib/stores/user.js
import { writable } from 'svelte/store';
import { getCurrentUser, signInWithEmail, signOut } from '../api/auth.js';

export const user = writable(null);
export const authError = writable('');

export async function loadUser() {
  const { user: u, error } = await getCurrentUser();
  if (u) user.set(u);
  else user.set(null);
  if (error) authError.set(error.message || 'Error loading user');
}

export async function login(email, password) {
  const { user: u, error } = await signInWithEmail(email, password);
  if (u) {
    user.set(u);
    authError.set('');
  } else {
    user.set(null);
    authError.set(error?.message || 'Login failed');
  }
}

export async function logout() {
  await signOut();
  user.set(null);
}
