<script lang="ts">
	import type { Booking } from '$lib/models/booking';
	import { BookingStatus } from '$lib/models/booking';
	import { formatTime12, SNAP_MINUTES, DEFAULT_SLOT_HEIGHT } from '$lib/calendar-helpers';
	import ShareButton from '$lib/components/ShareButton.svelte';

	type Props = {
		booking: Booking;
		portIndex: number;
		totalPorts: number;
		slotHeight?: number;
		currentUserId?: string;
		oncheckin?: (booking: Booking) => void;
		oncheckout?: (booking: Booking) => void;
		oncancel?: (booking: Booking) => void;
		checkInActionLoading?: string | null;
	};

	let {
		booking,
		portIndex,
		totalPorts,
		slotHeight = DEFAULT_SLOT_HEIGHT,
		currentUserId,
		oncheckin,
		oncheckout,
		oncancel,
		checkInActionLoading
	}: Props = $props();

	let showPopover = $state(false);
	let popoverEl = $state<HTMLDivElement | null>(null);

	let isOwnBooking = $derived(currentUserId && booking.userId === currentUserId);

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

	const CHECK_IN_EARLY_MINUTES = 15;

	function canCheckIn(): boolean {
		if (booking.status !== BookingStatus.Pending) return false;
		const now = new Date();
		const start = new Date(booking.startTime).getTime();
		const end = new Date(booking.endTime).getTime();
		const earliest = start - CHECK_IN_EARLY_MINUTES * 60 * 1000;
		return now.getTime() >= earliest && now.getTime() <= end;
	}

	function canCheckOut(): boolean {
		return booking.status === BookingStatus.Active;
	}

	function handleClick(e: MouseEvent) {
		if (!isOwnBooking) return;
		e.stopPropagation();
		showPopover = !showPopover;
	}

	function handleClickOutside(e: MouseEvent) {
		if (popoverEl && !popoverEl.contains(e.target as Node)) {
			showPopover = false;
		}
	}

	function formatTime(iso: string): string {
		return formatTime12(new Date(iso));
	}

	function getStatusLabel(): string {
		switch (booking.status) {
			case BookingStatus.Active:
				return 'Checked In';
			case BookingStatus.Pending:
				return 'Confirmed';
			default:
				return booking.status;
		}
	}

	function buildShareText(): string {
		const date = new Date(booking.startTime).toLocaleDateString('en-MY', {
			weekday: 'short',
			day: 'numeric',
			month: 'short'
		});
		const start = formatTime(booking.startTime);
		const end = formatTime(booking.endTime);
		const statusEmoji = booking.status === BookingStatus.Active ? '⚡' : '📅';
		return `${statusEmoji} *Tesla Destination Club*\n\n*${booking.chargerName}*\n${date}\n${start} – ${end}\n${booking.estimatedMinutes} min`;
	}
</script>

<svelte:window onclick={showPopover ? handleClickOutside : undefined} />

<div
	class="absolute left-0 right-0 overflow-visible rounded-md border px-2 transition-colors duration-200 {statusColor()} {isOwnBooking
		? 'cursor-pointer'
		: ''}"
	style="
		top: {eventTop()}px;
		height: {Math.max(eventHeight(), slotHeight / 2)}px;
		left: {eventLeft}%;
		width: {eventWidth}%;
	"
	onclick={handleClick}
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
			<div class="truncate opacity-90">
				{isOwnBooking ? 'You' : booking.userDisplayName}
			</div>
			{#if booking.bayName}
				<div class="truncate text-[10px] opacity-70">{booking.bayName}</div>
			{/if}
		{/if}
		{#if isOwnBooking && booking.status === BookingStatus.Active}
			<div class="flex items-center gap-1">
				<span class="h-1.5 w-1.5 rounded-full bg-accent-green animate-pulse"></span>
				<span class="truncate text-[10px] font-medium opacity-80">Charging</span>
			</div>
		{/if}
	</div>

	<!-- Popover for own booking -->
	{#if showPopover && isOwnBooking}
		<div
			bind:this={popoverEl}
			class="absolute left-0 z-50 mt-1 w-56 rounded-lg border border-border bg-surface-elevated p-3 shadow-xl"
			style="top: 100%;"
			onclick={(e) => e.stopPropagation()}
		>
			<div class="mb-2 flex items-center justify-between">
				<span class="text-xs font-semibold text-text-primary">Your Session</span>
				<span class="rounded-full px-2 py-0.5 text-[10px] font-semibold {booking.status === BookingStatus.Active
					? 'bg-accent-green/10 text-accent-green'
					: 'bg-accent-blue/10 text-accent-blue'}">
					{getStatusLabel()}
				</span>
			</div>
			<div class="mb-2 space-y-1 text-xs text-text-secondary">
				<div class="flex items-center gap-1.5">
					<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
						<circle cx="12" cy="12" r="10" />
						<polyline points="12 6 12 12 16 14" />
					</svg>
					{formatTime(booking.startTime)} – {formatTime(booking.endTime)}
				</div>
				<div class="text-text-muted">{booking.estimatedMinutes} min</div>
			</div>

			<div class="mb-2 flex gap-1">
				<ShareButton title="My Charging Session" text={buildShareText()} compact />
			</div>

			{#if canCheckOut() && oncheckout}
				<button
					class="w-full rounded-md bg-accent-green/20 px-3 py-2 text-xs font-semibold text-accent-green transition-colors hover:bg-accent-green/30 disabled:opacity-50"
					disabled={checkInActionLoading === booking.id}
					onclick={() => {
						oncheckout!(booking);
						showPopover = false;
					}}
				>
					{checkInActionLoading === booking.id ? 'Checking out...' : 'Check Out'}
				</button>
			{:else if canCheckIn() && oncheckin}
				<button
					class="w-full rounded-md bg-accent-blue/20 px-3 py-2 text-xs font-semibold text-accent-blue transition-colors hover:bg-accent-blue/30 disabled:opacity-50"
					disabled={checkInActionLoading === booking.id}
					onclick={() => {
						oncheckin!(booking);
						showPopover = false;
					}}
				>
					{checkInActionLoading === booking.id ? 'Checking in...' : 'Check In'}
				</button>
			{:else if booking.status === BookingStatus.Pending && oncancel}
				<button
					class="w-full rounded-md bg-tesla-red/10 px-3 py-2 text-xs font-semibold text-tesla-red-light transition-colors hover:bg-tesla-red/20 disabled:opacity-50"
					disabled={checkInActionLoading === booking.id}
					onclick={() => {
						oncancel!(booking);
						showPopover = false;
					}}
				>
					Cancel Booking
				</button>
			{:else if booking.status === BookingStatus.Pending}
				<div class="text-[10px] text-text-muted text-center">
					Check-in available 15 min before your slot
				</div>
			{/if}
		</div>
	{/if}
</div>
