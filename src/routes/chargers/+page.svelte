<script lang="ts">
	import { onMount } from 'svelte';
	import {
		useChargers,
		seedChargers,
		useUserBookings,
		checkInBooking,
		checkOutBooking
	} from '$lib/firebase/firestore.svelte';
	import { getAuthState } from '$lib/firebase/auth.svelte';
	import CoreButton from '$lib/components/CoreButton.svelte';
	import type { Charger } from '$lib/models/charger';
	import { getBayLocation } from '$lib/models/charger';
	import { BookingStatus } from '$lib/models/booking';
	import type { Booking } from '$lib/models/booking';
	import { getNextAvailableTime, formatWaitTime } from '$lib/calendar-helpers';
	import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
	import { db } from '$lib/firebase/client';
	import ThemeToggle from '$lib/components/ThemeToggle.svelte';

	const chargersService = useChargers();
	const auth = getAuthState();

	let bookingsService: ReturnType<typeof useUserBookings> | null = $state(null);
	let actionLoading = $state<string | null>(null);
	let actionError = $state<string | null>(null);
	let now = $state(new Date());
	let profileMenuOpen = $state(false);

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

			if (chargersService.chargers.length === 0) {
				try {
					await seedChargers();
					await chargersService.fetch();
				} catch {
					// Seeding may fail due to permissions, that's okay
				}
			}
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

