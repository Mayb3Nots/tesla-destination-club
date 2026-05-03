<script lang="ts">
	import { goto } from '$app/navigation';
	import { getAuthState } from '$lib/firebase/auth.svelte';
	import { onMount } from 'svelte';
	import ThemeToggle from '$lib/components/ThemeToggle.svelte';

	let { children } = $props();

	const auth = getAuthState();

	onMount(() => {
		if (!auth.loading && !auth.currentUser) {
			goto('/login');
		}
	});

	$effect(() => {
		if (!auth.loading && !auth.currentUser) {
			goto('/login');
		}
	});
</script>

{#if auth.loading}
	<div class="flex min-h-screen items-center justify-center bg-surface">
		<div class="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-tesla-red"></div>
	</div>
{:else if auth.currentUser}
	<div class="min-h-screen bg-surface">
		<nav
			class="border-b border-border bg-surface-elevated/80 backdrop-blur-md sticky top-0 z-50"
		>
			<div class="mx-auto flex max-w-6xl items-center justify-between px-6 py-4 lg:px-8">
				<a href="/chargers" class="flex items-center gap-3">
					<div
						class="flex h-8 w-8 items-center justify-center rounded-lg bg-tesla-red"
					>
						<svg
							width="16"
							height="16"
							viewBox="0 0 24 24"
							fill="none"
							stroke="white"
							stroke-width="2.5"
							stroke-linecap="round"
							stroke-linejoin="round"
						>
							<path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
						</svg>
					</div>
					<span class="font-display text-base font-bold tracking-tight text-text-primary"
						>Destination Club</span
					>
				</a>
				<div class="flex items-center gap-2">
					<a
						href="/chargers"
						class="rounded-lg px-3 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-overlay hover:text-text-primary"
					>
						Chargers
					</a>
					<a
						href="/bookings"
						class="rounded-lg px-3 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-overlay hover:text-text-primary"
					>
						My Bookings
					</a>
					<a
						href="/vehicles"
						class="rounded-lg px-3 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-overlay hover:text-text-primary"
					>
						My Vehicles
					</a>
					<ThemeToggle />
					<button
						onclick={() => auth.signOut()}
						class="ml-2 rounded-lg px-3 py-2 text-sm font-medium text-text-muted transition-colors hover:bg-surface-overlay hover:text-text-primary"
					>
						Sign Out
					</button>
				</div>
			</div>
		</nav>
		<main>
			{@render children()}
		</main>
	</div>
{/if}
