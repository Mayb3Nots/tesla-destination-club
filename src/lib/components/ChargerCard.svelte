<script lang="ts">
	import type { Charger } from '$lib/models/charger';
	import { getBayLocation } from '$lib/models/charger';
	import type { Booking } from '$lib/models/booking';

	let { charger, userBooking = null, isUnavailable = false } = $props();

	// Helper function to format port count
	function formatPortCount(ports: number): string {
		return ports === 1 ? '1 port' : `${ports} ports`;
	}

	// Helper function to get status pill text
	function getStatusPillText(): string {
		if (userBooking) {
			if (userBooking.status === 'active') {
				return 'Charging';
			} else if (userBooking.status === 'pending') {
				return 'Upcoming';
			}
		}
		
		// Check charger availability
		const availableNow = charger.totalPorts > 0;
		if (availableNow) {
			return 'Available now';
		} else {
			// This would be more dynamic in a real app, using wait time
			return 'In use · ~40 min';
		}
	}

	// Helper function to get status pill color
	function getStatusPillColor(): string {
		if (userBooking) {
			if (userBooking.status === 'active') {
				return 'bg-accent-green/10 text-accent-green';
			} else if (userBooking.status === 'pending') {
				return 'bg-accent-blue/10 text-accent-blue';
			}
		}
		
		// Check charger availability
		const availableNow = charger.totalPorts > 0;
		if (availableNow) {
			return 'bg-accent-green/10 text-accent-green';
		} else {
			return 'bg-text-muted/10 text-text-secondary';
		}
	}
</script>

<a
	href={userBooking ? `/chargers/${charger.id}/queue` : `/chargers/${charger.id}/book`}
	class={`group relative flex flex-col overflow-visible rounded-xl border border-border bg-surface-elevated p-5 transition-all duration-300 ${isUnavailable ? 'opacity-50' : ''} ${userBooking ? 'hover:border-accent-green/30' : 'hover:border-text-muted/30'}`}
>
	<!-- Chevron in top-right corner -->
	<svg
		class="absolute top-4 right-4 h-4 w-4 text-text-secondary group-hover:text-tesla-red transition-colors"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		stroke-width="1.5"
		stroke-linecap="round"
		stroke-linejoin="round"
	>
		<path d="m9 18 6-6-6-6" />
	</svg>

	<!-- Content -->
	<div class="flex flex-1 flex-col space-y-3">
		<!-- Title and Bay Tag -->
		<div class="space-y-2">
			<h2 class="font-display text-base font-medium text-text-primary leading-none">
				{charger.name}
			</h2>
			
			<p class="text-sm font-medium text-text-secondary">
				{charger.address || 'Normal Parking'}
			</p>
			
			<div class="flex items-center gap-1.5">
				<svg
					width="12"
					height="12"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="1.5"
					stroke-linecap="round"
					stroke-linejoin="round"
					class="shrink-0"
				>
					<path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
				</svg>
				<span class="text-xs font-medium text-text-secondary">
					{getBayLocation(charger)}
				</span>
			</div>
		</div>

		<!-- Horizontal rule -->
		<hr class="mt-auto border-border-subtle" />

		<!-- Footer row -->
		<div class="flex items-center justify-between">
			<!-- Status pill -->
			<div
				class={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${getStatusPillColor()}`}
			>
				{#if userBooking}
					<span class="h-2 w-2 rounded-full bg-current animate-pulse"></span>
				{:else}
					<span class="h-2 w-2 rounded-full bg-current"></span>
				{/if}
				{getStatusPillText()}
			</div>

			<!-- Port count -->
			<span class="text-xs font-medium text-text-secondary">
				{formatPortCount(charger.totalPorts)}
			</span>
		</div>
	</div>
</a>