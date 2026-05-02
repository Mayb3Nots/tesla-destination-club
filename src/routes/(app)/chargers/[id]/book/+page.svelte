<script lang="ts">
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { useChargers, useBookingsRange, createBooking } from '$lib/firebase/firestore.svelte';
	import CalendarGrid from '$lib/components/CalendarGrid.svelte';
	import CoreButton from '$lib/components/CoreButton.svelte';
	import ShareButton from '$lib/components/ShareButton.svelte';
	import type { Charger } from '$lib/models/charger';
	import type { Booking } from '$lib/models/booking';
	import { formatTime12 } from '$lib/calendar-helpers';

	const chargerId = $derived($page.params.id);
	const chargersService = useChargers();
	let charger = $state<Charger | null>(null);

	let isSubmitting = $state(false);
	let submitError = $state<string | null>(null);
	let bookingSuccess = $state<{ bookingId: string } & Booking | null>(null);

	let allBookings = $state<Booking[]>([]);
	let bookingsService: ReturnType<typeof useBookingsRange> | null = null;

	$effect(() => {
		if (chargerId) {
			if (bookingsService) bookingsService.stop();
			const startDate = new Date();
			startDate.setHours(0, 0, 0, 0);
			const endDate = new Date();
			endDate.setDate(endDate.getDate() + 6);
			endDate.setHours(23, 59, 59, 999);
			bookingsService = useBookingsRange(chargerId, startDate, endDate);
			bookingsService.subscribe();
		}
	});

	$effect(() => {
		if (bookingsService) {
			allBookings = bookingsService.bookings;
		}
	});

	onMount(async () => {
		await chargersService.fetch();
		charger = chargersService.chargers.find((c) => c.id === chargerId) || null;
	});

	function buildShareText(): string {
		if (!charger || !bookingSuccess) return '';
		const date = new Date(bookingSuccess.startTime).toLocaleDateString('en-MY', {
			weekday: 'short',
			day: 'numeric',
			month: 'short'
		});
		return `Charging slot booked!\n${charger.name}\n${date}\n${formatTime12(new Date(bookingSuccess.startTime))} - ${formatTime12(new Date(bookingSuccess.endTime))}\n${bookingSuccess.estimatedMinutes} min`;
	}

	async function handleConfirmBooking(startTime: Date, endTime: Date) {
		if (!charger || isSubmitting) return;
		isSubmitting = true;
		submitError = null;

		try {
			const result = await createBooking({
				chargerId: charger.id,
				startTime: startTime.toISOString(),
				endTime: endTime.toISOString()
			});
			bookingSuccess = result;
		} catch (err: any) {
			submitError = err?.message || 'Failed to create booking. Please try again.';
		} finally {
			isSubmitting = false;
		}
	}
</script>

<svelte:head>
	<title>Book Slot — Tesla Destination Club</title>
</svelte:head>

<div class="mx-auto flex max-w-6xl flex-col px-4 py-6 lg:px-8" style="height: calc(100dvh - 4rem);">
	{#if bookingSuccess}
		<div class="flex h-full items-center justify-center">
			<div class="animate-scale-in w-full max-w-md rounded-2xl border border-border bg-surface-elevated p-8 text-center">
				<div
					class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-accent-green/10"
				>
					<svg
						width="28"
						height="28"
						viewBox="0 0 24 24"
						fill="none"
						stroke="var(--color-accent-green)"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<polyline points="20 6 9 17 4 12" />
					</svg>
				</div>
				<h2 class="font-display text-xl font-bold text-text-primary">Booking Confirmed</h2>
				<p class="mt-2 text-sm text-text-secondary">
					Your slot at {charger?.name} has been reserved.
				</p>
				<div class="mt-6 rounded-xl bg-surface-overlay p-4 text-left">
					<div class="space-y-2 text-sm">
						<div class="flex justify-between">
							<span class="text-text-muted">Date</span>
							<span class="text-text-primary">{new Date(bookingSuccess.startTime).toLocaleDateString('en-MY', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
						</div>
						<div class="flex justify-between">
							<span class="text-text-muted">Time</span>
							<span class="text-text-primary">
								{formatTime12(new Date(bookingSuccess.startTime))} -
								{formatTime12(new Date(bookingSuccess.endTime))}
							</span>
						</div>
						<div class="flex justify-between">
							<span class="text-text-muted">Duration</span>
							<span class="text-text-primary">{bookingSuccess.estimatedMinutes} min</span>
						</div>
					</div>
				</div>
				<div class="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
					<ShareButton title="Booking Confirmed" text={buildShareText()} class="sm:w-auto w-full">
						Share
					</ShareButton>
					<CoreButton variant="primary" href="/bookings" class="sm:w-auto w-full">
						View My Bookings
					</CoreButton>
					<CoreButton variant="secondary" href="/chargers/{chargerId}/queue" class="sm:w-auto w-full">
						View Queue
					</CoreButton>
				</div>
			</div>
		</div>
	{:else}
		<div class="flex min-h-0 flex-1 flex-col">
		<a
			href="/chargers"
			class="mb-4 inline-flex items-center gap-2 text-sm font-medium text-text-secondary transition-colors hover:text-text-primary"
		>
			<svg
				width="16"
				height="16"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
			>
				<path d="M19 12H5" />
				<path d="m12 19-7-7 7-7" />
			</svg>
			Back to chargers
		</a>

		{#if charger}
			<div class="mb-4 flex items-center justify-between">
				<div>
					<h1 class="font-display text-xl font-bold tracking-tight text-text-primary">
						Book a Slot
					</h1>
					<div class="mt-1 flex items-center gap-2">
						<span class="text-sm text-text-secondary">{charger.name}</span>
						<span class="text-text-muted">·</span>
						<span class="text-sm text-text-muted">{charger.address}</span>
					</div>
				</div>
				<div class="flex items-center gap-1.5 text-xs text-text-muted">
					<svg
						width="14"
						height="14"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<path d="M22 12h-4l-3 9L9 3l-3 9H2" />
					</svg>
					{charger.totalPorts} {charger.totalPorts === 1 ? 'port' : 'ports'} available
				</div>
			</div>

			{#if submitError}
				<div class="mb-3 rounded-lg bg-tesla-red/10 px-4 py-3 text-sm text-tesla-red-light">
					{submitError}
				</div>
			{/if}

			<div class="flex-1 overflow-hidden rounded-2xl border border-border bg-surface-elevated">
				<CalendarGrid
					bookings={allBookings}
					totalPorts={charger.totalPorts}
					onconfirm={handleConfirmBooking}
				/>
			</div>
		{:else}
			<div class="flex h-full items-center justify-center">
				<div class="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-tesla-red"></div>
			</div>
		{/if}
		</div>
	{/if}
</div>
