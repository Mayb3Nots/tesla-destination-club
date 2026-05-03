<script lang="ts">
	import { onMount } from 'svelte';
	import { useUserBookings, cancelBooking, checkInBooking, checkOutBooking } from '$lib/firebase/firestore.svelte';
	import CoreButton from '$lib/components/CoreButton.svelte';
	import ShareButton from '$lib/components/ShareButton.svelte';
	import { BookingStatus } from '$lib/models/booking';
	import type { Booking } from '$lib/models/booking';

	const bookingsService = useUserBookings();
	let cancellingId = $state<string | null>(null);
	let checkingInId = $state<string | null>(null);
	let checkingOutId = $state<string | null>(null);
	let actionError = $state<string | null>(null);
	let now = $state(new Date());

	onMount(() => {
		bookingsService.subscribe();
		// Update current time every 30 seconds for UI freshness
		const interval = setInterval(() => {
			now = new Date();
		}, 30_000);
		return () => clearInterval(interval);
	});

	let upcomingBookings = $derived(
		bookingsService.bookings.filter((b) => {
			if (b.status !== BookingStatus.Pending && b.status !== BookingStatus.Active) return false;
			// If the session end time has passed, it's no longer "upcoming"
			return new Date(b.endTime).getTime() > now.getTime();
		})
	);

	let pastBookings = $derived(
		bookingsService.bookings.filter((b) => {
			// Already in a terminal state
			if (
				b.status === BookingStatus.Completed ||
				b.status === BookingStatus.Cancelled ||
				b.status === BookingStatus.NoShow
			) return true;
			// Pending/active but endTime has passed — treat as past
			if (
				(b.status === BookingStatus.Pending || b.status === BookingStatus.Active) &&
				new Date(b.endTime).getTime() <= now.getTime()
			) return true;
			return false;
		})
	);

	const CHECK_IN_EARLY_MINUTES = 15;

	function canCheckIn(booking: Booking): boolean {
		if (booking.status !== BookingStatus.Pending) return false;
		const start = new Date(booking.startTime).getTime();
		const end = new Date(booking.endTime).getTime();
		const earliest = start - CHECK_IN_EARLY_MINUTES * 60 * 1000;
		const currentTime = now.getTime();
		return currentTime >= earliest && currentTime <= end;
	}

	function canCheckOut(booking: Booking): boolean {
		return booking.status === BookingStatus.Active;
	}

	function getEffectiveStatus(booking: Booking): BookingStatus {
		if (
			(booking.status === BookingStatus.Pending || booking.status === BookingStatus.Active) &&
			new Date(booking.endTime).getTime() <= now.getTime()
		) {
			return BookingStatus.Completed;
		}
		return booking.status;
	}

	function getStatusBadge(booking: Booking): { label: string; classes: string } {
		const status = getEffectiveStatus(booking);
		switch (status) {
			case BookingStatus.Pending:
				return {
					label: 'Confirmed',
					classes: 'bg-accent-blue/10 text-accent-blue'
				};
			case BookingStatus.Active:
				return {
					label: 'Checked In',
					classes: 'bg-accent-green/10 text-accent-green'
				};
			case BookingStatus.Completed:
				return {
					label: 'Completed',
					classes: 'bg-surface-muted text-text-muted'
				};
			case BookingStatus.Cancelled:
				return {
					label: 'Cancelled',
					classes: 'bg-surface-muted text-text-muted'
				};
			case BookingStatus.NoShow:
				return {
					label: 'No Show',
					classes: 'bg-tesla-red/10 text-tesla-red'
				};
		}
	}

	async function handleCancel(booking: Booking) {
		if (cancellingId || booking.status !== BookingStatus.Pending) return;

		cancellingId = booking.id;
		actionError = null;

		try {
			await cancelBooking(booking.chargerId, booking.id);
			bookingsService.subscribe();
		} catch (err: any) {
			actionError = err?.message || 'Failed to cancel booking.';
		} finally {
			cancellingId = null;
		}
	}

	async function handleCheckIn(booking: Booking) {
		if (checkingInId) return;

		checkingInId = booking.id;
		actionError = null;

		try {
			await checkInBooking(booking.chargerId, booking.id);
			bookingsService.subscribe();
		} catch (err: any) {
			actionError = err?.message || 'Failed to check in.';
		} finally {
			checkingInId = null;
		}
	}

	async function handleCheckOut(booking: Booking) {
		if (checkingOutId) return;

		checkingOutId = booking.id;
		actionError = null;

		try {
			await checkOutBooking(booking.chargerId, booking.id);
			bookingsService.subscribe();
		} catch (err: any) {
			actionError = err?.message || 'Failed to check out.';
		} finally {
			checkingOutId = null;
		}
	}

	function formatDateTime(iso: string): string {
		const d = new Date(iso);
		return d.toLocaleDateString('en-MY', {
			weekday: 'short',
			day: 'numeric',
			month: 'short'
		}) + ' ' + d.toLocaleTimeString('en-MY', {
			hour: '2-digit',
			minute: '2-digit',
			hour12: true
		});
	}

	function formatTime(iso: string): string {
		const d = new Date(iso);
		return d.toLocaleTimeString('en-MY', {
			hour: '2-digit',
			minute: '2-digit',
			hour12: true
		});
	}

	function formatDuration(minutes: number): string {
		const hrs = Math.floor(minutes / 60);
		const mins = minutes % 60;
		if (hrs === 0) return `${mins} min`;
		if (mins === 0) return `${hrs} hr`;
		return `${hrs} hr ${mins} min`;
	}

	function buildShareText(booking: Booking): string {
		const date = new Date(booking.startTime).toLocaleDateString('en-MY', {
			weekday: 'short',
			day: 'numeric',
			month: 'short'
		});
		const start = formatTime(booking.startTime);
		const end = formatTime(booking.endTime);
		const statusEmoji = booking.status === BookingStatus.Active ? '⚡' : '📅';
		return `${statusEmoji} *Tesla Destination Club*\n\n*${booking.chargerName}*\n${date}\n${start} – ${end}\n${formatDuration(booking.estimatedMinutes)}`;
	}
