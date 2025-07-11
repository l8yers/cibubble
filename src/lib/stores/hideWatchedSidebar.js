import { writable } from 'svelte/store';

const LS_KEY = 'cibubble-hide-watched-sidebar';

function createHideWatchedSidebarStore() {
  let initial = false;
  if (typeof localStorage !== 'undefined') {
    const stored = localStorage.getItem(LS_KEY);
    if (stored !== null) initial = stored === 'true';
  }

  const { subscribe, set, update } = writable(initial);

  return {
    subscribe,
    set: (value) => {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(LS_KEY, value ? 'true' : 'false');
      }
      set(value);
    },
    update
  };
}

export const hideWatchedSidebar = createHideWatchedSidebarStore();
