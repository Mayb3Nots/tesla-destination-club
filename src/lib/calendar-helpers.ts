export const DEFAULT_SLOT_HEIGHT = 16;
export const TOTAL_SLOTS = 96;
export const SNAP_MINUTES = 15;
export const MIN_DURATION_MINUTES = 15;
export const DEFAULT_DURATION_MINUTES = 180;

export function computeSlotHeight(availableHeightPx: number): number {
	const height = availableHeightPx / TOTAL_SLOTS;
	return Math.max(height, 6);
}

export function timeToMinutes(date: Date): number {
	return date.getHours() * 60 + date.getMinutes();
}

export function minutesToDate(minutes: number, referenceDate: Date): Date {
	const result = new Date(referenceDate);
	result.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0);
	return result;
}

export function snapToGrid(minutes: number): number {
	return Math.round(minutes / SNAP_MINUTES) * SNAP_MINUTES;
}

export function clamp(value: number, min: number, max: number): number {
	return Math.max(min, Math.min(max, value));
}

export function formatTime12(date: Date): string {
	const h = date.getHours();
	const m = date.getMinutes();
	const ampm = h >= 12 ? 'PM' : 'AM';
	const h12 = h % 12 || 12;
	return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
}

export function formatHour(hour: number): string {
	const ampm = hour >= 12 ? 'PM' : 'AM';
	const h12 = hour % 12 || 12;
	return `${h12} ${ampm}`;
}

export function toDateString(date: Date): string {
	const y = date.getFullYear();
	const m = String(date.getMonth() + 1).padStart(2, '0');
	const d = String(date.getDate()).padStart(2, '0');
	return `${y}-${m}-${d}`;
}

export interface SlotSuggestion {
	date: Date;
	startTime: Date;
	endTime: Date;
}

export function findNextAvailableSlot(
	bookings: { startTime: string; endTime: string; status: string }[],
	totalPorts: number,
	startDate: Date
): SlotSuggestion | null {
	const now = new Date();

	for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
		const day = new Date(startDate);
		day.setDate(day.getDate() + dayOffset);
		day.setHours(0, 0, 0, 0);

		let startMinutes: number;
		if (dayOffset === 0) {
			const nowMinutes = now.getHours() * 60 + now.getMinutes();
			startMinutes = snapToGrid(nowMinutes) + SNAP_MINUTES;
		} else {
			startMinutes = 7 * 60;
		}

		const dayEndMinutes = TOTAL_SLOTS * SNAP_MINUTES - SNAP_MINUTES; // 23:45 - last possible start

		const dayBookings = bookings.filter((b) => {
			const bDate = new Date(b.startTime);
			return toDateString(bDate) === toDateString(day) && b.status !== 'cancelled';
		});

		for (let t = startMinutes; t <= dayEndMinutes; t += SNAP_MINUTES) {
			const slotEnd = t + DEFAULT_DURATION_MINUTES;

			// Check overlap — only against same-day bookings for the main portion
			const effectiveEnd = Math.min(slotEnd, TOTAL_SLOTS * SNAP_MINUTES);
			const overlapping = dayBookings.filter((b) => {
				const bStart = timeToMinutes(new Date(b.startTime));
				const bEnd = timeToMinutes(new Date(b.endTime));
				return t < bEnd && effectiveEnd > bStart;
			}).length;

			if (overlapping < totalPorts) {
				// Create endTime that may overflow to next day
				const endTimeDate = new Date(day);
				endTimeDate.setHours(0, 0, 0, 0);
				endTimeDate.setMinutes(slotEnd);
				return {
					date: day,
					startTime: minutesToDate(t, day),
					endTime: endTimeDate
				};
			}
		}
	}

	return null;
}

