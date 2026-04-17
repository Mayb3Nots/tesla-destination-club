<script lang="ts">
	import { mockLocations } from '$lib/data/mock';
	import LocationCard from '$lib/components/LocationCard.svelte';
	import type { ChargerLocation } from '$lib/types';

	let search = $state('');
	let sortBy = $state<'distance' | 'queue'>('distance');

	let locations = $derived(
		mockLocations
			.filter(loc =>
				loc.name.toLowerCase().includes(search.toLowerCase()) ||
				loc.address.toLowerCase().includes(search.toLowerCase())
			)
			.sort((a, b) =>
				sortBy === 'distance' ? a.distance - b.distance : a.queue.total - b.queue.total
			)
	);

	let availableCount = $derived(mockLocations.filter(l => l.slots.some(s => s.status === 'available')).length);
	let inQueueCount = $derived(mockLocations.filter(l => l.queue.total > 0).length);
</script>

<svelte:head>
	<title>Nearby Chargers — Tesla Destination Club</title>
</svelte:head>

<div class="mx-auto max-w-lg px-4 pb-24 pt-4">
	<!-- Header -->
	<header class="mb-6">
		<h1 class="mb-1 text-2xl font-bold">Nearby Chargers</h1>
		<p class="text-sm text-gray-500">{availableCount} available · {inQueueCount} with queues</p>
	</header>

	<!-- Search -->
	<div class="relative mb-4">
		<svg xmlns="http://www.w3.org/2000/svg" class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
		<input
			type="text"
			placeholder="Search locations..."
			bind:value={search}
			class="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] py-2.5 pl-10 pr-4 text-sm text-white placeholder-gray-600 outline-none transition-colors focus:border-white/[0.15] focus:bg-white/[0.06]"
		/>
	</div>

	<!-- Sort -->
	<div class="mb-4 flex gap-2">
		<button
			onclick={() => sortBy = 'distance'}
			class="rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors {sortBy === 'distance'
				? 'border-white/20 bg-white/10 text-white'
				: 'border-white/[0.06] text-gray-500 hover:text-gray-300'}"
		>
			Nearest
		</button>
		<button
			onclick={() => sortBy = 'queue'}
			class="rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors {sortBy === 'queue'
				? 'border-white/20 bg-white/10 text-white'
				: 'border-white/[0.06] text-gray-500 hover:text-gray-300'}"
		>
			Shortest Queue
		</button>
	</div>

	<!-- Location List -->
	{#if locations.length === 0}
		<div class="flex flex-col items-center py-16 text-center text-gray-500">
			<svg xmlns="http://www.w3.org/2000/svg" class="mb-3 h-12 w-12 opacity-30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
			<p class="text-sm">No chargers found</p>
			<p class="text-xs">Try a different search</p>
		</div>
	{:else}
		<div class="flex flex-col gap-3">
			{#each locations as location (location.id)}
				<LocationCard {location} />
			{/each}
		</div>
	{/if}
</div>
