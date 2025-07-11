// src/lib/utils/filterStorage.js

export function saveFiltersToStorage(filters) {
  try {
    localStorage.setItem('cibubble-filters', JSON.stringify(filters));
  } catch (_) {
    // Silent fail (could log if wanted)
  }
}

export function loadFiltersFromStorage() {
  try {
    const data = localStorage.getItem('cibubble-filters');
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}
