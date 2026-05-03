<script lang="ts">
	import { onMount } from 'svelte';
	import type { Booking } from '$lib/models/booking';
	import {
		DEFAULT_SLOT_HEIGHT,
		TOTAL_SLOTS,
		SNAP_MINUTES,
		MIN_DURATION_MINUTES,
		DEFAULT_DURATION_MINUTES,
		formatHour,
		formatTime12,
		snapToGrid,
		toDateString,
		minutesToDate,
		timeToMinutes,
		computePortAssignments,
		findNextAvailableSlot,
		checkSlotAvailability
	} from '$lib/calendar-helpers';
	import CalendarEvent from './CalendarEvent.svelte';
	import CalendarSelection from './CalendarSelection.svelte';

	type Props = {
		bookings: Booking[];
		totalPorts: number;
		bayNames?: string[];
		onconfirm: (startTime: Date, endTime: Date, bayName: string) => void;
		selection?: { startTime: Date; endTime: Date; portIndex: number; isSuggested: boolean } | null;
		onselectionchange?: (selection: { startTime: Date; endTime: Date; portIndex: number; isSuggested: boolean } | null) => void;
		isSubmitting?: boolean;
		currentUserId?: string;
		oncheckin?: (booking: Booking) => void;
		oncheckout?: (booking: Booking) => void;
		oncancel?: (booking: Booking) => void;
		checkInActionLoading?: string | null;
	};

	let { bookings, totalPorts, bayNames, onconfirm, selection: externalSelection = $bindable(null), onselectionchange, isSubmitting = false, currentUserId, oncheckin, oncheckout, oncancel, checkInActionLoading }: Props = $props();

	// Internal selection state
	let selection = $state<{ startTime: Date; endTime: Date; portIndex: number; isSuggested: boolean } | null>(null);

	// Sync internal → external (parent)
	$effect(() => {
		externalSelection = selection;
		onselectionchange?.(selection);
	});

	// Sync external → internal
	let syncingFromExternal = $state(false);
	$effect(() => {
		if (externalSelection) {
			syncingFromExternal = true;
			selection = externalSelection;
			syncingFromExternal = false;
		}
	});

	const today = new Date();
	const days: { date: Date; dayLabel: string; dateLabel: string; dateStr: string }[] = [];
	for (let i = 0; i < 7; i++) {
		const d = new Date(today);
		d.setDate(d.getDate() + i);
		const dayLabel = i === 0 ? 'Today' : d.toLocaleDateString('en-MY', { weekday: 'short' });
		const dateLabel = d.toLocaleDateString('en-MY', { day: 'numeric', month: 'short' });
		days.push({ date: d, dayLabel, dateLabel, dateStr: toDateString(d) });
	}

	const hours = Array.from({ length: 24 }, (_, i) => i);

	let gridBodyEl = $state<HTMLDivElement | null>(null);
	let slotHeight = $state(DEFAULT_SLOT_HEIGHT);
	let totalGridHeight = $derived(TOTAL_SLOTS * slotHeight);

	let selectionDuration = $derived(
		selection
			? (selection.endTime.getTime() - selection.startTime.getTime()) / 60000
			: 0
	);

	let effectiveBayNames = $derived(bayNames ?? Array.from({ length: totalPorts }, (_, i) => `Bay ${i + 1}`));

	let selectedBayLabel = $derived(
		selection ? (effectiveBayNames[selection.portIndex] ?? effectiveBayNames[0]) : ''
	);

	function formatDuration(minutes: number): string {
		const hrs = Math.floor(minutes / 60);
		const mins = minutes % 60;
		if (hrs === 0) return `${mins} min`;
		if (mins === 0) return `${hrs} hr`;
		return `${hrs} hr ${mins} min`;
	}

	let isAvailable = $derived(() => {
		if (!selection) return true;
		const sel = selection;
		const startDateStr = toDateString(sel.startTime);
		const endDateStr = toDateString(sel.endTime);
		const isOverflow = endDateStr !== startDateStr;

		// Check main portion (same day as start)
		const dayBookings = bookings.filter(
			(b) =>
				toDateString(new Date(b.startTime)) === startDateStr &&
				b.status !== 'cancelled'
		);
		const mainAvailable = checkSlotAvailability(sel.startTime, sel.endTime, dayBookings, totalPorts);

		if (!mainAvailable) return false;

		// Check overflow portion (next day)
		if (isOverflow) {
			const nextDayBookings = bookings.filter(
				(b) =>
					toDateString(new Date(b.startTime)) === endDateStr &&
					b.status !== 'cancelled'
			);
			// Create a virtual range for the overflow portion (midnight to endTime on next day)
			const overflowStart = new Date(sel.endTime);
			overflowStart.setHours(0, 0, 0, 0);
			const overflowAvailable = checkSlotAvailability(overflowStart, sel.endTime, nextDayBookings, totalPorts);
			if (!overflowAvailable) return false;
		}

		return true;
	});

	let canConfirm = $derived(() => selection && isAvailable() && selectionDuration >= MIN_DURATION_MINUTES);

	// Overflow: when selection extends past midnight into next day
	let selectionOverflow = $derived.by(() => {
		if (!selection) return null;
		const startMin = timeToMinutes(selection.startTime);
		const endMin = timeToMinutes(selection.endTime);
		// If endTime is on a different date, it overflows
		const endDateStr = toDateString(selection.endTime);
		const startDateStr = toDateString(selection.startTime);
		if (endDateStr !== startDateStr) {
			return {
				dateStr: endDateStr,
				overflowMinutes: endMin,
				portIndex: selection.portIndex
			};
		}
		// Same day, no overflow
		return null;
	});

	let portAssignments = $derived(() => {
		const active = bookings.filter((b) => b.status !== 'cancelled');
		return computePortAssignments(active, bayNames);
	});

	let maxPorts = $derived(() => {
		const effectiveTotalPorts = bayNames?.length ?? totalPorts;
		let max = effectiveTotalPorts;
		for (const p of portAssignments().values()) {
			if (p + 1 > max) max = p + 1;
		}
		return max;
	});

	let minDayWidth = $derived(Math.max(120, maxPorts() * 80));

	function getAvailablePortForSlot(startMinutes: number, endMinutes: number): number {
		const effectiveTotalPorts = bayNames?.length ?? totalPorts;
		const usedPorts = new Set<number>();
		for (const [id, port] of portAssignments()) {
			const booking = bookings.find((b) => b.id === id);
			if (!booking || booking.status === 'cancelled') continue;
			const bStart = booking.startTime ? new Date(booking.startTime).getHours() * 60 + new Date(booking.startTime).getMinutes() : 0;
			const bEnd = booking.endTime ? new Date(booking.endTime).getHours() * 60 + new Date(booking.endTime).getMinutes() : 0;
			if (startMinutes < bEnd && endMinutes > bStart) {
				usedPorts.add(port);
			}
		}
		for (let p = 0; p < effectiveTotalPorts; p++) {
			if (!usedPorts.has(p)) return p;
		}
		return 0;
	}

	function isBayAvailable(bayIndex: number, startMinutes: number, endMinutes: number): boolean {
		for (const [id, port] of portAssignments()) {
			if (port !== bayIndex) continue;
			const booking = bookings.find((b) => b.id === id);
			if (!booking || booking.status === 'cancelled') continue;
			const bStart = booking.startTime ? new Date(booking.startTime).getHours() * 60 + new Date(booking.startTime).getMinutes() : 0;
			const bEnd = booking.endTime ? new Date(booking.endTime).getHours() * 60 + new Date(booking.endTime).getMinutes() : 0;
			if (startMinutes < bEnd && endMinutes > bStart) {
				return false;
			}
		}
		return true;
	}

	function handleDayClick(e: MouseEvent, dayIndex: number) {
		const target = e.currentTarget as HTMLElement;
		const rect = target.getBoundingClientRect();
		const y = e.clientY - rect.top;
		const x = e.clientX - rect.left;
		const effectiveTotalPorts = bayNames?.length ?? totalPorts;
		const clickedBayIndex = Math.min(Math.floor((x / rect.width) * effectiveTotalPorts), effectiveTotalPorts - 1);

		const minutes = snapToGrid((y / slotHeight) * SNAP_MINUTES);
		const clampedMinutes = Math.max(0, minutes);

		const day = days[dayIndex].date;
		const startTime = minutesToDate(clampedMinutes, day);
		let endMinutes = clampedMinutes + DEFAULT_DURATION_MINUTES;
		// Don't allow overflow on the last day (no next day in view)
		if (dayIndex === days.length - 1) {
			endMinutes = Math.min(endMinutes, TOTAL_SLOTS * SNAP_MINUTES);
		}
		// Allow overflow into next day
		const endTime = new Date(day);
		endTime.setHours(0, 0, 0, 0);
		endTime.setMinutes(endMinutes);

		// Use the clicked bay if it's available, otherwise find another
		const effectiveEndMin = Math.min(endMinutes, TOTAL_SLOTS * SNAP_MINUTES);
		let portIndex: number;
		if (isBayAvailable(clickedBayIndex, clampedMinutes, effectiveEndMin)) {
			portIndex = clickedBayIndex;
		} else {
			portIndex = getAvailablePortForSlot(clampedMinutes, effectiveEndMin);
		}

		selection = { startTime, endTime, portIndex, isSuggested: false };
	}

	function handleSelectionConfirm() {
		if (!selection || !canConfirm()) return;
		const effectiveBayNames = bayNames ?? Array.from({ length: totalPorts }, (_, i) => `Bay ${i + 1}`);
		const selectedBayName = effectiveBayNames[selection.portIndex] ?? effectiveBayNames[0];
		onconfirm(selection.startTime, selection.endTime, selectedBayName);
	}

	function handleSelectionCancel() {
		selection = null;
	}

	function handleSelectionChange(start: Date, end: Date) {
		if (selection) {
			const startMin = start.getHours() * 60 + start.getMinutes();
			const endMin = end.getHours() * 60 + end.getMinutes();
			const isOverflow = toDateString(end) !== toDateString(start);
			// For port assignment, use the main portion (clamped to midnight if overflow)
			const effectiveEndMin = isOverflow ? TOTAL_SLOTS * SNAP_MINUTES : endMin;
			// Keep the same bay, but check if it's still available
			let portIndex = selection.portIndex;
			if (!isBayAvailable(portIndex, startMin, effectiveEndMin)) {
				// Current bay is taken, find another
				portIndex = getAvailablePortForSlot(startMin, effectiveEndMin);
			}
			selection = {
				...selection,
				startTime: start,
				endTime: end,
				portIndex
			};
		}
	}

	function scrollToNow() {
		if (gridBodyEl) {
			const nowMinutes = new Date().getHours() * 60 + new Date().getMinutes();
			const nowTop = (nowMinutes / SNAP_MINUTES) * slotHeight;
			gridBodyEl.scrollTo({ top: Math.max(0, nowTop - gridBodyEl.clientHeight / 3) });
		}
	}

	onMount(() => {
		if (!selection && bookings.length >= 0) {
			const suggestion = findNextAvailableSlot(bookings, totalPorts, today);
			if (suggestion) {
				const portIndex = getAvailablePortForSlot(
					suggestion.startTime.getHours() * 60 + suggestion.startTime.getMinutes(),
					suggestion.endTime.getHours() * 60 + suggestion.endTime.getMinutes()
				);
				selection = {
					startTime: suggestion.startTime,
					endTime: suggestion.endTime,
					portIndex,
					isSuggested: true
				};
			}
		}

		scrollToNow();
	});
