<script lang="ts">
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { useChargers, useBookings } from '$lib/firebase/firestore.svelte';
	import CoreButton from '$lib/components/CoreButton.svelte';
	import QueueItem from '$lib/components/QueueItem.svelte';
	import type { Charger } from '$lib/models/charger';
	import { BookingStatus } from '$lib/models/booking';

	const chargerId = $derived($page.params.id);
	const chargersService = useChargers();
	let charger = $state<Charger | null>(null);

	let bookingsService = $state<ReturnType<typeof useBookings> | null>(null);
	let bookings = $state<import('$lib/models/booking').Booking[]>([]);

	const today = new Date();
	const todayStr = today.toISOString().split('T')[0];

	let now = $state(new Date());
	let intervalHandle: ReturnType<typeof setInterval> | null = null;

	onMount(async () => {
		if (!chargerId) return;
		await chargersService.fetch();
		charger = chargersService.chargers.find((c) => c.id === chargerId) || null;

		bookingsService = useBookings(chargerId, todayStr);
		bookingsService.subscribe();

		intervalHandle = setInterval(() => {
			now = new Date();
		}, 30000);
	});

	function getTimeRemaining(endTime: string): string {
		const end = new Date(endTime);
		const diff = end.getTime() - now.getTime();
		if (diff <= 0) return 'Ending soon';
		const minutes = Math.ceil(diff / (1000 * 60));
		if (minutes < 60) return `~${minutes} min`;
		const hours = Math.floor(minutes / 60);
		const mins = minutes % 60;
		return `~${hours}h ${mins}m`;
	}

	function getUserInitial(name: string): string {
		return name.charAt(0).toUpperCase();
	}

	let activeBookings = $derived(
		bookings
			.filter(
				(b) =>
					b.status !== BookingStatus.Cancelled &&
					b.status !== BookingStatus.NoShow &&
					new Date(b.startTime) <= now &&
					new Date(b.endTime) > now
			)
	);

	let upcomingBookings = $derived(
		bookings
			.filter(
				(b) =>
					b.status === BookingStatus.Pending && new Date(b.startTime) > now
			)
			.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
	);

	let totalActive = $derived(activeBookings.length);
	let freePorts = $derived(charger ? charger.totalPorts - totalActive : 0);
</script>

<svelte:head>
	<title>Live Queue — Tesla Destination Club</title>
</svelte:head>

<div class="mx-auto max-w-2xl px-6 py-10 lg:px-8">
	<a
		href="/chargers"
		class="mb-6 inline-flex items-center gap-2 text-sm font-medium text-text-secondary transition-colors hover:text-text-primary"
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
		<div class="mb-6 flex items-center justify-between">
			<div>
				<h1 class="font-display text-2xl font-bold tracking-tight text-text-primary">
					Live Queue
				</h1>
				<div class="mt-1 flex items-center gap-2">
					<span class="text-sm text-text-secondary">{charger.name}</span>
					<span class="text-text-muted">·</span>
					<span class="text-sm text-text-muted">{charger.address}</span>
				</div>
			</div>
			<span
				class="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold {freePorts > 0
					? 'bg-accent-green/10 text-accent-green'
					: 'bg-tesla-red/10 text-tesla-red'}"
			>
				<span class="h-1.5 w-1.5 rounded-full {freePorts > 0
					? 'bg-accent-green'
					: 'bg-tesla-red'}"></span>
				{freePorts > 0 ? `${freePorts} of ${charger.totalPorts} free` : 'All ports busy'}
			</span>
		</div>

		<div class="rounded-2xl border border-border bg-surface-elevated p-6 sm:p-8">
			{#if bookingsService?.loading}
				<div class="flex items-center justify-center py-10">
					<div
						class="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-tesla-red"
					></div>
				</div>
			{:else}
				{#if activeBookings.length > 0}
					<div class="mb-6">
						<h2
							class="mb-3 text-xs font-medium uppercase tracking-wider text-text-muted"
						>
							Currently Charging
						</h2>
						<div class="space-y-3">
							{#each activeBookings as booking}
								<QueueItem
									{booking}
									{getUserInitial}
									{getTimeRemaining}
									type="active"
								/>
							{/each}
						</div>
					</div>
				{:else}
					<div
						class="mb-6 rounded-xl border border-border-subtle bg-surface-overlay p-6 text-center"
					>
						<svg
							class="mx-auto mb-3 text-text-muted"
							width="32"
							height="32"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="1.5"
							stroke-linecap="round"
							stroke-linejoin="round"
						>
							<path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
						</svg>
						<p class="text-sm text-text-muted">No one is charging right now</p>
					</div>
				{/if}

				{#if upcomingBookings.length > 0}
					<div>
						<h2
							class="mb-3 text-xs font-medium uppercase tracking-wider text-text-muted"
						>
							Coming Up Next
						</h2>
						<div class="space-y-3">
							{#each upcomingBookings as booking, i}
								<QueueItem
									{booking}
									{getUserInitial}
									{getTimeRemaining}
									type="upcoming"
									position={i + 1}
								/>
							{/each}
						</div>
					</div>
				{/if}

				{#if activeBookings.length === 0 && upcomingBookings.length === 0}
					<div class="text-center py-4">
						<p class="text-sm text-text-secondary">
							No bookings for today. Be the first to reserve a slot!
						</p>
						<CoreButton variant="primary" href="/chargers/{chargerId}/book" class="mt-4">
							Book a Slot
						</CoreButton>
					</div>
				{/if}
			{/if}
		</div>
	{:else}
		<div class="flex items-center justify-center py-20">
			<div
				class="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-tesla-red"
			></div>
		</div>
	{/if}
</div>
