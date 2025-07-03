// $lib/utils/time.js

export function formatWatchTime(seconds) {
	if (!seconds) return '0 min';
	const mins = Math.round(seconds / 60);
	if (mins >= 60) {
		const hours = Math.floor(seconds / 3600);
		return `${hours} hr${hours !== 1 ? 's' : ''}`;
	}
	return mins > 0 ? `${mins} min` : `${seconds} sec`;
}

export function formatFullTime(seconds) {
	if (!seconds) return '0 seconds';
	const h = Math.floor(seconds / 3600);
	const m = Math.floor((seconds % 3600) / 60);
	const s = seconds % 60;
	let result = [];
	if (h) result.push(`${h} hr${h !== 1 ? 's' : ''}`);
	if (m) result.push(`${m} min${m !== 1 ? 's' : ''}`);
	if (s || result.length === 0) result.push(`${s} sec${s !== 1 ? 's' : ''}`);
	return result.join(' ');
}

export function formatMinutesOnly(seconds) {
	if (!seconds) return '0 min';
	const mins = Math.round(seconds / 60);
	return mins > 0 ? `${mins} min` : `${seconds} sec`;
}

export function formatHours(seconds) {
	if (!seconds) return '0 hrs';
	return Math.round(seconds / 3600) + ' hrs';
}

export function getISOWeekNumber(date) {
	const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
	const dayNum = d.getUTCDay() || 7;
	d.setUTCDate(d.getUTCDate() + 4 - dayNum);
	const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
	return Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
}
