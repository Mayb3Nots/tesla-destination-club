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

		const dayEndMinutes = 23 * 60 + 45;

		const dayBookings = bookings.filter((b) => {
			const bDate = new Date(b.startTime);
			return toDateString(bDate) === toDateString(day) && b.status !== 'cancelled';
		});

		for (let t = startMinutes; t <= dayEndMinutes - DEFAULT_DURATION_MINUTES; t += SNAP_MINUTES) {
			const slotEnd = t + DEFAULT_DURATION_MINUTES;
			if (slotEnd > 24 * 60) continue;

			const overlapping = dayBookings.filter((b) => {
				const bStart = timeToMinutes(new Date(b.startTime));
				const bEnd = timeToMinutes(new Date(b.endTime));
				return t < bEnd && slotEnd > bStart;
			}).length;

			if (overlapping < totalPorts) {
				return {
					date: day,
					startTime: minutesToDate(t, day),
					endTime: minutesToDate(slotEnd, day)
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

export function checkSlotAvailability(
	startTime: Date,
	endTime: Date,
	bookings: { startTime: string; endTime: string; status: string; id: string }[],
	totalPorts: number,
	excludeBookingId?: string
): boolean {
	const startMin = timeToMinutes(startTime);
	const endMin = timeToMinutes(endTime);

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
