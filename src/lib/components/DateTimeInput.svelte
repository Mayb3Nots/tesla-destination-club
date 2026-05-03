<script lang="ts">
	import { snapToGrid, formatTime12, SNAP_MINUTES, MIN_DURATION_MINUTES, TOTAL_SLOTS, toDateString } from '$lib/calendar-helpers';

	type Props = {
		/** Currently selected start time (synced with calendar) */
		startTime: Date;
		/** Currently selected end time (synced with calendar) */
		endTime: Date;
		/** Callback when user changes start/end via this input */
		onchange: (start: Date, end: Date) => void;
	};

	let { startTime, endTime, onchange }: Props = $props();

	// Compute the min date (today) and max date (7 days from now)
	const today = new Date();
	const maxDate = new Date(today);
	maxDate.setDate(maxDate.getDate() + 6);

	const minDateStr = toDateString(today);
	const maxDateStr = toDateString(maxDate);

	// Generate time options in 15-min increments
	const timeOptions: { value: number; label: string }[] = [];
	for (let m = 0; m < TOTAL_SLOTS * SNAP_MINUTES; m += SNAP_MINUTES) {
		const d = new Date();
		d.setHours(Math.floor(m / 60), m % 60, 0, 0);
		timeOptions.push({ value: m, label: formatTime12(d) });
	}

	let startDateStr = $state('');
	let startMinutes = $state(0);
	let endMinutes = $state(0);

	// Sync from parent props (calendar changes)
	$effect(() => {
		startDateStr = toDateString(startTime);
		startMinutes = snapToGrid(startTime.getHours() * 60 + startTime.getMinutes());
		endMinutes = snapToGrid(endTime.getHours() * 60 + endTime.getMinutes());
	});

	let durationMinutes = $derived(() => {
		const s = startMinutes;
		const e = endMinutes;
		if (e > s) return e - s;
		return (TOTAL_SLOTS * SNAP_MINUTES - s) + e;
	});

	let durationLabel = $derived(() => {
		const d = durationMinutes();
		if (d >= 60) {
			const h = Math.floor(d / 60);
			const m = d % 60;
			return m > 0 ? `${h}h ${m}m` : `${h}h`;
		}
		return `${d}m`;
	});

	let isOverflow = $derived(endMinutes <= startMinutes);

	function buildDates(): { start: Date; end: Date } {
		const [y, mo, d] = startDateStr.split('-').map(Number);
		const start = new Date(y, mo - 1, d);
		start.setHours(Math.floor(startMinutes / 60), startMinutes % 60, 0, 0);

		const end = new Date(y, mo - 1, d);
		const totalEndMinutes = startMinutes + durationMinutes();
		end.setHours(0, 0, 0, 0);
		end.setMinutes(totalEndMinutes);

		return { start, end };
	}

	function handleDateChange() {
		const { start, end } = buildDates();
		onchange(start, end);
	}

	function handleStartChange() {
		// Clamp end to be at least MIN_DURATION after start
		const minEnd = startMinutes + MIN_DURATION_MINUTES;
		if (endMinutes <= startMinutes) {
			// already overflow or at same — keep as-is
		} else if (endMinutes < minEnd && minEnd <= TOTAL_SLOTS * SNAP_MINUTES) {
			endMinutes = minEnd;
		}
		handleDateChange();
	}

	function handleEndChange() {
		// Ensure minimum duration
		if (endMinutes > startMinutes && endMinutes - startMinutes < MIN_DURATION_MINUTES) {
			endMinutes = snapToGrid(startMinutes + MIN_DURATION_MINUTES);
		}
		handleDateChange();
	}

	let selectClass = 'w-full rounded-lg border border-border bg-surface-overlay px-3 py-2 text-sm text-text-primary outline-none transition-colors focus:border-tesla-red';
</script>

<div class="flex flex-col gap-3">
	<!-- Date -->
	<div class="flex flex-col gap-1">
		<label for="booking-date" class="text-xs font-medium text-text-secondary">Date</label>
		<input
			id="booking-date"
			type="date"
			class={selectClass}
			bind:value={startDateStr}
			min={minDateStr}
			max={maxDateStr}
			onchange={handleDateChange}
		/>
	</div>

	<!-- Time row -->
	<div class="grid grid-cols-2 gap-3">
		<div class="flex flex-col gap-1">
			<label for="start-time" class="text-xs font-medium text-text-secondary">Start Time</label>
			<select id="start-time" class={selectClass} bind:value={startMinutes} onchange={handleStartChange}>
				{#each timeOptions as opt}
					<option value={opt.value}>{opt.label}</option>
				{/each}
			</select>
		</div>
		<div class="flex flex-col gap-1">
			<label for="end-time" class="text-xs font-medium text-text-secondary">
				End Time
				{#if isOverflow}
					<span class="text-tesla-red">(+1 day)</span>
				{/if}
			</label>
			<select id="end-time" class={selectClass} bind:value={endMinutes} onchange={handleEndChange}>
				{#each timeOptions as opt}
					<option value={opt.value}>{opt.label}</option>
				{/each}
			</select>
		</div>
	</div>

	<!-- Duration display -->
	<div class="flex items-center justify-between rounded-lg bg-surface-overlay px-3 py-2 text-sm">
		<span class="text-text-muted">Duration</span>
		<span class="font-semibold text-text-primary">{durationLabel()}</span>
	</div>
</div>
