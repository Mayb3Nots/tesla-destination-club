<script lang="ts">
	import type { ChargerSlot } from '$lib/types';

	interface Props {
		slots: ChargerSlot[];
	}

	let { slots }: Props = $props();

	function slotColor(status: ChargerSlot['status']): string {
		switch (status) {
			case 'available': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
			case 'charging': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
			case 'offline': return 'bg-gray-500/20 text-gray-500 border-gray-500/30';
		}
	}

	function slotLabel(status: ChargerSlot['status']): string {
		switch (status) {
			case 'available': return 'Open';
			case 'charging': return 'Charging';
			case 'offline': return 'Offline';
		}
	}

	function timeUntil(iso: string): string {
		const mins = Math.max(0, Math.round((new Date(iso).getTime() - Date.now()) / 60_000));
		return `${mins}m`;
	}
</script>

<div class="grid grid-cols-4 gap-2">
	{#each slots as slot}
		<div class="flex flex-col items-center gap-1 rounded-lg border p-2 {slotColor(slot.status)}">
			<span class="text-xs font-medium">{slotLabel(slot.status)}</span>
			{#if slot.status === 'charging' && slot.estimatedDone}
				<span class="text-[10px] opacity-70">{timeUntil(slot.estimatedDone)} left</span>
			{/if}
			{#if slot.status === 'offline'}
				<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 opacity-50" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
			{/if}
		</div>
	{/each}
</div>