<div class="min-h-screen bg-surface">
	<!-- Navigation -->
	{#if auth.currentUser}
		<nav class="border-b border-border bg-surface-elevated/80 backdrop-blur-md sticky top-0 z-50">
			<div class="mx-auto flex max-w-6xl items-center justify-between px-6 py-4 lg:px-8">
				<a href="/chargers" class="flex items-center gap-3">
					<div class="flex h-8 w-8 items-center justify-center rounded-lg bg-tesla-red">
						<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
							<path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
						</svg>
					</div>
					<span class="font-display text-base font-bold tracking-tight text-text-primary">Destination Club</span>
				</a>
				<div class="flex items-center gap-2">
					<a href="/chargers" class="rounded-lg px-3 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-overlay hover:text-text-primary">
						Chargers
					</a>
					<ThemeToggle />
					<div class="relative ml-2">
						<button
							onclick={() => (profileMenuOpen = !profileMenuOpen)}
							class="flex items-center gap-2 rounded-lg border border-border bg-surface-overlay px-3 py-1.5 transition-colors hover:bg-surface-muted"
						>
							{#if auth.currentUser?.photoURL}
								<img
									src={auth.currentUser.photoURL}
									alt=""
									class="h-6 w-6 rounded-full object-cover"
								/>
							{:else}
								<div
									class="flex h-6 w-6 items-center justify-center rounded-full bg-tesla-red/20 text-xs font-semibold text-tesla-red"
								>
									{#if auth.currentUser?.displayName}
										{auth.currentUser.displayName.charAt(0).toUpperCase()}
									{:else if auth.currentUser?.email}
										{auth.currentUser.email.charAt(0).toUpperCase()}
									{/if}
								</div>
							{/if}
							<span class="max-w-[120px] truncate text-sm text-text-secondary">
								{auth.currentUser?.displayName || auth.currentUser?.email || 'User'}
							</span>
						</button>
						{#if profileMenuOpen}
							<!-- svelte-ignore a11y_no_static_element_interactions -->
							<div
								onclick={() => (profileMenuOpen = false)}
								class="fixed inset-0 z-40"
								aria-hidden="true"
								onkeydown={() => {}}
							></div>
							<div
								class="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-xl border border-border bg-surface-elevated shadow-2xl shadow-black/40"
							>
								<div class="border-b border-border px-4 py-3">
									<p class="truncate text-sm font-medium text-text-primary">
										{auth.currentUser?.displayName || 'User'}
									</p>
									<p class="truncate text-xs text-text-muted">
										{auth.currentUser?.email}
									</p>
								</div>
								<div class="p-1">
									<a
										href="/bookings"
										onclick={() => (profileMenuOpen = false)}
										class="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-overlay hover:text-text-primary"
									>
										<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
											<rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
											<line x1="16" y1="2" x2="16" y2="6" />
											<line x1="8" y1="2" x2="8" y2="6" />
											<line x1="3" y1="10" x2="21" y2="10" />
										</svg>
										My Bookings
									</a>
									<a
										href="/vehicles"
										onclick={() => (profileMenuOpen = false)}
										class="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-overlay hover:text-text-primary"
									>
										<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
											<path d="M14 16H9m10 0h3v-3.15a1 1 0 0 0-.84-.99L16 11l-2.7-3.6a1 1 0 0 0-.8-.4H5.24a2 2 0 0 0-1.8 1.1l-.8 1.63A6 6 0 0 0 2 12.42V16h2" />
											<circle cx="6.5" cy="16.5" r="2.5" />
											<circle cx="16.5" cy="16.5" r="2.5" />
										</svg>
										My Vehicles
									</a>
									<div class="my-1 border-t border-border"></div>
									<button
										onclick={() => {
											profileMenuOpen = false;
											auth.signOut();
										}}
										class="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-overlay hover:text-text-primary"
									>
										<svg
												width="16"
												height="16"
												viewBox="0 0 24 24"
												fill="none"
												stroke="currentColor"
												stroke-width="1.5"
												stroke-linecap="round"
												stroke-linejoin="round"
											>
												<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
												<polyline points="16 17 21 12 16 7" />
												<line x1="21" y1="12" x2="9" y2="12" />
											</svg>
											Sign Out
										</button>
								</div>
							</div>
						{/if}
					</div>
				</div>
			</div>
		</nav>
	{:else}
		<nav class="border-b border-border bg-surface-elevated/80 backdrop-blur-md sticky top-0 z-50">
			<div class="mx-auto flex max-w-6xl items-center justify-between px-6 py-4 lg:px-8">
				<a href="/" class="flex items-center gap-3">
					<div class="flex h-8 w-8 items-center justify-center rounded-lg bg-tesla-red">
						<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
							<path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
						</svg>
					</div>
					<span class="font-display text-base font-bold tracking-tight text-text-primary">Destination Club</span>
				</a>
				<CoreButton variant="ghost" size="sm" href="/login">
					Sign In
				</CoreButton>
			</div>
		</nav>
	{/if}

	<!-- Content -->
	<div class="mx-auto max-w-6xl px-6 py-10 lg:px-8">
		<div class="mb-8">
			<h1 class="font-display text-3xl font-bold tracking-tight text-text-primary">
				{auth.currentUser ? 'Choose a Charger' : 'Charger Locations'}
			</h1>
			<p class="mt-2 text-base text-text-secondary">
				{auth.currentUser ? 'Select a Tesla destination charger to book your slot' : 'Browse Tesla destination chargers and check availability'}
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
			{#if auth.currentUser}
				<button
					onclick={async () => {
						await seedChargers();
						await chargersService.fetch();
					}}
					class="mt-4 text-sm font-semibold text-tesla-red hover:text-tesla-red-light transition-colors"
				>
					Seed charger data
				</button>
			{/if}
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
				<a
				href={auth.currentUser ? `/chargers/${charger.id}/book` : '/login'}
					class="group rounded-2xl border border-border bg-surface-elevated p-6 transition-all duration-300 hover:border-text-muted/30 hover:bg-surface-overlay"
				>
					<div class="mb-4 flex items-center justify-between">
						<div
							class="flex h-10 w-10 items-center justify-center rounded-xl bg-tesla-red/10 transition-colors group-hover:bg-tesla-red/20"
						>
							<svg
								width="20"
								height="20"
								viewBox="0 0 24 24"
								fill="none"
								stroke="var(--color-tesla-red)"
								stroke-width="1.5"
								stroke-linecap="round"
								stroke-linejoin="round"
							>
								<path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
							</svg>
						</div>
						<span
							class="inline-flex items-center gap-1.5 rounded-full bg-accent-green/10 px-3 py-1 text-xs font-semibold text-accent-green"
						>
							{getAvailablePorts(charger)}
						</span>
					</div>
					<h2
						class="font-display text-lg font-semibold text-text-primary transition-colors group-hover:text-tesla-red"
					>
						{charger.name}
					</h2>
                <p class="mt-1 flex items-center gap-1.5 text-sm font-medium text-accent-yellow">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="shrink-0"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
                    {getBayLocation(charger)}
                </p>
					{#if userBooking}
						<!-- Active/Upcoming session banner -->
						<div
							class="mt-4 rounded-lg border {userBooking.status === BookingStatus.Active
								? 'border-accent-green/30 bg-accent-green/5'
								: 'border-accent-blue/30 bg-accent-blue/5'} p-3"
						onclick={(e) => e.stopPropagation()}
							role="presentation"
						>
							<div class="mb-2 flex items-center justify-between">
								<div class="flex items-center gap-1.5">
									{#if userBooking.status === BookingStatus.Active}
										<span class="h-2 w-2 rounded-full bg-accent-green animate-pulse"></span>
										<span class="text-xs font-semibold text-accent-green">Charging</span>
									{:else}
										<span class="h-2 w-2 rounded-full bg-accent-blue"></span>
										<span class="text-xs font-semibold text-accent-blue">Upcoming</span>
									{/if}
								</div>
								<span class="text-xs text-text-muted">
									{formatTime(userBooking.startTime)} – {formatTime(userBooking.endTime)}
								</span>
							</div>
							{#if canCheckOut(userBooking)}
								<button
									onclick={async (e) => {
										e.stopPropagation();
										e.preventDefault();
										await handleCheckOut(userBooking);
									}}
									disabled={actionLoading === userBooking.id}
									class="w-full rounded-md bg-accent-green/20 px-3 py-2 text-xs font-semibold text-accent-green transition-colors hover:bg-accent-green/30 disabled:opacity-50"
								>
									{actionLoading === userBooking.id ? 'Checking out...' : 'Check Out'}
								</button>
							{:else if canCheckIn(userBooking)}
								<button
									onclick={async (e) => {
										e.stopPropagation();
										e.preventDefault();
										await handleCheckIn(userBooking);
									}}
									disabled={actionLoading === userBooking.id}
									class="w-full rounded-md bg-accent-blue/20 px-3 py-2 text-xs font-semibold text-accent-blue transition-colors hover:bg-accent-blue/30 disabled:opacity-50"
								>
									{actionLoading === userBooking.id ? 'Checking in...' : 'Check In'}
								</button>
							{:else if userBooking.status === BookingStatus.Pending}
								<div class="text-xs text-text-muted">
									Check-in available 15 min before your slot
								</div>
							{/if}
						</div>
					{:else}
						{@const avail = chargerAvailability.get(charger.id)}
						<div class="mt-4 flex items-center justify-between">
							<div class="flex items-center gap-2">
								<svg
									width="14"
									height="14"
									viewBox="0 0 24 24"
									fill="none"
									stroke={avail?.isAvailableNow
										? 'var(--color-accent-green)'
										: 'var(--color-text-muted)'}
									stroke-width="1.5"
									stroke-linecap="round"
									stroke-linejoin="round"
								>
									<circle cx="12" cy="12" r="10" />
									<polyline points="12 6 12 12 16 14" />
								</svg>
								{#if avail}
									<span
										class="text-xs font-medium {avail.isAvailableNow
											? 'text-accent-green'
											: 'text-text-secondary'}"
									>
										{formatWaitTime(avail.waitMinutes)}
									</span>
								{:else}
									<span class="text-xs text-text-muted">Checking…</span>
								{/if}
							</div>
							{#if auth.currentUser}
								<span class="text-xs text-text-muted">Book a slot →</span>
							{/if}
						</div>
					{/if}

					{#if !auth.currentUser}
						<div class="mt-4 pt-4 border-t border-border-subtle">
							<span class="text-xs font-medium text-tesla-red">
								Sign in to book →
							</span>
						</div>
					{/if}
				</a>
			{/each}
		</div>
	{/if}
	</div>
</div>
