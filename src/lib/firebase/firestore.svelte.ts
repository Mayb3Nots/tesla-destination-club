import { db } from './client';
import { getFunctions, httpsCallable } from 'firebase/functions';
import {
	collection,
	getDocs,
	doc,
	onSnapshot,
	query,
	where,
	orderBy,
	setDoc,
	deleteDoc,
	type QueryConstraint
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import type { Charger } from '$lib/models/charger';
import type { PhysicalQueuer } from '$lib/models/charger';
import type { Booking } from '$lib/models/booking';
import type { Vehicle } from '$lib/models/vehicle';

const functions = getFunctions();

export function useChargers() {
	let chargers = $state<Charger[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);

	const auth = getAuth();

	async function fetch() {
		if (!auth.currentUser) return;
		loading = true;
		error = null;
		try {
			const snapshot = await getDocs(collection(db, 'chargers'));
			chargers = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Charger));
		} catch (err) {
			console.error('Failed to load chargers:', err);
			error = 'Failed to load chargers';
		} finally {
			loading = false;
		}
	}

	return {
		get chargers() {
			return chargers;
		},
		get loading() {
			return loading;
		},
		get error() {
			return error;
		},
		fetch
	};
}

export function useBookings(chargerId: string, date: string) {
	let bookings = $state<Booking[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);
	let physicalQueuer = $state<PhysicalQueuer | null>(null);

	let unsubscribe: (() => void) | null = null;
	let unsubscribeCharger: (() => void) | null = null;

	const auth = getAuth();

	function subscribe() {
		if (!auth.currentUser) return;

		const startOfDay = new Date(date);
		startOfDay.setHours(0, 0, 0, 0);
		const endOfDay = new Date(date);
		endOfDay.setHours(23, 59, 59, 999);

		const constraints: QueryConstraint[] = [
			where('startTime', '>=', startOfDay.toISOString()),
			where('startTime', '<=', endOfDay.toISOString()),
			orderBy('startTime', 'asc')
		];

		const q = query(collection(db, 'chargers', chargerId, 'bookings'), ...constraints);

		loading = true;
		unsubscribe = onSnapshot(
			q,
			(snapshot) => {
				bookings = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Booking));
				loading = false;
			},
			(err) => {
				error = 'Failed to load bookings';
				loading = false;
			}
		);

		const chargerRef = doc(db, 'chargers', chargerId);
		unsubscribeCharger = onSnapshot(
			chargerRef,
			(snapshot) => {
				if (snapshot.exists()) {
					const data = snapshot.data();
					physicalQueuer = data?.physicalQueuer || null;
				}
			}
		);
	}

	function stop() {
		if (unsubscribe) {
			unsubscribe();
			unsubscribe = null;
		}
		if (unsubscribeCharger) {
			unsubscribeCharger();
			unsubscribeCharger = null;
		}
	}

	return {
		get bookings() {
			return bookings;
		},
		get loading() {
			return loading;
		},
		get error() {
			return error;
		},
		get physicalQueuer() {
			return physicalQueuer;
		},
		subscribe,
		stop
	};
}

export function useBookingsRange(chargerId: string, startDate: Date, endDate: Date) {
	let bookings = $state<Booking[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);

	let unsubscribe: (() => void) | null = null;
	const auth = getAuth();

	function subscribe() {
		if (!auth.currentUser) return;
		const start = new Date(startDate);
		start.setHours(0, 0, 0, 0);
		const end = new Date(endDate);
		end.setHours(23, 59, 59, 999);
		const constraints: QueryConstraint[] = [
			where('startTime', '>=', start.toISOString()),
			where('startTime', '<=', end.toISOString()),
			orderBy('startTime', 'asc')
		];

		const q = query(collection(db, 'chargers', chargerId, 'bookings'), ...constraints);
		loading = true;
		unsubscribe = onSnapshot(
			q,
			(snapshot) => {
				bookings = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Booking));
				loading = false;
			},
			(err) => {
				error = 'Failed to load bookings';
				loading = false;
			}
		);
	}

	function stop() {
		if (unsubscribe) {
			unsubscribe();
			unsubscribe = null;
		}
	}

	return {
		get bookings() {
			return bookings;
		},
		get loading() {
			return loading;
		},
		get error() {
			return error;
		},
		subscribe,
		stop
	};
}