</script>

<div class="flex flex-col h-full">
	<!-- Main scroll container (both horizontal and vertical) -->
	<div class="flex-1 overflow-auto" bind:this={gridBodyEl}>
		<!-- Sticky header wrapper -->
		<div class="sticky top-0 z-30">
			<!-- Day header -->
			<div class="flex border-b border-border bg-surface-elevated">
				<!-- Time gutter -->
				<div class="w-16 shrink-0 sticky left-0 z-40 bg-surface-elevated"></div>
				{#each days as day, i}
					<button
						style="min-width: {minDayWidth}px; flex: 1 0 {minDayWidth}px;"
						class="flex flex-col items-center gap-0.5 py-3 text-center transition-colors hover:bg-surface-overlay border-l border-border-subtle {selection &&
						toDateString(selection.startTime) === day.dateStr
							? 'bg-tesla-red/10'
							: ''}"
						onclick={() => {
							if (selection) {
								handleSelectionCancel();
							}
						}}
					>
						<span class="text-[11px] font-medium uppercase tracking-wider text-text-muted {i === 0 ? 'text-tesla-red' : ''}">
							{day.dayLabel}
						</span>
						<span class="text-sm font-bold font-[family-name:var(--font-display)] text-text-primary {i === 0 ? 'text-tesla-red' : ''}">
							{day.dateLabel}
						</span>
					</button>
				{/each}
			</div>

			<!-- Bay name sub-headers (only when bay names are provided) -->
			{#if bayNames && bayNames.length > 1}
				<div class="flex border-b border-border-subtle bg-surface-elevated">
					<div class="w-16 shrink-0 sticky left-0 z-40 bg-surface-elevated"></div>
					{#each days as day}
						<div style="min-width: {minDayWidth}px; flex: 1 0 {minDayWidth}px;" class="flex border-l border-border-subtle">
							{#each bayNames as name, bayIdx}
								<div class="flex-1 text-center text-[10px] font-medium text-accent-yellow py-1.5 truncate px-0.5 {bayIdx > 0 ? 'border-l border-border-subtle/50' : ''}">
									{name}
								</div>
							{/each}
						</div>
					{/each}
				</div>
			{/if}
		</div>

		<!-- Grid body with fixed height for vertical content -->
		<div class="flex relative" style="height: {totalGridHeight}px;">
			<!-- Time labels gutter (sticky left) -->
			<div class="w-16 shrink-0 relative overflow-visible sticky left-0 z-20 bg-surface">
				{#each hours as hour}
					<div
						class="absolute right-2 text-[11px] font-medium text-text-muted select-none {hour === 0 ? 'translate-y-0' : '-translate-y-1/2'}"
						style="top: {hour === 0 ? 0 : hour * 4 * slotHeight}px;"
					>
						{formatHour(hour)}
					</div>
				{/each}
			</div>

			<!-- Day columns -->
			<div class="flex relative" style="flex: 1 0 auto;">
				{#each days as day, dayIndex}
					<div
						style="min-width: {minDayWidth}px; flex: 1 0 {minDayWidth}px;"
						class="relative border-l border-border-subtle"
						onclick={(e) => {
							handleDayClick(e, dayIndex);
						}}
						role="gridcell"
						tabindex="0"
					>
						<!-- Hour gridlines -->
						{#each hours as hour}
							<div
								class="absolute left-0 right-0 border-t border-border-subtle"
								style="top: {hour * 4 * slotHeight}px;"
							></div>
							<div
								class="absolute left-0 right-0 border-t border-border-subtle/50"
								style="top: {hour * 4 * slotHeight + 2 * slotHeight}px;"
							></div>
						{/each}

						<!-- Bay lane dividers (vertical lines between bays) -->
						{#if (bayNames?.length ?? totalPorts) > 1}
							{#each Array.from({ length: (bayNames?.length ?? totalPorts) - 1 }) as _, bayIdx}
								<div
									class="absolute top-0 bottom-0 border-l border-border-subtle/30 pointer-events-none z-[5]"
									style="left: {((bayIdx + 1) / (bayNames?.length ?? totalPorts)) * 100}%;"
								></div>
							{/each}
						{/if}

						<!-- Current time indicator (only for today) -->
						{#if dayIndex === 0}
							{@const nowMinutes = new Date().getHours() * 60 + new Date().getMinutes()}
							{@const nowTop = (nowMinutes / SNAP_MINUTES) * slotHeight}
							<div
								class="absolute left-0 right-0 z-10"
								style="top: {nowTop}px;"
							>
							<div class="flex items-center">
								<div class="h-3 w-3 rounded-full bg-tesla-red"></div>
								<div class="h-[2px] flex-1 bg-tesla-red"></div>
							</div>
							</div>
						{/if}

						<!-- Booking events for this day -->
						{#each bookings.filter((b) => toDateString(new Date(b.startTime)) === day.dateStr && b.status !== 'cancelled') as booking}
							{@const portIdx = portAssignments().get(booking.id) ?? 0}
							{@const effectiveTotalPorts = Math.max(maxPorts(), bayNames?.length ?? totalPorts)}
							<CalendarEvent
								booking={booking}
								portIndex={portIdx}
								totalPorts={effectiveTotalPorts}
								{slotHeight}
								{currentUserId}
								oncheckin={oncheckin}
								oncheckout={oncheckout}
								oncancel={oncancel}
								{checkInActionLoading}
							/>
						{/each}

						<!-- Selection for this day -->
						{#if selection && toDateString(selection.startTime) === day.dateStr}
							<CalendarSelection
								startTime={selection.startTime}
								endTime={selection.endTime}
								portIndex={selection.portIndex}
								totalPorts={Math.max(maxPorts(), bayNames?.length ?? totalPorts)}
								isAvailable={isAvailable()}
								isSuggested={selection.isSuggested}
								onconfirm={handleSelectionConfirm}
								oncancel={handleSelectionCancel}
								onchange={handleSelectionChange}
								{slotHeight}
							/>
						{/if}

						<!-- Selection overflow from previous day -->
						{#if selectionOverflow && selectionOverflow.dateStr === day.dateStr}
							{@const overflowPortIdx = selectionOverflow.portIndex}
							{@const overflowTotalPorts = Math.max(maxPorts(), totalPorts)}
							{@const overflowHeight = (selectionOverflow.overflowMinutes / SNAP_MINUTES) * slotHeight}
							{@const overflowLeft = (overflowPortIdx / overflowTotalPorts) * 100}
							{@const overflowWidth = 100 / overflowTotalPorts}
							<div
								class="absolute left-0 right-0 z-10 overflow-hidden rounded-b-md border-2 border-t-0 border-dashed select-none bg-tesla-red/15 border-tesla-red/40 pointer-events-none"
								style="top: 0; height: {overflowHeight}px; left: {overflowLeft}%; width: {overflowWidth}%;"
							>
								<div class="relative z-10 flex h-full flex-col items-center justify-center gap-0.5 px-1 text-xs leading-tight text-tesla-red pointer-events-none">
									<div class="truncate font-semibold opacity-75">
										12:00 AM → {formatTime12(selection!.endTime)}
									</div>
									<div class="truncate text-[10px] opacity-50">continues</div>
								</div>
							</div>
						{/if}
					</div>
				{/each}
			</div>
		</div>
	</div>

	<!-- Sticky bottom action bar -->
	{#if selection}
		<div class="shrink-0 border-t border-border bg-surface-elevated/95 backdrop-blur-md px-4 py-3">
			<div class="flex items-center justify-between gap-4">
				<div class="flex items-center gap-3 min-w-0">
					{#if selection.isSuggested}
						<span class="shrink-0 rounded-full bg-tesla-red/20 px-2 py-0.5 text-[10px] font-semibold text-tesla-red animate-pulse">
							Suggested
						</span>
					{/if}
					<span class="shrink-0 rounded-full bg-accent-yellow/20 px-2 py-0.5 text-[10px] font-semibold text-accent-yellow">
						{selectedBayLabel}
					</span>
					<div class="flex items-center gap-2 text-sm">
						<span class="font-semibold text-text-primary">{formatTime12(selection.startTime)}</span>
						<span class="text-text-muted">—</span>
						<span class="font-semibold text-text-primary">{formatTime12(selection.endTime)}{selectionOverflow ? ' +1 day' : ''}</span>
						<span class="text-text-muted">({formatDuration(selectionDuration)})</span>
					</div>
					{#if !isAvailable()}
						<span class="shrink-0 rounded-full bg-yellow-500/20 px-2 py-0.5 text-[10px] font-semibold text-yellow-400">
							Overlaps
						</span>
					{/if}
				</div>
				<div class="flex items-center gap-2 shrink-0">
					<button
						class="rounded-lg border border-border bg-surface-elevated px-3 py-1.5 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-overlay"
						onclick={handleSelectionCancel}
					>
						Cancel
					</button>
					<button
						class="inline-flex items-center justify-center gap-2 rounded-lg bg-tesla-red px-4 py-1.5 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
						disabled={!canConfirm() || isSubmitting}
						onclick={handleSelectionConfirm}
					>
						{#if isSubmitting}
							<svg class="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
								<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
								<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
							</svg>
							Booking...
						{:else}
							Confirm
						{/if}
					</button>
				</div>
			</div>
		</div>
	{/if}
</div>
