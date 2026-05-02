<script lang="ts">
	import {
		DEFAULT_SLOT_HEIGHT,
		SNAP_MINUTES,
		MIN_DURATION_MINUTES,
		TOTAL_SLOTS,
		snapToGrid,
		clamp,
		timeToMinutes,
		minutesToDate,
		formatTime12
	} from '$lib/calendar-helpers';

	type Props = {
		startTime: Date;
		endTime: Date;
		portIndex: number;
		totalPorts: number;
		isAvailable: boolean;
		isSuggested?: boolean;
		onconfirm: (start: Date, end: Date) => void;
		oncancel: () => void;
		onchange: (start: Date, end: Date) => void;
		slotHeight?: number;
	};

	let {
		startTime,
		endTime,
		portIndex,
		totalPorts,
		isAvailable,
		isSuggested = false,
		onconfirm,
		oncancel,
		onchange,
		slotHeight = DEFAULT_SLOT_HEIGHT
	}: Props = $props();

	let startMinutes = $state(0);
	let endMinutes = $state(0);
	let referenceDate = $state(new Date());

	// Sync internal state when parent props change (but not during active drag)
	$effect(() => {
		if (dragType === 'none') {
			startMinutes = timeToMinutes(new Date(startTime));
			endMinutes = timeToMinutes(new Date(endTime));
			referenceDate = new Date(startTime);
			userAdjusted = false;
		}
	});

	let top = $derived((startMinutes / SNAP_MINUTES) * slotHeight);
	let isOverflow = $derived(endMinutes <= startMinutes);
	let height = $derived(
		isOverflow
			? ((TOTAL_SLOTS * SNAP_MINUTES - startMinutes) / SNAP_MINUTES) * slotHeight
			: ((endMinutes - startMinutes) / SNAP_MINUTES) * slotHeight
	);
	let left = $derived((portIndex / totalPorts) * 100);
	let width = $derived(100 / totalPorts);
	let durationMinutes = $derived(
		isOverflow ? (TOTAL_SLOTS * SNAP_MINUTES - startMinutes) + endMinutes : endMinutes - startMinutes
	);
	let durationLabel = $derived(durationMinutes >= 60 ? `${Math.floor(durationMinutes / 60)}h ${durationMinutes % 60 > 0 ? `${durationMinutes % 60}m` : ''}`.trim() : `${durationMinutes}m`);
	let blockColor = $derived(!isAvailable ? 'bg-yellow-500/20 border-yellow-500/50' : 'bg-tesla-red/20 border-tesla-red/50');
	let showDuration = $derived(height >= DEFAULT_SLOT_HEIGHT * 1.5);
	let showTimeInBlock = $derived(height >= DEFAULT_SLOT_HEIGHT);

	let userAdjusted = $state(false);

	let dragType = $state<'none' | 'top' | 'bottom' | 'move'>('none');
	let dragStartY = $state(0);
	let dragOriginalStart = $state(0);
	let dragOriginalEnd = $state(0);

	function pointerDown(e: PointerEvent, type: 'top' | 'bottom' | 'move') {
		e.preventDefault();
		e.stopPropagation();
		(e.target as HTMLElement).setPointerCapture(e.pointerId);
		dragType = type;
		dragStartY = e.clientY;
		dragOriginalStart = startMinutes;
		dragOriginalEnd = endMinutes;
		if (!userAdjusted) userAdjusted = true;
	}

	function pointerMove(e: PointerEvent) {
		if (dragType === 'none') return;

		const deltaY = e.clientY - dragStartY;
		const deltaMinutes = snapToGrid((deltaY / slotHeight) * SNAP_MINUTES);

		if (dragType === 'top') {
			const newStart = clamp(
				snapToGrid(dragOriginalStart + deltaMinutes),
				0,
				dragOriginalEnd - MIN_DURATION_MINUTES
			);
			startMinutes = newStart;
			onchange(minutesToDate(startMinutes, referenceDate), minutesToDate(endMinutes, referenceDate));
		} else if (dragType === 'bottom') {
			const maxEnd = TOTAL_SLOTS * SNAP_MINUTES * 2; // Allow overflow into next day
			const newEnd = clamp(
				snapToGrid(dragOriginalEnd + deltaMinutes),
				dragOriginalStart + MIN_DURATION_MINUTES,
				maxEnd
			);
			endMinutes = newEnd;
			onchange(minutesToDate(startMinutes, referenceDate), minutesToDate(endMinutes, referenceDate));
		} else if (dragType === 'move') {
			const duration = dragOriginalEnd - dragOriginalStart;
			const newStart = clamp(snapToGrid(dragOriginalStart + deltaMinutes), 0, TOTAL_SLOTS * SNAP_MINUTES - duration);
			const newEnd = newStart + duration;
			startMinutes = newStart;
			endMinutes = newEnd;
			onchange(minutesToDate(startMinutes, referenceDate), minutesToDate(endMinutes, referenceDate));
		}
	}

	function pointerUp() {
		dragType = 'none';
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			oncancel();
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} onpointermove={pointerMove} onpointerup={pointerUp} />

