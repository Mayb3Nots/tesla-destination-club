<script lang="ts">
	import type { ChargerLocation, LocationStatus } from '$lib/types';
	import SlotGrid from './SlotGrid.svelte';

	interface Props {
		location: ChargerLocation;
	}

	let { location }: Props = $props();

	function getStatus(loc: ChargerLocation): LocationStatus {
		const offline = loc.slots.filter(s => s.status === 'offline').length;
		const charging = loc.slots.filter(s => s.status === 'charging').length;
		const available = loc.slots.filter(s => s.status === 'available').length;

		if (available > 0 && loc.queue.total === 0) return 'available';
		if (available === 0 && charging > 0) return 'full';
		if (offline === loc.totalSlots) return 'offline';
		return 'busy';
	}

	function statusBadge(status: LocationStatus): { text: string; class: string } {
		switch (status) {
			case 'available': return { text: 'Available Now', class: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' };
			case 'busy': return { text: 'Some Available', class: 'bg-amber-500/15 text-amber-400 border-amber-500/30' };
			case 'full': return { text: 'All Occupied', class: 'bg-red-500/15 text-red-400 border-red-500/30' };
			case 'offline': return { text: 'Offline', class: 'bg-gray-500/15 text-gray-500 border-gray-500/30' };
		}
	}

	let status = $derived(getStatus(location));
	let badge = $derived(statusBadge(status));
	let nextSlotEta = $derived(
		location.slots
			.filter(s => s.status === 'charging' && s.estimatedDone)
			.sort((a, b) => new Date(a.estimatedDone!).getTime() - new Date(b.estimatedDone!).getTime())[0]
			?.estimatedDone
	);

	function nextAvailable(): string {
		if (status === 'available') return 'Now';
		if (!nextSlotEta) return 'Unknown';
		const mins = Math.max(0, Math.round((new Date(nextSlotEta).getTime() - Date.now()) / 60_000));
		return mins <= 1 ? 'Any moment' : `~${mins} min`;
	}
</script>

<a
	href="/location/{location.id}"
	class="group block rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 transition-all hover:border-white/[0.12] hover:bg-white/[0.04]"
>
	<!-- Header -->
	<div class="mb-3 flex items-start justify-between gap-3">
		<div class="min-w-0 flex-1">
			<h3 class="truncate text-base font-semibold text-white">{location.name}</h3>
			<p class="truncate text-sm text-gray-500">{location.address}</p>
		</div>
		<span class="shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-medium {badge.class}">
			{badge.text}
		</span>
	</div>

	<!-- Slots -->
	<div class="mb-3">
		<SlotGrid {slots} />
	</div>

	<!-- Footer info -->
	<div class="flex items-center justify-between text-sm">
		<div class="flex items-center gap-3 text-gray-400">
			<span class="flex items-center gap-1">
				<svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
				{location.distance < 1 ? `${Math.round(location.distance * 1000)}m` : `${location.distance.toFixed(1)} km`}
			</span>
			<span class="flex items-center gap-1">
				<svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
				{location.queue.total} in queue
			</span>
		</div>
		{#if status !== 'offline'}
			<span class="text-white/60">
				{#if status === 'available'}
					⚡ Open
				{:else}
					Next: {nextAvailable()}
				{/if}
			</span>
		{/if}
	</div>
</a>
