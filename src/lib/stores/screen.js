import { writable } from 'svelte/store';

export const isMobile = writable(false);
export const isTablet = writable(false);

if (typeof window !== 'undefined') {
  function check() {
    isMobile.set(window.innerWidth <= 700);
    isTablet.set(window.innerWidth > 700 && window.innerWidth <= 1550);
  }
  check();
  window.addEventListener('resize', check);
}
