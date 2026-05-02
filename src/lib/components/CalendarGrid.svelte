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
		onconfirm: (startTime: Date, endTime: Date) => void;
	};

	let { bookings, totalPorts, onconfirm }: Props = $props();

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

	let selection = $state<{
		startTime: Date;
		endTime: Date;
		portIndex: number;
		isSuggested: boolean;
	} | null>(null);

	let isSubmitting = $state(false);

	let selectionDuration = $derived(
		selection
			? (selection.endTime.getTime() - selection.startTime.getTime()) / 60000
			: 0
	);

	let isAvailable = $derived(() => {
		if (!selection) return true;
		const sel = selection;
		const dayBookings = bookings.filter(
			(b) =>
				toDateString(new Date(b.startTime)) === toDateString(sel.startTime) &&
				b.status !== 'cancelled'
		);
		return checkSlotAvailability(sel.startTime, sel.endTime, dayBookings, totalPorts);
	});

	let canConfirm = $derived(() => selection && isAvailable() && selectionDuration >= MIN_DURATION_MINUTES);

	// Overflow: when selection extends past midnight into next day
	let selectionOverflow = $derived(() => {
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
		return computePortAssignments(active);
	});

	let maxPorts = $derived(() => {
		let max = 1;
		for (const p of portAssignments().values()) {
			if (p + 1 > max) max = p + 1;
		}
		return max;
	});

	function getAvailablePortForSlot(startMinutes: number, endMinutes: number): number {
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
		for (let p = 0; p < totalPorts; p++) {
			if (!usedPorts.has(p)) return p;
		}
		return 0;
	}

	function handleDayClick(e: MouseEvent, dayIndex: number) {
		const target = e.currentTarget as HTMLElement;
		const rect = target.getBoundingClientRect();
		const y = e.clientY - rect.top;
		const minutes = snapToGrid((y / slotHeight) * SNAP_MINUTES);
		const clampedMinutes = Math.max(0, minutes);

		const day = days[dayIndex].date;
		const startTime = minutesToDate(clampedMinutes, day);
		const endMinutes = clampedMinutes + DEFAULT_DURATION_MINUTES;
		// Allow overflow into next day
		const endTime = new Date(day);
		endTime.setHours(0, 0, 0, 0);
		endTime.setMinutes(endMinutes);
		const portIndex = getAvailablePortForSlot(clampedMinutes, Math.min(endMinutes, TOTAL_SLOTS * SNAP_MINUTES));

		selection = { startTime, endTime, portIndex, isSuggested: false };
	}

	function handleSelectionConfirm() {
		if (!selection || !canConfirm()) return;
		onconfirm(selection.startTime, selection.endTime);
	}

	function handleSelectionCancel() {
		selection = null;
	}

	function handleSelectionChange(start: Date, end: Date) {
		if (selection) {
			selection = {
				...selection,
				startTime: start,
				endTime: end,
				portIndex: getAvailablePortForSlot(
					start.getHours() * 60 + start.getMinutes(),
					end.getHours() * 60 + end.getMinutes()
				)
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
	<!-- Day header -->
	<div class="flex border-b border-border bg-surface-elevated">
		<!-- Time gutter -->
		<div class="w-16 shrink-0"></div>
		{#each days as day, i}
			<button
				class="flex-1 flex flex-col items-center gap-0.5 py-3 text-center transition-colors hover:bg-surface-overlay border-l border-border-subtle {selection &&
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

	<!-- Grid body (fills remaining space, scrollable) -->
	<div class="flex-1 overflow-y-auto" bind:this={gridBodyEl}>
		<div class="flex relative" style="height: {totalGridHeight}px;">
			<!-- Time labels gutter -->
			<div class="w-16 shrink-0 relative overflow-visible">
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
			<div class="flex-1 flex relative">
				{#each days as day, dayIndex}
					<div
						class="flex-1 relative border-l border-border-subtle"
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
							<CalendarEvent
								booking={booking}
								portIndex={portIdx}
								totalPorts={Math.max(maxPorts(), totalPorts)}
								{slotHeight}
							/>
						{/each}

						<!-- Selection for this day -->
						{#if selection && toDateString(selection.startTime) === day.dateStr}
							<CalendarSelection
								startTime={selection.startTime}
								endTime={selection.endTime}
								portIndex={selection.portIndex}
								totalPorts={Math.max(maxPorts(), totalPorts)}
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
					<div class="flex items-center gap-2 text-sm">
						<span class="font-semibold text-text-primary">{formatTime12(selection.startTime)}</span>
						<span class="text-text-muted">—</span>
						<span class="font-semibold text-text-primary">{formatTime12(selection.endTime)}{selectionOverflow ? ' +1 day' : ''}</span>
						<span class="text-text-muted">({selectionDuration} min)</span>
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
						class="rounded-lg bg-tesla-red px-4 py-1.5 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
						disabled={!canConfirm()}
						onclick={handleSelectionConfirm}
					>
						Confirm
					</button>
				</div>
			</div>
		</div>
	{/if}
</div>
