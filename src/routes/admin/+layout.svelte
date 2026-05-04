<script lang="ts">
	import { goto } from '$app/navigation';
	import { getAuthState } from '$lib/firebase/auth.svelte';
	import { isAdminEmail } from '$lib/admin';
	import { onMount } from 'svelte';

	let { children } = $props();

	const auth = getAuthState();

	onMount(() => {
		if (!auth.loading && (!auth.currentUser || !isAdminEmail(auth.currentUser.email))) {
			goto('/chargers');
		}
	});

	$effect(() => {
		if (!auth.loading && (!auth.currentUser || !isAdminEmail(auth.currentUser.email))) {
			goto('/chargers');
		}
	});
</script>

{#if auth.loading}
	<div class="flex min-h-screen items-center justify-center bg-surface">
		<div class="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-tesla-red"></div>
	</div>
{:else if auth.currentUser && isAdminEmail(auth.currentUser.email)}
	<div class="min-h-screen bg-surface">
		<!-- Admin top bar -->
		<nav class="border-b border-border bg-surface-elevated/80 backdrop-blur-md sticky top-0 z-50">
			<div class="mx-auto flex max-w-6xl items-center justify-between px-6 py-4 lg:px-8">
				<div class="flex items-center gap-3">
					<div class="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-blue">
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
							<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
						</svg>
					</div>
					<span class="font-display text-base font-bold tracking-tight text-text-primary"
						>Admin Panel</span
					>
				</div>
				<div class="flex items-center gap-3">
					<a
						href="/chargers"
						class="rounded-lg px-3 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-overlay hover:text-text-primary"
					>
						← Back to App
					</a>
				</div>
			</div>
		</nav>

		<main>
			{@render children()}
		</main>
	</div>
{/if}
