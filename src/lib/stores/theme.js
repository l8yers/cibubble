// src/lib/stores/theme.js
import { writable } from 'svelte/store';

let initialTheme = 'light';

// Only access localStorage in the browser
if (typeof window !== 'undefined') {
	const stored = localStorage.getItem('theme');
	if (stored === 'dark' || stored === 'light') {
		initialTheme = stored;
	}
}

export const theme = writable(initialTheme);

// Only run this in the browser
if (typeof window !== 'undefined') {
	theme.subscribe((value) => {
		document.documentElement.className = value;
		localStorage.setItem('theme', value);
	});
}