<!-- Top resize handle -->
<div
	class="absolute z-20 cursor-ns-resize"
	style="top: {top}px; height: 10px; left: {left}%; width: {width}%;"
	onpointerdown={(e) => pointerDown(e, 'top')}
	role="separator"
	tabindex="-1"
	aria-label="Resize start time"
>
	<div class="mx-auto h-full w-full">
		<div class="absolute left-1/2 top-1 -translate-x-1/2 rounded-full bg-current opacity-30 {isAvailable ? 'opacity-30 text-tesla-red' : 'opacity-30 text-yellow-400'}">
			<svg width="16" height="4" viewBox="0 0 16 4" fill="none">
				<rect x="1" y="1" width="14" height="2" rx="1" fill="currentColor" />
			</svg>
		</div>
	</div>
</div>

<!-- Main selection block (draggable body) -->
<div
	class="absolute z-10 overflow-hidden rounded-md border-2 transition-colors duration-150 select-none {blockColor} {isSuggested && !userAdjusted ? 'border-dashed' : ''}"
	style="top: {top}px; height: {height}px; left: {left}%; width: {width}%;"
>
	<div
		class="absolute inset-0 cursor-grab active:cursor-grabbing"
		onpointerdown={(e) => pointerDown(e, 'move')}
		role="slider"
		tabindex="-1"
		aria-label="Move booking"
		aria-valuenow={startMinutes}
		aria-valuemin={0}
		aria-valuemax={TOTAL_SLOTS * SNAP_MINUTES}
	></div>
	<div class="relative z-10 flex h-full flex-col items-center justify-center gap-0.5 px-1 text-xs leading-tight pointer-events-none {isAvailable ? 'text-tesla-red' : 'text-yellow-600'}">
		{#if showTimeInBlock}
			<div class="truncate font-semibold">
				{formatTime12(minutesToDate(startMinutes, referenceDate))}
			</div>
		{/if}
		{#if showDuration}
			<div class="truncate font-medium opacity-90">{durationLabel}</div>
		{/if}
		{#if showTimeInBlock && height >= DEFAULT_SLOT_HEIGHT * 2}
			<div class="truncate opacity-75">
				{formatTime12(minutesToDate(endMinutes, referenceDate))}
			</div>
		{/if}
	</div>
</div>

<!-- Bottom resize handle -->
<div
	class="absolute z-20 cursor-ns-resize"
	style="top: {top + height - 10}px; height: 10px; left: {left}%; width: {width}%;"
	onpointerdown={(e) => pointerDown(e, 'bottom')}
	role="separator"
	tabindex="-1"
	aria-label="Resize end time"
>
	<div class="mx-auto h-full w-full">
		<div class="absolute bottom-1 left-1/2 -translate-x-1/2 rounded-full bg-current opacity-30 {isAvailable ? 'text-tesla-red' : 'text-yellow-400'}">
			<svg width="16" height="4" viewBox="0 0 16 4" fill="none">
				<rect x="1" y="1" width="14" height="2" rx="1" fill="currentColor" />
			</svg>
		</div>
	</div>
</div>
