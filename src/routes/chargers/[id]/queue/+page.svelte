<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { useChargers, useBookings } from '$lib/firebase/firestore.svelte';
	import { getAuthState } from '$lib/firebase/auth.svelte';
	import CoreButton from '$lib/components/CoreButton.svelte';
	import QueueItem from '$lib/components/QueueItem.svelte';
	import type { Charger } from '$lib/models/charger';
	import { getBayLocation } from '$lib/models/charger';
	import { BookingStatus } from '$lib/models/booking';
	import { getNextAvailableTime, formatWaitTime, formatTime12 } from '$lib/calendar-helpers';

	const chargerId = $derived($page.params.id);
	const chargersService = useChargers();
	const auth = getAuthState();
	let charger = $state<Charger | null>(null);

	let bookingsService = $state<ReturnType<typeof useBookings> | null>(null);
	let bookings = $state<import('$lib/models/booking').Booking[]>([]);

	const today = new Date();
	const todayStr = today.toISOString().split('T')[0];

	let now = $state(new Date());
	let intervalHandle: ReturnType<typeof setInterval> | null = null;

	onMount(async () => {
		if (!chargerId) return;
		if (!auth.currentUser && !auth.loading) {
			goto('/login');
			return;
		}
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

	let nextSlot = $derived(
		charger
			? getNextAvailableTime(bookings, charger.totalPorts, now)
			: null
	);
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
			</div>
				<p class="mt-0.5 flex items-center gap-1.5 text-sm font-medium text-accent-yellow"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="shrink-0"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg> {getBayLocation(charger)}</p>
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

		<!-- Estimated Wait Time Card -->
		{#if nextSlot}
			<div class="mb-6 rounded-2xl border border-border bg-surface-elevated p-5">
				<div class="flex items-center justify-between">
					<div class="flex items-center gap-3">
						<div class="flex h-10 w-10 items-center justify-center rounded-xl {nextSlot.isAvailableNow
							? 'bg-accent-green/10'
							: 'bg-accent-blue/10'}">
							<svg
								width="20"
								height="20"
								viewBox="0 0 24 24"
								fill="none"
								stroke={nextSlot.isAvailableNow
									? 'var(--color-accent-green)'
									: 'var(--color-accent-blue)'}
								stroke-width="1.5"
								stroke-linecap="round"
								stroke-linejoin="round"
							>
								<circle cx="12" cy="12" r="10" />
								<polyline points="12 6 12 12 16 14" />
							</svg>
						</div>
						<div>
							<p class="text-xs font-medium uppercase tracking-wider text-text-muted">
								Next Available Slot
							</p>
							<p class="text-lg font-semibold {nextSlot.isAvailableNow
								? 'text-accent-green'
								: 'text-text-primary'}">
								{#if nextSlot.isAvailableNow}
									Available now
								{:else}
									{formatTime12(nextSlot.time)}
								{/if}
							</p>
						</div>
					</div>
					<div class="text-right">
						<p class="text-sm font-semibold {nextSlot.isAvailableNow
							? 'text-accent-green'
							: 'text-accent-blue'}">
							{formatWaitTime(nextSlot.waitMinutes)}
						</p>
						{#if !nextSlot.isAvailableNow}
							<p class="text-xs text-text-muted">
								{nextSlot.waitMinutes < 60
									? `${nextSlot.waitMinutes} min from now`
									: `${Math.floor(nextSlot.waitMinutes / 60)}h ${nextSlot.waitMinutes % 60}m from now`}
							</p>
						{/if}
					</div>
				</div>
				<a
					href="/chargers/{chargerId}/book"
					class="mt-3 block w-full rounded-xl {nextSlot.isAvailableNow
						? 'bg-accent-green/10 text-accent-green hover:bg-accent-green/20'
						: 'bg-accent-blue/10 text-accent-blue hover:bg-accent-blue/20'} px-4 py-2.5 text-center text-sm font-semibold transition-colors"
				>
					{#if nextSlot.isAvailableNow}
						Book a slot now →
					{:else}
						Book this slot →
					{/if}
				</a>
			</div>
		{/if}

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
