// $lib/stores/progress.js
import { writable, get } from 'svelte/store';
import { supabase } from '$lib/supabaseClient.js';
import { getISOWeekNumber } from '$lib/utils/time.js';

// --- Helper for days marked in calendar this month ---
function getActiveDaysCountThisMonth(dailyTotals, manualTotals) {
	function buildTotalsMap(dailyTotals, manualTotals) {
		const map = {};
		for (const d of dailyTotals) map[d.date] = d.totalSeconds;
		if (manualTotals) for (const m of manualTotals) map[m.date] = m.totalSeconds;
		return map;
	}
	function formatDate(date) {
		return date.toISOString().split('T')[0];
	}
	function getDaysInMonth(year, month) {
		const days = [];
		for (let i = 1; i <= new Date(year, month, 0).getDate(); i++) {
			days.push(new Date(year, month - 1, i));
		}
		return days;
	}
	const now = new Date();
	const year = now.getFullYear();
	const month = now.getMonth() + 1;
	const totalsMap = buildTotalsMap(dailyTotals, manualTotals);
	const days = getDaysInMonth(year, month);
	let count = 0;
	for (const day of days) {
		if (totalsMap[formatDate(day)] > 0) count++;
	}
	return count;
}

export const progressData = writable({
	email: '',
	newEmail: '',
	watchTime: 0,
	todayWatchTime: 0,
	daysPracticed: 0,
	outsideTime: 0,
	weeksInARow: 0,
	daysThisMonth: 0,
	dailyTotals: [],
	manualTotals: [],
	message: ''
});

export async function fetchProgressData(user) {
	if (!user) return;

	const userId = user.id;
	const email = user.email;

	let watchTime = 0, todayWatchTime = 0, daysPracticed = 0, outsideTime = 0, weeksInARow = 0, daysThisMonth = 0;
	let dailyTotals = [], manualTotals = [], message = '';

	// All time sessions
	let { data: allSessions } = await supabase
		.from('watch_sessions')
		.select('seconds')
		.eq('user_id', userId);
	watchTime = (allSessions ?? []).reduce((acc, s) => acc + (s.seconds || 0), 0);

	// Today sessions
	const today = new Date().toISOString().slice(0, 10);
	let { data: todaySessions } = await supabase
		.from('watch_sessions')
		.select('seconds')
		.eq('user_id', userId)
		.eq('date', today);
	todayWatchTime = (todaySessions ?? []).reduce((acc, s) => acc + (s.seconds || 0), 0);

	// All session details
	let { data: allSessionsForDaily, error } = await supabase
		.from('watch_sessions')
		.select('id, date, seconds, source, video_id')
		.eq('user_id', userId);

	if (error) {
		dailyTotals = [];
		manualTotals = [];
		outsideTime = 0;
	} else {
		const dailyMap = {};
		const manualArr = [];
		let outsideSeconds = 0;
		(allSessionsForDaily ?? []).forEach(({ id, date, seconds, video_id, source }) => {
			if (!date) return;
			if (video_id) {
				dailyMap[date] = (dailyMap[date] || 0) + (seconds || 0);
			} else {
				manualArr.push({
					id,
					date,
					totalSeconds: seconds,
					source: source || ''
				});
				outsideSeconds += seconds || 0;
			}
		});
		dailyTotals = Object.entries(dailyMap)
			.map(([date, totalSeconds]) => ({ date, totalSeconds }))
			.sort((a, b) => b.date.localeCompare(a.date));
		manualTotals = manualArr.sort((a, b) => b.date.localeCompare(a.date));
		outsideTime = outsideSeconds;
	}
	daysPracticed = dailyTotals.filter((dt) => dt.totalSeconds > 0).length;

	// Use calendar logic for daysThisMonth:
	daysThisMonth = getActiveDaysCountThisMonth(dailyTotals, manualTotals);

	// Weeks in a row
	let weekSet = new Set();
	dailyTotals.forEach((dt) => {
		if (dt.totalSeconds > 0) {
			const d = new Date(dt.date);
			const week = getISOWeekNumber(d);
			weekSet.add(`${d.getFullYear()}-${week}`);
		}
	});
	let count = 0;
	let current = new Date();
	while (true) {
		const weekKey = `${current.getFullYear()}-${getISOWeekNumber(current)}`;
		if (weekSet.has(weekKey)) {
			count++;
			current.setDate(current.getDate() - 7);
		} else {
			break;
		}
	}
	weeksInARow = count;

	progressData.set({
		email,
		newEmail: email,
		watchTime,
		todayWatchTime,
		daysPracticed,
		outsideTime,
		weeksInARow,
		daysThisMonth,
		dailyTotals,
		manualTotals,
		message: ''
	});
}

// Update Email
export async function updateUserEmail(newEmail) {
	const { error } = await supabase.auth.updateUser({ email: newEmail });
	if (error) {
		progressData.update((d) => ({ ...d, message: error.message || 'Failed to update email.' }));
		return false;
	}
	progressData.update((d) => ({ ...d, email: newEmail, newEmail, message: 'Email updated. Check your inbox.' }));
	return true;
}

// Update Password
export async function updateUserPassword(newPassword) {
	const { error } = await supabase.auth.updateUser({ password: newPassword });
	if (error) {
		progressData.update((d) => ({ ...d, message: error.message || 'Failed to update password.' }));
		return false;
	}
	progressData.update((d) => ({ ...d, message: 'Password updated.' }));
	return true;
}

// Manual Entry CRUD
export async function deleteManualEntry(entry, user) {
	if (!entry.id) return alert('Missing ID for deletion!');
	const { error } = await supabase.from('watch_sessions').delete().eq('id', entry.id);
	if (error) alert('Error deleting entry: ' + error.message);
	await fetchProgressData(user);
}

export async function updateManualEntry(updated, user) {
	if (!updated.id) return alert('Missing ID for update!');
	const { error } = await supabase
		.from('watch_sessions')
		.update({
			date: updated.date,
			seconds: updated.totalSeconds,
			source: updated.source
		})
		.eq('id', updated.id);
	if (error) alert('Error updating entry: ' + error.message);
	await fetchProgressData(user);
}
