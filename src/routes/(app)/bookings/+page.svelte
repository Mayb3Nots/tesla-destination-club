<script lang="ts">
	import { onMount } from 'svelte';
	import { useUserBookings, cancelBooking } from '$lib/firebase/firestore.svelte';
	import CoreButton from '$lib/components/CoreButton.svelte';
	import { BookingStatus } from '$lib/models/booking';
	import type { Booking } from '$lib/models/booking';

	const bookingsService = useUserBookings();
	let cancellingId = $state<string | null>(null);
	let cancelError = $state<string | null>(null);

	onMount(() => {
		bookingsService.subscribe();
	});

	let upcomingBookings = $derived(
		bookingsService.bookings.filter(
			(b) => b.status === BookingStatus.Pending || b.status === BookingStatus.Active
		)
	);

	let pastBookings = $derived(
		bookingsService.bookings.filter(
			(b) =>
				b.status === BookingStatus.Completed ||
				b.status === BookingStatus.Cancelled ||
				b.status === BookingStatus.NoShow
		)
	);

	function getStatusBadge(status: BookingStatus): { label: string; classes: string } {
		switch (status) {
			case BookingStatus.Pending:
				return {
					label: 'Confirmed',
					classes: 'bg-accent-blue/10 text-accent-blue'
				};
			case BookingStatus.Active:
				return {
					label: 'Active',
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
		cancelError = null;

		try {
			await cancelBooking(booking.chargerId, booking.id);
			bookingsService.subscribe();
		} catch (err: any) {
			cancelError = err?.message || 'Failed to cancel booking.';
		} finally {
			cancellingId = null;
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
		{#if cancelError}
			<div class="mb-4 rounded-lg bg-tesla-red/10 px-4 py-3 text-sm text-tesla-red-light">
				{cancelError}
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
						{@const badge = getStatusBadge(booking.status)}
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
											{booking.estimatedMinutes} min
										</div>
									</div>
								</div>
								<div class="shrink-0">
									{#if booking.status === BookingStatus.Pending}
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
						{@const badge = getStatusBadge(booking.status)}
						<div
							class="rounded-xl border border-border-subtle bg-surface-elevated/50 p-5 opacity-70"
						>
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
							<div class="flex items-center gap-2 text-sm text-text-muted">
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
						</div>
					{/each}
				</div>
			</div>
		{/if}
	{/if}
</div>
