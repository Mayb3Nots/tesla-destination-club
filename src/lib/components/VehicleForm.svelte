<script lang="ts">
	import type { Vehicle } from '$lib/models/vehicle';
	import { getModelsForYear, getColorsForModel, getYearOptions, getTrimsForModel } from '$lib/tesla-data';

	type Props = {
		vehicle?: Vehicle | null;
		onSubmit: (data: {
			plateNumber: string;
			model: string;
			trim: string;
			color: string;
			year: number;
		}) => Promise<void>;
		onCancel: () => void;
	};

	let { vehicle: vehicleProp, onSubmit, onCancel } = $props();

	let plateNumber = $state('');
	let model = $state('');
	let trim = $state('');
	let color = $state('');
	let year = $state(new Date().getFullYear());

	// Initialize form fields from the vehicle prop (if editing)
	$effect(() => {
		const v = vehicleProp;
		if (v) {
			plateNumber = v.plateNumber;
			model = v.model;
			trim = v.trim ?? '';
			color = v.color;
			year = v.year;
		}
	});

	let submitting = $state(false);
	let error = $state<string | null>(null);

	const yearOptions = getYearOptions();

	// Smart cascading: when year changes, reset model if it's no longer valid
	let availableModels = $derived(getModelsForYear(year));

	$effect(() => {
		const models = availableModels;
		if (model && !models.includes(model)) {
			model = '';
			trim = '';
			color = '';
		}
	});

	// Smart cascading: when model changes, reset trim and color if no longer valid
	let availableTrims = $derived(getTrimsForModel(model));

	$effect(() => {
		const trims = availableTrims;
		if (trim && !trims.some((t) => t.name === trim)) {
			trim = '';
		}
	});

	// Smart cascading: when model changes, reset color if it's no longer valid
	let availableColors = $derived(getColorsForModel(model));

	$effect(() => {
		const colors = availableColors;
		if (color && !colors.some((c) => c.name === color)) {
			color = '';
		}
	});

	let canSubmit = $derived(
		plateNumber.trim().length > 0 &&
			model.trim().length > 0 &&
			trim.trim().length > 0 &&
			color.trim().length > 0 &&
			year > 0
	);

	async function handleSubmit(e: Event) {
		e.preventDefault();
		if (!canSubmit || submitting) return;

		submitting = true;
		error = null;

		try {
			await onSubmit({
				plateNumber: plateNumber.trim().toUpperCase(),
				model: model.trim(),
				trim: trim.trim(),
				color: color.trim(),
				year
			});
		} catch (err: any) {
			error = err?.message || 'Failed to save vehicle.';
		} finally {
			submitting = false;
		}
	}
</script>

<form onsubmit={handleSubmit} class="space-y-5">
	{#if error}
		<div
			class="rounded-lg border border-tesla-red/30 bg-tesla-red/10 px-4 py-3 text-sm text-tesla-red"
		>
			{error}
		</div>
	{/if}

	<div>
		<label for="plateNumber" class="mb-1.5 block text-sm font-medium text-text-secondary"
			>Plate Number</label
		>
		<input
			id="plateNumber"
			type="text"
			bind:value={plateNumber}
			placeholder="e.g. ABC 1234"
			required
			class="w-full rounded-lg border border-border bg-surface-elevated px-4 py-3 text-base text-text-primary placeholder:text-text-muted focus:border-accent-blue focus:outline-none focus:ring-1 focus:ring-accent-blue transition-colors"
		/>
	</div>

	<div class="grid grid-cols-2 gap-4">
		<div>
			<label for="year" class="mb-1.5 block text-sm font-medium text-text-secondary"
				>Year</label
			>
			<select
				id="year"
				bind:value={year}
				required
				class="w-full rounded-lg border border-border bg-surface-elevated px-4 py-3 text-base text-text-primary focus:border-accent-blue focus:outline-none focus:ring-1 focus:ring-accent-blue transition-colors appearance-none cursor-pointer"
			>
				{#each yearOptions as yr}
					<option value={yr}>{yr}</option>
				{/each}
			</select>
		</div>
		<div>
			<label for="model" class="mb-1.5 block text-sm font-medium text-text-secondary"
				>Model</label
			>
			<select
				id="model"
				bind:value={model}
				required
				class="w-full rounded-lg border border-border bg-surface-elevated px-4 py-3 text-base text-text-primary focus:border-accent-blue focus:outline-none focus:ring-1 focus:ring-accent-blue transition-colors appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
				disabled={availableModels.length === 0}
			>
				<option value="" disabled>Select model</option>
				{#each availableModels as m}
					<option value={m}>{m}</option>
				{/each}
			</select>
		</div>
	</div>

	<div>
		<label for="trim" class="mb-1.5 block text-sm font-medium text-text-secondary"
			>Trim / Variant</label
		>
		<select
			id="trim"
			bind:value={trim}
			required
			class="w-full rounded-lg border border-border bg-surface-elevated px-4 py-3 text-base text-text-primary focus:border-accent-blue focus:outline-none focus:ring-1 focus:ring-accent-blue transition-colors appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
			disabled={availableTrims.length === 0}
		>
			<option value="" disabled>Select trim</option>
			{#each availableTrims as t}
				<option value={t.name}>{t.name} ({t.batteryCapacityKWh} kWh)</option>
			{/each}
		</select>
		<p class="mt-1.5 text-xs text-text-muted">
			Used to estimate your charging time based on battery capacity.
		</p>
	</div>

	<div>
		<label for="color" class="mb-1.5 block text-sm font-medium text-text-secondary"
			>Color</label
		>
		<select
			id="color"
			bind:value={color}
			required
			class="w-full rounded-lg border border-border bg-surface-elevated px-4 py-3 text-base text-text-primary focus:border-accent-blue focus:outline-none focus:ring-1 focus:ring-accent-blue transition-colors appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
			disabled={availableColors.length === 0}
		>
			<option value="" disabled>Select color</option>
			{#each availableColors as c}
				<option value={c.name}>{c.name}</option>
			{/each}
		</select>
		{#if color}
			{@const selectedColor = availableColors.find((c) => c.name === color)}
			<div class="mt-2 flex items-center gap-2">
				<span
					class="inline-block h-5 w-5 rounded-full border border-border"
					style="background-color: {selectedColor?.hex ?? '#888'}"
				></span>
				<span class="text-sm text-text-secondary">{color}</span>
			</div>
		{/if}
	</div>

	<div class="flex items-center justify-end gap-3 pt-2">
		<button
			type="button"
			onclick={onCancel}
			class="rounded-xl px-6 py-3 text-sm font-semibold text-text-secondary transition-colors hover:bg-surface-overlay hover:text-text-primary"
		>
			Cancel
		</button>
		<button
			type="submit"
			disabled={!canSubmit || submitting}
			class="inline-flex items-center justify-center rounded-xl bg-tesla-red px-6 py-3 text-sm font-semibold text-white transition-all duration-300 ease-[var(--ease-out-expo)] hover:bg-tesla-red-dark hover:shadow-[0_0_30px_rgba(232,33,39,0.3)] active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none"
		>
			{#if submitting}
				<div class="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"></div>
			{/if}
			{vehicleProp ? 'Update Vehicle' : 'Add Vehicle'}
		</button>
	</div>
</form>
