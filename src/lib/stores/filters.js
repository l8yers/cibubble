import { writable } from 'svelte/store';
import { ALL_LEVELS } from '$lib/utils/filters.js';

const STORE_KEY = 'filters';

function toStorable(val) {
  // Convert Sets to Arrays for storage
  return {
    ...val,
    levels: Array.from(val.levels),
    tags: Array.from(val.tags)
  };
}

function fromStorable(val) {
  // Convert Arrays back to Sets
  return {
    ...val,
    // PATCH: Use empty Set if none stored (not ALL_LEVELS fallback)
    levels: new Set(val.levels ?? []),
    tags: new Set(val.tags ?? []),
  };
}

// Main filter store (single object)
function createPersistedStore(key, initialValue) {
  let stored = null;
  try {
    stored = localStorage.getItem(key);
  } catch (_) {}

  const start = stored ? fromStorable(JSON.parse(stored)) : initialValue;
  const store = writable(start);

  // Persist to localStorage on change
  store.subscribe((val) => {
    try {
      localStorage.setItem(key, JSON.stringify(toStorable(val)));
    } catch (_) {}
  });

  return store;
}

// Default filters object: levels is empty Set to mean "show all"
export const filterState = createPersistedStore(STORE_KEY, {
  levels: new Set(),
  tags: new Set(),
  country: '',
  channel: '',
  playlist: '',
  sort: 'latest',
  search: ''
});

// Optional: helpers to load/save directly (for page logic)
export function saveFiltersToStorage(val) {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(toStorable(val)));
  } catch (_) {}
}
export function loadFiltersFromStorage() {
  try {
    const data = localStorage.getItem(STORE_KEY);
    return data ? fromStorable(JSON.parse(data)) : null;
  } catch {
    return null;
  }
}
