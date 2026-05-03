<script lang="ts">
	import type { Vehicle } from '$lib/models/vehicle';

	type Props = {
		vehicle?: Vehicle | null;
		onSubmit: (data: {
			plateNumber: string;
			make: string;
			model: string;
			color: string;
			year: number;
		}) => Promise<void>;
		onCancel: () => void;
	};

	let { vehicle: vehicleProp, onSubmit, onCancel } = $props();

	let plateNumber = $state('');
	let make = $state('');
	let model = $state('');
	let color = $state('');
	let year = $state(new Date().getFullYear());

	// Initialize form fields from the vehicle prop (if editing)
	$effect(() => {
		const v = vehicleProp;
		if (v) {
			plateNumber = v.plateNumber;
			make = v.make;
			model = v.model;
			color = v.color;
			year = v.year;
		}
	});
	let submitting = $state(false);
	let error = $state<string | null>(null);

	const currentYear = new Date().getFullYear();
	const yearOptions = Array.from({ length: 40 }, (_, i) => currentYear - i);

	let canSubmit = $derived(
		plateNumber.trim().length > 0 &&
			make.trim().length > 0 &&
			model.trim().length > 0 &&
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
				make: make.trim(),
				model: model.trim(),
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
			<label for="make" class="mb-1.5 block text-sm font-medium text-text-secondary"
				>Make</label
			>
			<input
				id="make"
				type="text"
				bind:value={make}
				placeholder="e.g. Tesla"
				required
				class="w-full rounded-lg border border-border bg-surface-elevated px-4 py-3 text-base text-text-primary placeholder:text-text-muted focus:border-accent-blue focus:outline-none focus:ring-1 focus:ring-accent-blue transition-colors"
			/>
		</div>
		<div>
			<label for="model" class="mb-1.5 block text-sm font-medium text-text-secondary"
				>Model</label
			>
			<input
				id="model"
				type="text"
				bind:value={model}
				placeholder="e.g. Model 3"
				required
				class="w-full rounded-lg border border-border bg-surface-elevated px-4 py-3 text-base text-text-primary placeholder:text-text-muted focus:border-accent-blue focus:outline-none focus:ring-1 focus:ring-accent-blue transition-colors"
			/>
		</div>
	</div>

	<div class="grid grid-cols-2 gap-4">
		<div>
			<label for="color" class="mb-1.5 block text-sm font-medium text-text-secondary"
				>Color</label
			>
			<input
				id="color"
				type="text"
				bind:value={color}
				placeholder="e.g. Pearl White"
				required
				class="w-full rounded-lg border border-border bg-surface-elevated px-4 py-3 text-base text-text-primary placeholder:text-text-muted focus:border-accent-blue focus:outline-none focus:ring-1 focus:ring-accent-blue transition-colors"
			/>
		</div>
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
