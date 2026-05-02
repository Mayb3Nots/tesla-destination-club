<script lang="ts">
	import { onMount } from 'svelte';
	import { useChargers, seedChargers } from '$lib/firebase/firestore.svelte';
	import CoreButton from '$lib/components/CoreButton.svelte';
	import type { Charger } from '$lib/models/charger';

	const chargersService = useChargers();

	onMount(async () => {
		await chargersService.fetch();
		if (chargersService.chargers.length === 0) {
			try {
				await seedChargers();
				await chargersService.fetch();
			} catch {
				// Seeding may fail due to permissions, that's okay
			}
		}
	});

	function getAvailablePorts(charger: Charger): string {
		return `${charger.totalPorts} ports`;
	}
</script>

<svelte:head>
	<title>Chargers — Tesla Destination Club</title>
</svelte:head>

<div class="mx-auto max-w-6xl px-6 py-10 lg:px-8">
	<div class="mb-8">
		<h1 class="font-display text-3xl font-bold tracking-tight text-text-primary">
			Choose a Charger
		</h1>
		<p class="mt-2 text-base text-text-secondary">
			Select a Tesla destination charger to book your slot
		</p>
	</div>

	{#if chargersService.loading}
		<div class="flex items-center justify-center py-20">
			<div
				class="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-tesla-red"
			></div>
		</div>
	{:else if chargersService.error}
		<div class="rounded-xl border border-border bg-surface-elevated p-6 text-center">
			<p class="text-sm text-text-secondary">{chargersService.error}</p>
		</div>
	{:else if chargersService.chargers.length === 0}
		<div class="rounded-xl border border-border bg-surface-elevated p-8 text-center">
			<svg
				class="mx-auto mb-4 text-text-muted"
				width="40"
				height="40"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="1.5"
				stroke-linecap="round"
				stroke-linejoin="round"
			>
				<path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
			</svg>
			<p class="text-sm text-text-secondary">No chargers available yet</p>
			<button
				onclick={async () => {
					await seedChargers();
					await chargersService.fetch();
				}}
				class="mt-4 text-sm font-semibold text-tesla-red hover:text-tesla-red-light transition-colors"
			>
				Seed charger data
			</button>
		</div>
	{:else}
		<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
			{#each chargersService.chargers as charger (charger.id)}
				<a
					href="/chargers/{charger.id}/book"
					class="group rounded-2xl border border-border bg-surface-elevated p-6 transition-all duration-300 hover:border-text-muted/30 hover:bg-surface-overlay"
				>
					<div class="mb-4 flex items-center justify-between">
						<div
							class="flex h-10 w-10 items-center justify-center rounded-xl bg-tesla-red/10 transition-colors group-hover:bg-tesla-red/20"
						>
							<svg
								width="20"
								height="20"
								viewBox="0 0 24 24"
								fill="none"
								stroke="var(--color-tesla-red)"
								stroke-width="1.5"
								stroke-linecap="round"
								stroke-linejoin="round"
							>
								<path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
							</svg>
						</div>
						<span
							class="inline-flex items-center gap-1.5 rounded-full bg-accent-green/10 px-3 py-1 text-xs font-semibold text-accent-green"
						>
							{getAvailablePorts(charger)}
						</span>
					</div>
					<h2
						class="font-display text-lg font-semibold text-text-primary transition-colors group-hover:text-tesla-red"
					>
						{charger.name}
					</h2>
					<p class="mt-1 text-sm leading-relaxed text-text-muted">{charger.address}</p>
					<div class="mt-4 flex items-center gap-2">
						<svg
							width="14"
							height="14"
							viewBox="0 0 24 24"
							fill="none"
							stroke="var(--color-text-muted)"
							stroke-width="1.5"
							stroke-linecap="round"
							stroke-linejoin="round"
						>
							<rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
							<line x1="16" y1="2" x2="16" y2="6" />
							<line x1="8" y1="2" x2="8" y2="6" />
							<line x1="3" y1="10" x2="21" y2="10" />
						</svg>
						<span class="text-xs text-text-muted">Book a slot</span>
					</div>
				</a>
			{/each}
		</div>
	{/if}
</div>
