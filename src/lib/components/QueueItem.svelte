<script lang="ts">
	import type { Booking } from '$lib/models/booking';

	interface QueueItemProps {
		booking: Booking;
		getUserInitial: (name: string) => string;
		getTimeRemaining: (endTime: string) => string;
		type: 'active' | 'upcoming';
		position?: number;
	}

	let { booking, getUserInitial, getTimeRemaining, type, position }: QueueItemProps =
		$props();

	let colorClass = $derived(
		type === 'active' ? 'bg-accent-green/10 text-accent-green' : 'bg-accent-blue/10 text-accent-blue'
	);
	let statusLabel = $derived(
		type === 'active'
			? getTimeRemaining(booking.endTime)
			: position
				? `#${position} in queue`
				: 'Upcoming'
	);
	let statusSublabel = $derived(type === 'active' ? 'remaining' : '');
</script>

{#key booking.id}
	<div
		class="flex items-center justify-between rounded-lg bg-surface-overlay px-4 py-3 transition-all"
	>
		<div class="flex items-center gap-3">
			<div
				class="flex h-8 w-8 items-center justify-center rounded-full {colorClass} text-xs font-bold"
			>
				{getUserInitial(booking.userDisplayName)}
			</div>
			<div>
				<p class="text-sm font-medium text-text-primary">{booking.userDisplayName}</p>
				<p class="text-xs text-text-muted">
					{new Date(booking.startTime).toLocaleTimeString('en-MY', {
						hour: '2-digit',
						minute: '2-digit',
						hour12: true
					})}
					-
					{new Date(booking.endTime).toLocaleTimeString('en-MY', {
						hour: '2-digit',
						minute: '2-digit',
						hour12: true
					})}
				</p>
			</div>
		</div>
		<div class="text-right">
			<p class="text-sm font-semibold {type === 'active'
				? 'text-tesla-red'
				: 'text-accent-blue'}">{statusLabel}</p>
			{#if statusSublabel}
				<p class="text-xs text-text-muted">{statusSublabel}</p>
			{/if}
		</div>
	</div>
{/key}