export function computePortAssignments(
	bookings: { id: string; startTime: string; endTime: string }[]
): Map<string, number> {
	const sorted = [...bookings].sort(
		(a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
	);

	const assignments = new Map<string, number>();
	const portEndTimes: number[] = [];

	for (const booking of sorted) {
		const bStart = timeToMinutes(new Date(booking.startTime));
		let assigned = false;

		for (let port = 0; port < portEndTimes.length; port++) {
			if (bStart >= portEndTimes[port]) {
				assignments.set(booking.id, port);
				portEndTimes[port] = timeToMinutes(new Date(booking.endTime));
				assigned = true;
				break;
			}
		}

		if (!assigned) {
			const port = portEndTimes.length;
			assignments.set(booking.id, port);
			portEndTimes.push(timeToMinutes(new Date(booking.endTime)));
		}
	}

	return assignments;
}

export interface NextAvailableSlot {
	time: Date;
	waitMinutes: number;
	isAvailableNow: boolean;
}

/**
 * Finds the next time a charging port becomes available.
 * Looks at active + upcoming bookings and finds the earliest gap.
 */
export function getNextAvailableTime(
	bookings: { startTime: string; endTime: string; status: string }[],
	totalPorts: number,
	refDate: Date = new Date()
): NextAvailableSlot | null {
	const now = refDate.getTime();

	// Filter to only relevant bookings (not cancelled/no_show, and not already ended)
	const relevant = bookings.filter((b) => {
		if (b.status === 'cancelled' || b.status === 'no_show') return false;
		return new Date(b.endTime).getTime() > now;
	});

	if (relevant.length === 0) {
		return { time: new Date(now), waitMinutes: 0, isAvailableNow: true };
	}

	// Check if a port is free right now
	const concurrentNow = relevant.filter((b) => {
		const start = new Date(b.startTime).getTime();
		const end = new Date(b.endTime).getTime();
		return start <= now && end > now;
	}).length;

	if (concurrentNow < totalPorts) {
		return { time: new Date(now), waitMinutes: 0, isAvailableNow: true };
	}

	// Collect all unique end times of active bookings (sorted ascending)
	const endTimes = relevant
		.map((b) => new Date(b.endTime).getTime())
		.filter((t) => t > now)
		.sort((a, b) => a - b);

	// Deduplicate (within 1 minute tolerance)
	const uniqueEndTimes: number[] = [];
	for (const t of endTimes) {
		if (uniqueEndTimes.length === 0 || t - uniqueEndTimes[uniqueEndTimes.length - 1] > 60000) {
			uniqueEndTimes.push(t);
		}
	}

	// For each end time, check how many bookings are still running at that moment
	for (const endTime of uniqueEndTimes) {
		const stillRunning = relevant.filter((b) => {
			const start = new Date(b.startTime).getTime();
			const end = new Date(b.endTime).getTime();
			return start <= endTime && end > endTime;
		}).length;

		if (stillRunning < totalPorts) {
			const waitMinutes = Math.max(0, Math.round((endTime - now) / (60 * 1000)));
			return {
				time: new Date(endTime),
				waitMinutes,
				isAvailableNow: false
			};
		}
	}

	// All ports are booked for the foreseeable future — return the last end time
	const lastEnd = uniqueEndTimes[uniqueEndTimes.length - 1];
	const waitMinutes = Math.max(0, Math.round((lastEnd - now) / (60 * 1000)));
	return {
		time: new Date(lastEnd),
		waitMinutes,
		isAvailableNow: false
	};
}

export function formatWaitTime(minutes: number): string {
	if (minutes <= 0) return 'Available now';
	if (minutes < 60) return `~${minutes} min wait`;
	const hours = Math.floor(minutes / 60);
	const mins = minutes % 60;
	if (mins === 0) return `~${hours}h wait`;
	return `~${hours}h ${mins}m wait`;
}

export function checkSlotAvailability(
	startTime: Date,
	endTime: Date,
	bookings: { startTime: string; endTime: string; status: string; id: string }[],
	totalPorts: number,
	excludeBookingId?: string
): boolean {
	let startMin = timeToMinutes(startTime);
	let endMin = timeToMinutes(endTime);
	const isOverflow = toDateString(endTime) !== toDateString(startTime);

	// For overflow, only check the first-day portion (we don't have next-day bookings in this set)
	if (isOverflow) {
		endMin = TOTAL_SLOTS * SNAP_MINUTES;
	}

	for (let t = startMin; t < endMin; t += SNAP_MINUTES) {
		const slotEnd = Math.min(t + SNAP_MINUTES, endMin);
		const concurrent = bookings.filter((b) => {
			if (b.status === 'cancelled') return false;
			if (excludeBookingId && b.id === excludeBookingId) return false;
			const bStart = timeToMinutes(new Date(b.startTime));
			const bEnd = timeToMinutes(new Date(b.endTime));
			return t < bEnd && slotEnd > bStart;
		}).length;

		if (concurrent >= totalPorts) return false;
	}

	return true;
}
