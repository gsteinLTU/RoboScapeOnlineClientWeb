import { writable } from 'svelte/store';

export const roomId = writable<string | null>(null);
let _pollHandle: number | null = null;

export function updateRoomIdFromWindow() {
	// SSR-safe read of the external API
	if (typeof window === 'undefined') {
		roomId.set(null);
		return null;
	}
	const fns = (window as any).RoboScapeOnline_fns;
	const id = typeof fns?.room_id === 'function' ? fns.room_id() : null;
	roomId.set(id ?? null);
	return id;
}

// Expose a notifier so external code can push updates without polling
export function exposeRoomNotifier() {
	if (typeof window === 'undefined') return;
	(window as any).RoboScapeOnline_notifyRoom = updateRoomIdFromWindow;
}

// Polling control
export function startRoomPoll(ms = 1000) {
	if (typeof window === 'undefined') return;
	stopRoomPoll();
	_pollHandle = window.setInterval(updateRoomIdFromWindow, ms);
}

export function stopRoomPoll() {
	if (_pollHandle != null) {
		clearInterval(_pollHandle);
		_pollHandle = null;
	}
}
