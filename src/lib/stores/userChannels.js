import { writable } from 'svelte/store';

// Holds an array of the user's saved channel objects
export const userChannels = writable([]);
