<script lang="ts">
	import type { Booking } from '$lib/models/booking';
	import { BookingStatus } from '$lib/models/booking';
	import { formatTime12, SNAP_MINUTES, DEFAULT_SLOT_HEIGHT } from '$lib/calendar-helpers';

	type Props = {
		booking: Booking;
		portIndex: number;
		totalPorts: number;
		slotHeight?: number;
	};

	let { booking, portIndex, totalPorts, slotHeight = DEFAULT_SLOT_HEIGHT }: Props = $props();

	let eventTop = $derived(() => {
		const start = new Date(booking.startTime);
		const minutes = start.getHours() * 60 + start.getMinutes();
		return (minutes / SNAP_MINUTES) * slotHeight;
	});

	let eventHeight = $derived(() => {
		const start = new Date(booking.startTime);
		const end = new Date(booking.endTime);
		const durationMinutes = (end.getTime() - start.getTime()) / 60000;
		return (durationMinutes / SNAP_MINUTES) * slotHeight;
	});

	let eventLeft = $derived((portIndex / totalPorts) * 100);
	let eventWidth = $derived(100 / totalPorts);

	let statusColor = $derived(() => {
		switch (booking.status) {
			case BookingStatus.Active:
				return 'bg-accent-green/20 border-accent-green/40 text-accent-green';
			case BookingStatus.Pending:
				return 'bg-accent-blue/20 border-accent-blue/40 text-accent-blue';
			case BookingStatus.Completed:
				return 'bg-surface-muted/50 border-border-subtle text-text-muted';
			case BookingStatus.Cancelled:
				return 'bg-surface-muted/30 border-border-subtle text-text-muted opacity-50';
			case BookingStatus.NoShow:
				return 'bg-tesla-red/10 border-tesla-red/30 text-tesla-red-light';
			default:
				return 'bg-surface-overlay border-border text-text-secondary';
		}
	});

	let showDetails = $derived(eventHeight() >= slotHeight * 2);
	let showTime = $derived(eventHeight() >= slotHeight);
	let showEndTime = $derived(eventHeight() >= slotHeight * 1.5);
</script>

<div
	class="absolute left-0 right-0 overflow-hidden rounded-md border px-2 transition-colors duration-200 {statusColor()}"
	style="
		top: {eventTop()}px;
		height: {Math.max(eventHeight(), slotHeight / 2)}px;
		left: {eventLeft}%;
		width: {eventWidth}%;
	"
>
	<div class="flex h-full flex-col justify-start gap-0.5 overflow-hidden text-xs leading-tight">
		{#if showTime}
			<div class="truncate font-semibold">
				{formatTime12(new Date(booking.startTime))}
				{#if showEndTime}
					- {formatTime12(new Date(booking.endTime))}
				{/if}
			</div>
		{/if}
		{#if showDetails}
			<div class="truncate opacity-90">{booking.userDisplayName}</div>
		{/if}
	</div>
</div>