export function useUserBookings() {
	let bookings = $state<Booking[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);

	const auth = getAuth();

	function subscribe() {
		if (!auth.currentUser) return;

		loading = true;
		fetchUserBookings(auth.currentUser.uid).then((data) => {
			bookings = data;
			loading = false;
		});
	}

	async function fetchUserBookings(userId: string): Promise<Booking[]> {
		try {
			const chargersSnapshot = await getDocs(collection(db, 'chargers'));
			const allBookings: Booking[] = [];

			for (const chargerDoc of chargersSnapshot.docs) {
				const bookingsQuery = query(
					collection(db, 'chargers', chargerDoc.id, 'bookings'),
					where('userId', '==', userId),
					orderBy('startTime', 'desc')
				);
				const bookingsSnapshot = await getDocs(bookingsQuery);
				for (const doc of bookingsSnapshot.docs) {
					allBookings.push({ id: doc.id, ...doc.data() } as Booking);
				}
			}

			return allBookings.sort(
				(a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
			);
		} catch {
			error = 'Failed to load your bookings';
			return [];
		}
	}

	return {
		get bookings() {
			return bookings;
		},
		get loading() {
			return loading;
		},
		get error() {
			return error;
		},
		subscribe
	};
}

export async function createBooking(data: {
	chargerId: string;
	startTime: string;
	endTime: string;
}) {
	const createFn = httpsCallable(functions, 'createBooking');
	const result = await createFn(data);
	return result.data as { success: boolean; bookingId: string } & Booking;
}

export async function cancelBooking(chargerId: string, bookingId: string) {
	const cancelFn = httpsCallable(functions, 'cancelBooking');
	const result = await cancelFn({ chargerId, bookingId });
	return result.data as { success: boolean };
}

export async function seedChargers() {
	const seedFn = httpsCallable(functions, 'seedChargers');
	const result = await seedFn();
	return result.data as { success: boolean; count?: number; message?: string };
}

export async function yieldBooking(chargerId: string, bookingId: string) {
	const yieldFn = httpsCallable(functions, 'yieldBooking');
	const result = await yieldFn({ chargerId, bookingId });
	return result.data as { success: boolean };
}

export async function reportPhysicalQueuer(chargerId: string) {
	const reportFn = httpsCallable(functions, 'reportPhysicalQueuer');
	const result = await reportFn({ chargerId });
	return result.data as { success: boolean; yieldedCount?: number };
}

// ── Vehicle Hooks ──────────────────────────────────────────────────────────────

export function useVehicles() {
	let vehicles = $state<Vehicle[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);

	const auth = getAuth();

	async function fetch() {
		const user = auth.currentUser;
		if (!user) return;

		loading = true;
		error = null;
		try {
			const q = query(
				collection(db, 'vehicles'),
				where('userId', '==', user.uid),
				orderBy('createdAt', 'desc')
			);
			const snapshot = await getDocs(q);
			vehicles = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Vehicle));
		} catch (err) {
			console.error('Failed to load vehicles:', err);
			error = 'Failed to load vehicles';
		} finally {
			loading = false;
		}
	}

	return {
		get vehicles() {
			return vehicles;
		},
		get loading() {
			return loading;
		},
		get error() {
			return error;
		},
		fetch
	};
}

export async function saveVehicle(
	vehicle: Omit<Vehicle, 'id' | 'userId' | 'createdAt' | 'updatedAt'>,
	vehicleId?: string
) {
	const user = getAuth().currentUser;
	if (!user) throw new Error('Not authenticated');

	const now = new Date().toISOString();
	const id = vehicleId || doc(collection(db, 'vehicles')).id;

	const data: Vehicle = {
		id,
		userId: user.uid,
		...vehicle,
		createdAt: now,
		updatedAt: now
	};

	await setDoc(doc(db, 'vehicles', id), data, { merge: true });
	return data;
}

export async function deleteVehicle(vehicleId: string) {
	await deleteDoc(doc(db, 'vehicles', vehicleId));
}
