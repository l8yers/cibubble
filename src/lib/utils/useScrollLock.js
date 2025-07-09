// $lib/utils/useScrollLock.js
export function useScrollLock(open) {
	if (typeof document === 'undefined') return () => {};

	if (open) {
		const original = document.body.style.overflow;
		document.body.style.overflow = 'hidden';
		return () => {
			document.body.style.overflow = original;
		};
	} else {
		document.body.style.overflow = '';
		return () => {};
	}
}
