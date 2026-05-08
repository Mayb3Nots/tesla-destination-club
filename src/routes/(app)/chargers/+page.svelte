<script lang="ts">
	import { onMount } from 'svelte';
	import {
		useChargers,
		useUserBookings,
		checkInBooking,
		checkOutBooking
	} from '$lib/firebase/firestore.svelte';
	import { getAuthState } from '$lib/firebase/auth.svelte';
	import ChargerCard from '$lib/components/ChargerCard.svelte';
	import type { Charger } from '$lib/models/charger';
	import { BookingStatus } from '$lib/models/booking';
	import type { Booking } from '$lib/models/booking';
	import { getNextAvailableTime } from '$lib/calendar-helpers';
	import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
	import { db } from '$lib/firebase/client';
	import ReportUnregisteredModal from '$lib/components/ReportUnregisteredModal.svelte';

	const chargersService = useChargers();
	const auth = getAuthState();

	let bookingsService: ReturnType<typeof useUserBookings> | null = $state(null);
	let actionLoading = $state<string | null>(null);
	let actionError = $state<string | null>(null);
	let now = $state(new Date());
	let reportModalCharger = $state<Charger | null>(null);

	let chargerAvailability = $state<
		Map<string, { waitMinutes: number; isAvailableNow: boolean }>
	>(new Map());

	const CHECK_IN_EARLY_MINUTES = 15;

	async function fetchAvailability() {
		const avail = new Map<string, { waitMinutes: number; isAvailableNow: boolean }>();
		const refNow = new Date();
		const startOfDay = new Date(refNow);
		startOfDay.setHours(0, 0, 0, 0);
		const endOfDay = new Date(refNow);
		endOfDay.setHours(23, 59, 59, 999);

		for (const charger of chargersService.chargers) {
			try {
				const q = query(
					collection(db, 'chargers', charger.id, 'bookings'),
					where('startTime', '>=', startOfDay.toISOString()),
					where('startTime', '<=', endOfDay.toISOString()),
					orderBy('startTime', 'asc')
				);
				const snapshot = await getDocs(q);
				const bookings = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Booking));
				const next = getNextAvailableTime(bookings, charger.totalPorts, refNow);
				if (next) {
					avail.set(charger.id, {
						waitMinutes: next.waitMinutes,
						isAvailableNow: next.isAvailableNow
					});
				}
			} catch {
				// Silently skip — availability is non-critical
			}
		}
		chargerAvailability = avail;
	}

	onMount(async () => {
		await chargersService.fetch();

		if (auth.currentUser) {
			bookingsService = useUserBookings();
			bookingsService.subscribe();

			
		}

		await fetchAvailability();

		// Refresh current time every minute
		const interval = setInterval(() => {
			now = new Date();
		}, 60_000);
		return () => clearInterval(interval);
	});

	function getAvailablePorts(charger: Charger): string {
		return `${charger.totalPorts} ports`;
	}

	function getUserBookingForCharger(chargerId: string): Booking | undefined {
		if (!bookingsService) return undefined;
		return bookingsService.bookings.find(
			(b) =>
				b.chargerId === chargerId &&
				(b.status === BookingStatus.Pending || b.status === BookingStatus.Active) &&
				new Date(b.endTime).getTime() > now.getTime()
		);
	}

	function canCheckIn(booking: Booking): boolean {
		if (booking.status !== BookingStatus.Pending) return false;
		const start = new Date(booking.startTime).getTime();
		const end = new Date(booking.endTime).getTime();
		const earliest = start - CHECK_IN_EARLY_MINUTES * 60 * 1000;
		return now.getTime() >= earliest && now.getTime() <= end;
	}

	function canCheckOut(booking: Booking): boolean {
		return booking.status === BookingStatus.Active;
	}

	function formatTime(iso: string): string {
		const d = new Date(iso);
		return d.toLocaleTimeString('en-MY', {
			hour: '2-digit',
			minute: '2-digit',
			hour12: true
		});
	}

	async function handleCheckIn(booking: Booking) {
		if (actionLoading) return;
		actionLoading = booking.id;
		actionError = null;
		try {
			await checkInBooking(booking.chargerId, booking.id);
		} catch (err: any) {
			actionError = err?.message || 'Failed to check in.';
		} finally {
			actionLoading = null;
		}
	}

	async function handleCheckOut(booking: Booking) {
		if (actionLoading) return;
		actionLoading = booking.id;
		actionError = null;
		try {
			await checkOutBooking(booking.chargerId, booking.id);
		} catch (err: any) {
			actionError = err?.message || 'Failed to check out.';
		} finally {
			actionLoading = null;
		}
	}
</script>

<svelte:head>
	<title>Chargers — Tesla Destination Club</title>
	<meta
		name="description"
		content="Browse Tesla destination charger locations in Malaysia. Check availability and book your slot."
	/>
</svelte:head>

<div class="relative z-10 mx-auto max-w-6xl px-6 py-10 lg:px-8">
		<div class="mb-8">
			<h1 class="font-display text-3xl font-bold tracking-tight text-text-primary">
				{auth.currentUser ? 'Choose a Charger' : 'Charger Locations'}
			</h1>
			<p class="mt-2 text-base text-text-secondary">
				{auth.currentUser ? 'Select a Tesla destination charger to book your slot or just view the status' : 'Browse Tesla destination chargers and check availability'}
			</p>
		</div>

	{#if chargersService.loading}
		<div class="flex items-center justify-center py-20">
			<div
				class="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-tesla-red"
			></div>
		</div>
	{:else if chargersService.error}
		<div class="rounded-xl border border-border bg-surface-elevated p-6 text-center">
			<p class="text-sm text-text-secondary">{chargersService.error}</p>
		</div>
	{:else if chargersService.chargers.length === 0}
		<div class="rounded-xl border border-border bg-surface-elevated p-8 text-center">
			<svg
				class="mx-auto mb-4 text-text-muted"
				width="40"
				height="40"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="1.5"
				stroke-linecap="round"
				stroke-linejoin="round"
			>
				<path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
			</svg>
			<p class="text-sm text-text-secondary">No chargers available yet</p>
			
		</div>
	{:else}
		{#if actionError}
			<div class="mb-4 rounded-lg bg-tesla-red/10 px-4 py-3 text-sm text-tesla-red-light">
				{actionError}
			</div>
		{/if}

		<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
			{#each chargersService.chargers as charger (charger.id)}
				{@const userBooking = getUserBookingForCharger(charger.id)}
				<ChargerCard
					charger={charger}
					userBooking={userBooking}
					isUnavailable={charger.totalPorts === 0}
				/>
			{/each}
		</div>
	{/if}
</div>

{#if reportModalCharger}
	<ReportUnregisteredModal
		charger={reportModalCharger}
		onClose={() => (reportModalCharger = null)}
	/>
{/if}
