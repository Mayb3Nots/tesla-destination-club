<script lang="ts">
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { useChargers, useBookingsRange, createBooking } from '$lib/firebase/firestore.svelte';
	import CalendarGrid from '$lib/components/CalendarGrid.svelte';
	import DateTimeInput from '$lib/components/DateTimeInput.svelte';
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

	let showManualInput = $state(false);
	let calendarSelection = $state<{ startTime: Date; endTime: Date; portIndex: number; isSuggested: boolean } | null>(null);
	let pendingManualTime = $state<{ startTime: Date; endTime: Date } | null>(null);

	function openManualInput() {
		// Seed pending state from current selection, or defaults
		if (calendarSelection) {
			pendingManualTime = { startTime: calendarSelection.startTime, endTime: calendarSelection.endTime };
		} else {
			const now = new Date();
			const start = new Date(now);
			start.setMinutes(Math.ceil(start.getMinutes() / 15) * 15, 0, 0);
			const end = new Date(start);
			end.setMinutes(end.getMinutes() + 60);
			pendingManualTime = { startTime: start, endTime: end };
		}
		showManualInput = true;
	}

	function handleManualTimeChange(startTime: Date, endTime: Date) {
		pendingManualTime = { startTime, endTime };
	}

	function confirmManualInput() {
		if (pendingManualTime) {
			calendarSelection = {
				startTime: pendingManualTime.startTime,
				endTime: pendingManualTime.endTime,
				portIndex: 0,
				isSuggested: false
			};
		}
		showManualInput = false;
	}

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
					<ShareButton title="Booking Confirmed" text={buildShareText()} size="sm" class="sm:w-auto w-full">
						Share
					</ShareButton>
					<CoreButton variant="primary" href="/bookings" size="sm" class="sm:w-auto w-full">
						View My Bookings
					</CoreButton>
					<CoreButton variant="secondary" href="/chargers/{chargerId}/queue" size="sm" class="sm:w-auto w-full">
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

			<!-- Manual time input toggle -->
			<div class="mb-3">
				<button
					class="inline-flex items-center gap-2 rounded-lg border border-border bg-surface-elevated px-3 py-2 text-xs font-medium text-text-secondary transition-colors hover:bg-surface-overlay"
					onclick={openManualInput}
				>
					<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
						<line x1="16" x2="16" y1="2" y2="6" />
						<line x1="8" x2="8" y1="2" y2="6" />
						<line x1="3" x2="21" y1="10" y2="10" />
					</svg>
					Enter manually
				</button>
			</div>

			{#if showManualInput}
				<!-- Backdrop -->
				<!-- svelte-ignore a11y_click_events_have_key_events -->
				<!-- svelte-ignore a11y_no_static_element_interactions -->
				<div
					class="fixed inset-0 z-40 animate-fade-in bg-black/50 backdrop-blur-sm"
					onclick={() => (showManualInput = false)}
				></div>

				<!-- Bottom sheet (mobile) / Dialog (desktop) -->
				<div class="fixed inset-0 z-50 flex items-end sm:items-center sm:justify-center">
					<div
						class="w-full max-h-[85dvh] overflow-y-auto rounded-t-2xl border-t border-border bg-surface-elevated p-5 shadow-xl animate-slide-up sm:max-w-md sm:rounded-2xl sm:border sm:animate-scale-in"
					>
						<!-- Drag handle (mobile only) -->
						<div class="mb-4 flex justify-center sm:hidden">
							<div class="h-1 w-10 rounded-full bg-border"></div>
						</div>

						<!-- Header -->
						<div class="mb-4 flex items-center justify-between">
							<h3 class="font-display text-base font-semibold text-text-primary">Manual Input</h3>
							<button
								class="flex h-8 w-8 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-surface-overlay hover:text-text-primary"
								onclick={() => (showManualInput = false)}
							>
								<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
									<line x1="18" x2="6" y1="6" y2="18" />
									<line x1="6" x2="18" y1="6" y2="18" />
								</svg>
							</button>
						</div>

						<DateTimeInput
							startTime={pendingManualTime?.startTime ?? new Date()}
							endTime={pendingManualTime?.endTime ?? new Date()}
							onchange={handleManualTimeChange}
						/>

						<!-- Confirm button -->
						<div class="mt-4">
							<CoreButton
								variant="primary"
								onclick={confirmManualInput}
								class="w-full"
							>
								Confirm
							</CoreButton>
						</div>
					</div>
				</div>
			{/if}

			<div class="min-h-[400px] flex-1 overflow-hidden rounded-2xl border border-border bg-surface-elevated">
				<CalendarGrid
					bookings={allBookings}
					totalPorts={charger.totalPorts}
					onconfirm={handleConfirmBooking}
					bind:selection={calendarSelection}
					{isSubmitting}
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
