<script lang="ts">
	import { mockLocations } from '$lib/data/mock';
	import SlotGrid from '$lib/components/SlotGrid.svelte';
	import type { PageData } from './$types';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();

	let location = $derived(mockLocations.find(l => l.id === data.locationId) ?? mockLocations[0]);
	let joined = $state(false);
	let queuePosition = $derived(location.queue.position);

	function handleJoinQueue() {
		joined = true;
		queuePosition = location.queue.total + 1;
	}

	function handleLeaveQueue() {
		joined = false;
		queuePosition = 0;
	}
</script>

<svelte:head>
	<title>{location.name} — Tesla Destination Club</title>
</svelte:head>

<div class="mx-auto max-w-lg px-4 pb-24 pt-2">
	<!-- Back button -->
	<a href="/" class="mb-4 inline-flex items-center gap-1.5 text-sm text-gray-500 transition-colors hover:text-white">
		<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
		Back
	</a>

	<!-- Header -->
	<div class="mb-6">
		<h1 class="text-2xl font-bold">{location.name}</h1>
		<p class="text-sm text-gray-500">{location.address}</p>
	</div>

	<!-- Map placeholder -->
	<div class="mb-6 flex h-40 items-center justify-center rounded-2xl border border-white/[0.06] bg-white/[0.02] text-gray-600">
		<div class="text-center">
			<svg xmlns="http://www.w3.org/2000/svg" class="mx-auto mb-2 h-8 w-8 opacity-40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
			<span class="text-xs">Map view</span>
		</div>
	</div>

	<!-- Charger Status -->
	<section class="mb-6">
		<h2 class="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">Charger Status</h2>
		<SlotGrid slots={location.slots} />
	</section>

	<!-- Queue Info -->
	<section class="mb-6">
		<h2 class="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">Queue</h2>
		<div class="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
			{#if joined}
				<div class="flex items-center justify-between">
					<div>
						<p class="text-sm text-gray-400">Your position</p>
						<p class="text-3xl font-bold text-red-400">#{queuePosition}</p>
						<p class="text-xs text-gray-500">Est. wait: {location.queue.estimatedWait}</p>
					</div>
					<button
						onclick={handleLeaveQueue}
						class="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/20"
					>
						Leave Queue
					</button>
				</div>
			{:else if location.queue.total > 0}
				<div class="flex items-center justify-between">
					<div>
						<p class="text-sm text-gray-400">People waiting</p>
						<p class="text-3xl font-bold">{location.queue.total}</p>
						<p class="text-xs text-gray-500">Est. wait: {location.queue.estimatedWait}</p>
					</div>
					<button
						onclick={handleJoinQueue}
						class="rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-700"
					>
						Join Queue
					</button>
				</div>
			{:else}
				<div class="flex items-center justify-between">
					<div>
						<p class="text-sm text-gray-400">Queue is empty</p>
						<p class="text-2xl font-bold text-emerald-400">⚡ Open</p>
						<p class="text-xs text-gray-500">No wait — just show up</p>
					</div>
					<button
						onclick={handleJoinQueue}
						class="rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-700"
					>
						Reserve Slot
					</button>
				</div>
			{/if}
		</div>
	</section>

	<!-- Info -->
	<section>
		<h2 class="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">Details</h2>
		<div class="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
			<div class="space-y-3 text-sm">
				<div class="flex justify-between">
					<span class="text-gray-500">Total chargers</span>
					<span class="font-medium">{location.totalSlots}</span>
				</div>
				<div class="flex justify-between">
					<span class="text-gray-500">Available now</span>
					<span class="font-medium text-emerald-400">{location.slots.filter(s => s.status === 'available').length}</span>
				</div>
				<div class="flex justify-between">
					<span class="text-gray-500">Charging</span>
					<span class="font-medium text-amber-400">{location.slots.filter(s => s.status === 'charging').length}</span>
				</div>
				<div class="flex justify-between">
					<span class="text-gray-500">Offline</span>
					<span class="font-medium text-gray-500">{location.slots.filter(s => s.status === 'offline').length}</span>
				</div>
				<div class="flex justify-between">
					<span class="text-gray-500">Distance</span>
					<span class="font-medium">{location.distance < 1 ? `${Math.round(location.distance * 1000)}m` : `${location.distance.toFixed(1)} km`}</span>
				</div>
				<div class="flex justify-between">
					<span class="text-gray-500">Last updated</span>
					<span class="font-medium">Just now</span>
				</div>
			</div>
		</div>
	</section>
</div>