</script>

<svelte:head>
	<title>My Bookings — Tesla Destination Club</title>
</svelte:head>

<div class="mx-auto max-w-2xl px-6 py-10 lg:px-8">
	<div class="mb-8">
		<h1 class="font-display text-3xl font-bold tracking-tight text-text-primary">
			My Bookings
		</h1>
		<p class="mt-2 text-base text-text-secondary">
			Manage your charging reservations
		</p>
	</div>

	{#if bookingsService.loading}
		<div class="flex items-center justify-center py-20">
			<div
				class="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-tesla-red"
			></div>
		</div>
	{:else if bookingsService.bookings.length === 0}
		<div
			class="rounded-2xl border border-border bg-surface-elevated p-8 text-center"
		>
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
				<rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
				<line x1="16" y1="2" x2="16" y2="6" />
				<line x1="8" y1="2" x2="8" y2="6" />
				<line x1="3" y1="10" x2="21" y2="10" />
			</svg>
			<p class="text-sm text-text-secondary">You don't have any bookings yet</p>
			<CoreButton variant="primary" href="/chargers" class="mt-4">
				Book a Slot
			</CoreButton>
		</div>
	{:else}
		{#if actionError}
			<div class="mb-4 rounded-lg bg-tesla-red/10 px-4 py-3 text-sm text-tesla-red-light">
				{actionError}
			</div>
		{/if}

		<!-- Upcoming bookings -->
		{#if upcomingBookings.length > 0}
			<div class="mb-8">
				<h2
					class="mb-4 text-xs font-medium uppercase tracking-wider text-text-muted"
				>
					Upcoming
				</h2>
				<div class="space-y-3">
					{#each upcomingBookings as booking (booking.id)}
						{@const badge = getStatusBadge(booking)}
						<div
							class="rounded-xl border border-border bg-surface-elevated p-5 transition-all"
						>
							<div class="flex items-start justify-between gap-4">
								<div class="min-w-0 flex-1">
									<div class="mb-2 flex items-center gap-2">
										<h3
											class="truncate text-sm font-semibold text-text-primary"
										>
											{booking.chargerName}
										</h3>
										<span
											class="shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold {badge.classes}"
										>
											{badge.label}
										</span>
									</div>
									<div class="space-y-1 text-sm">
										<div class="flex items-center gap-2 text-text-secondary">
											<svg
												width="14"
												height="14"
												viewBox="0 0 24 24"
												fill="none"
												stroke="currentColor"
												stroke-width="1.5"
												stroke-linecap="round"
												stroke-linejoin="round"
											>
												<rect
													x="3"
													y="4"
													width="18"
													height="18"
													rx="2"
													ry="2"
												/>
												<line x1="16" y1="2" x2="16" y2="6" />
												<line x1="8" y1="2" x2="8" y2="6" />
												<line x1="3" y1="10" x2="21" y2="10" />
											</svg>
											{formatDateTime(booking.startTime)}
										</div>
										<div class="flex items-center gap-2 text-text-muted">
											<svg
												width="14"
												height="14"
												viewBox="0 0 24 24"
												fill="none"
												stroke="currentColor"
												stroke-width="1.5"
												stroke-linecap="round"
												stroke-linejoin="round"
											>
												<circle cx="12" cy="12" r="10" />
												<polyline
													points="12 6 12 12 16 14"
												/>
											</svg>
											{formatDuration(booking.estimatedMinutes)}
										</div>
										{#if booking.bayName || booking.bayLocation || booking.bayNames}
											<div class="flex items-center gap-2 text-accent-yellow">
												<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="shrink-0"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
												<span class="text-xs font-medium">{booking.bayName || booking.bayLocation || (booking.bayNames && booking.bayNames.length > 0 ? booking.bayNames.length === 1 ? booking.bayNames[0] : `${booking.bayNames[0]} – ${booking.bayNames[booking.bayNames.length - 1]}` : '')}</span>
											</div>
										{/if}
										{#if booking.status === BookingStatus.Active && booking.checkedInAt}
											<div class="flex items-center gap-2 text-accent-green">
												<svg
													width="14"
													height="14"
													viewBox="0 0 24 24"
													fill="none"
													stroke="currentColor"
													stroke-width="1.5"
													stroke-linecap="round"
													stroke-linejoin="round"
												>
													<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
													<polyline points="22 4 12 14.01 9 11.01" />
												</svg>
												<span class="text-xs font-medium">Checked in at {formatTime(booking.checkedInAt)}</span>
											</div>
										{/if}
									</div>
								</div>
								<div class="flex shrink-0 items-center gap-2">
									<ShareButton title="My Charging Session" text={buildShareText(booking)} compact />
									<div>
										{#if booking.status === BookingStatus.Active && canCheckOut(booking)}
											<button
												onclick={() => handleCheckOut(booking)}
												disabled={checkingOutId === booking.id}
												class="rounded-lg border border-accent-green/30 bg-accent-green/10 px-3 py-2 text-xs font-medium text-accent-green transition-all hover:bg-accent-green/20 disabled:opacity-50 disabled:cursor-not-allowed"
											>
												{checkingOutId === booking.id ? '...' : 'Check Out'}
											</button>
										{:else if booking.status === BookingStatus.Pending && canCheckIn(booking)}
											<button
												onclick={() => handleCheckIn(booking)}
												disabled={checkingInId === booking.id}
												class="rounded-lg border border-accent-blue/30 bg-accent-blue/10 px-3 py-2 text-xs font-medium text-accent-blue transition-all hover:bg-accent-blue/20 disabled:opacity-50 disabled:cursor-not-allowed"
											>
												{checkingInId === booking.id ? '...' : 'Check In'}
											</button>
										{:else if booking.status === BookingStatus.Pending}
											<button
												onclick={() => handleCancel(booking)}
												disabled={cancellingId === booking.id}
												class="rounded-lg border border-border px-3 py-2 text-xs font-medium text-text-muted transition-all hover:border-tesla-red hover:text-tesla-red disabled:opacity-50 disabled:cursor-not-allowed"
											>
												{cancellingId === booking.id ? '...' : 'Cancel'}
											</button>
										{/if}
									</div>
								</div>
							</div>
						</div>
					{/each}
				</div>
			</div>
		{/if}

		<!-- Past bookings -->
		{#if pastBookings.length > 0}
			<div>
				<h2
					class="mb-4 text-xs font-medium uppercase tracking-wider text-text-muted"
				>
					Past
				</h2>
				<div class="space-y-3">
					{#each pastBookings as booking (booking.id)}
						{@const badge = getStatusBadge(booking)}
						<div
							class="rounded-xl border border-border-subtle bg-surface-elevated/50 p-5 opacity-70"
						>
							<div class="flex items-start justify-between gap-4">
								<div class="min-w-0 flex-1">
									<div class="mb-2 flex items-center gap-2">
										<h3
											class="truncate text-sm font-medium text-text-primary"
										>
											{booking.chargerName}
										</h3>
										<span
											class="shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold {badge.classes}"
										>
											{badge.label}
										</span>
									</div>
									<div class="space-y-1 text-sm">
										<div class="flex items-center gap-2 text-text-muted">
											<svg
												width="14"
												height="14"
												viewBox="0 0 24 24"
												fill="none"
												stroke="currentColor"
												stroke-width="1.5"
												stroke-linecap="round"
												stroke-linejoin="round"
											>
												<rect
													x="3"
													y="4"
													width="18"
													height="18"
													rx="2"
													ry="2"
												/>
												<line x1="16" y1="2" x2="16" y2="6" />
												<line x1="8" y1="2" x2="8" y2="6" />
												<line x1="3" y1="10" x2="21" y2="10" />
											</svg>
											{formatDateTime(booking.startTime)}
										</div>
										{#if getEffectiveStatus(booking) === BookingStatus.Completed && booking.checkedInAt}
											<div class="flex items-center gap-2 text-text-muted">
												<svg
													width="14"
													height="14"
													viewBox="0 0 24 24"
													fill="none"
													stroke="currentColor"
													stroke-width="1.5"
													stroke-linecap="round"
													stroke-linejoin="round"
												>
													<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
													<polyline points="22 4 12 14.01 9 11.01" />
												</svg>
												{booking.checkedOutAt
													? `Checked in ${formatTime(booking.checkedInAt)} → Checked out ${formatTime(booking.checkedOutAt)}`
													: `Session completed (auto)`}
											</div>
										{:else if getEffectiveStatus(booking) === BookingStatus.Completed && !booking.checkedInAt}
											<div class="flex items-center gap-2 text-text-muted">
												<svg
													width="14"
													height="14"
													viewBox="0 0 24 24"
													fill="none"
													stroke="currentColor"
													stroke-width="1.5"
													stroke-linecap="round"
													stroke-linejoin="round"
												>
													<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
													<polyline points="22 4 12 14.01 9 11.01" />
												</svg>
												<span class="text-xs">Session ended — auto completed</span>
											</div>
										{/if}
									</div>
								</div>
								<ShareButton title="My Charging Session" text={buildShareText(booking)} compact />
							</div>
						</div>
					{/each}
				</div>
			</div>
		{/if}
	{/if}
</div>
