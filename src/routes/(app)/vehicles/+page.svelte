<script lang="ts">
	import { onMount } from 'svelte';
	import { useVehicles, saveVehicle, deleteVehicle } from '$lib/firebase/firestore.svelte';
	import VehicleForm from '$lib/components/VehicleForm.svelte';
	import CoreButton from '$lib/components/CoreButton.svelte';
	import type { Vehicle } from '$lib/models/vehicle';

	const vehiclesService = useVehicles();
	let showForm = $state(false);
	let editingVehicle = $state<Vehicle | null>(null);
	let deletingId = $state<string | null>(null);
	let deleteError = $state<string | null>(null);

	onMount(() => {
		vehiclesService.fetch();
	});

	function openAdd() {
		editingVehicle = null;
		showForm = true;
	}

	function openEdit(vehicle: Vehicle) {
		editingVehicle = vehicle;
		showForm = true;
	}

	function closeForm() {
		showForm = false;
		editingVehicle = null;
	}

	async function handleSubmit(data: {
		plateNumber: string;
		model: string;
		color: string;
		year: number;
	}) {
		await saveVehicle(data, editingVehicle?.id);
		closeForm();
		vehiclesService.fetch();
	}

	async function handleDelete(vehicleId: string) {
		if (deletingId) return;
		deletingId = vehicleId;
		deleteError = null;

		try {
			await deleteVehicle(vehicleId);
			vehiclesService.fetch();
		} catch (err: any) {
			deleteError = err?.message || 'Failed to delete vehicle.';
		} finally {
			deletingId = null;
		}
	}
</script>

<svelte:head>
	<title>My Vehicles — Tesla Destination Club</title>
</svelte:head>

<div class="mx-auto max-w-2xl px-6 py-10 lg:px-8">
	<div class="mb-8 flex items-center justify-between">
		<div>
			<h1 class="font-display text-3xl font-bold tracking-tight text-text-primary">
				My Vehicles
			</h1>
			<p class="mt-2 text-base text-text-secondary">
				Manage your vehicle information for bookings.
			</p>
		</div>
		{#if !showForm}
			<CoreButton size="sm" onclick={openAdd}>+ Add Vehicle</CoreButton>
		{/if}
	</div>

	{#if deleteError}
		<div
			class="mb-6 rounded-lg border border-tesla-red/30 bg-tesla-red/10 px-4 py-3 text-sm text-tesla-red"
		>
			{deleteError}
		</div>
	{/if}

	{#if showForm}
		<div
			class="mb-8 rounded-2xl border border-border bg-surface-elevated p-6 animate-scale-in"
		>
			<h2 class="mb-5 font-display text-lg font-semibold text-text-primary">
				{editingVehicle ? 'Edit Vehicle' : 'Add New Vehicle'}
			</h2>
			<VehicleForm
				vehicle={editingVehicle}
				onSubmit={handleSubmit}
				onCancel={closeForm}
			/>
		</div>
	{/if}

	{#if vehiclesService.loading}
		<div class="flex items-center justify-center py-20">
			<div
				class="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-tesla-red"
			></div>
		</div>
	{:else if vehiclesService.error}
		<div
			class="rounded-lg border border-tesla-red/30 bg-tesla-red/10 px-4 py-3 text-sm text-tesla-red"
		>
			{vehiclesService.error}
		</div>
	{:else if vehiclesService.vehicles.length === 0 && !showForm}
		<div
			class="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-surface-elevated/50 py-16"
		>
			<div
				class="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-overlay"
			>
				<svg
					width="28"
					height="28"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="1.5"
					class="text-text-muted"
				>
					<path
						d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-2-2-3c-.7-1-1.5-1-1.5-1H7c-.8 0-1.3.5-1.5 1L4 10c-1 0-2 .9-2 2v4c0 .6.4 1 1 1h1"
						stroke-linecap="round"
						stroke-linejoin="round"
					/>
					<circle cx="7" cy="17" r="2" stroke-linecap="round" stroke-linejoin="round" />
					<circle cx="17" cy="17" r="2" stroke-linecap="round" stroke-linejoin="round" />
				</svg>
			</div>
			<h3 class="font-display text-base font-semibold text-text-primary">No vehicles yet</h3>
			<p class="mt-1 text-sm text-text-muted">Add your vehicle to get started.</p>
			<CoreButton size="sm" class="mt-4" onclick={openAdd}>Add Your First Vehicle</CoreButton>
		</div>
	{:else}
		<div class="space-y-4">
			{#each vehiclesService.vehicles as vehicle (vehicle.id)}
				<div
					class="group rounded-2xl border border-border bg-surface-elevated p-5 transition-colors hover:border-border-subtle animate-fade-up"
				>
					<div class="flex items-start justify-between gap-4">
						<div class="flex items-start gap-4">
							<div
								class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-surface-overlay"
							>
								<svg
									width="24"
									height="24"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="1.5"
									class="text-text-muted"
								>
									<path
										d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-2-2-3c-.7-1-1.5-1-1.5-1H7c-.8 0-1.3.5-1.5 1L4 10c-1 0-2 .9-2 2v4c0 .6.4 1 1 1h1"
										stroke-linecap="round"
										stroke-linejoin="round"
									/>
									<circle cx="7" cy="17" r="2" />
									<circle cx="17" cy="17" r="2" />
								</svg>
							</div>
							<div>
								<h3 class="font-display text-base font-semibold text-text-primary">
								Tesla {vehicle.model}
								</h3>
								<p class="mt-0.5 text-sm text-text-secondary">
									<span class="font-medium text-text-primary">{vehicle.plateNumber}</span>
									· {vehicle.color} · {vehicle.year}
								</p>
							</div>
						</div>
						<div class="flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
							<button
								type="button"
								onclick={() => openEdit(vehicle)}
								class="rounded-lg px-3 py-1.5 text-sm font-medium text-accent-blue transition-colors hover:bg-accent-blue/10"
							>
								Edit
							</button>
							<button
								type="button"
								onclick={() => handleDelete(vehicle.id)}
								disabled={deletingId === vehicle.id}
								class="rounded-lg px-3 py-1.5 text-sm font-medium text-tesla-red transition-colors hover:bg-tesla-red/10 disabled:opacity-50"
							>
								{#if deletingId === vehicle.id}
									<div
										class="h-4 w-4 animate-spin rounded-full border-2 border-tesla-red/30 border-t-tesla-red"
									></div>
								{:else}
									Delete
								{/if}
							</button>
						</div>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>
