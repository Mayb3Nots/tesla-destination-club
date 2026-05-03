<script lang="ts">
	import { goto } from '$app/navigation';
	import { getAuthState } from '$lib/firebase/auth.svelte';
	import { onMount } from 'svelte';
	import ThemeToggle from '$lib/components/ThemeToggle.svelte';
	import NotificationPermissionBanner from '$lib/components/NotificationPermissionBanner.svelte';
	import { onForegroundMessage, getNotificationStatus } from '$lib/firebase/messaging';

	let { children } = $props();

	const auth = getAuthState();
	let foregroundNotification = $state<{ title: string; body: string } | null>(null);

	onMount(() => {
		if (!auth.loading && !auth.currentUser) {
			goto('/login');
		}

		// Register service worker for background push notifications
		if ('serviceWorker' in navigator) {
			navigator.serviceWorker.register('/firebase-messaging-sw.js').catch((err) => {
				console.error('Failed to register service worker:', err);
			});
		}

		// Listen for foreground messages
		const unsubscribe = onForegroundMessage((payload) => {
			if (payload.notification) {
				foregroundNotification = {
					title: payload.notification.title || 'Tesla Destination Club',
					body: payload.notification.body || ''
				};
				// Auto-dismiss after 6 seconds
				setTimeout(() => {
					foregroundNotification = null;
				}, 6000);
			}
		});

		return () => {
			unsubscribe();
		};
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

		<!-- Notification permission banner -->
		<div class="fixed bottom-6 left-6 right-6 z-50 lg:left-auto lg:right-8 lg:w-[480px]">
			<NotificationPermissionBanner />
		</div>

		<!-- Foreground notification toast -->
		{#if foregroundNotification}
			<div
				class="fixed bottom-6 right-6 z-[60] w-80 rounded-xl border border-border bg-surface-elevated p-4 shadow-2xl shadow-black/40 transition-all"
			>
				<div class="flex items-start gap-3">
					<div
						class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent-blue/10"
					>
						<svg
							width="16"
							height="16"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="1.5"
							stroke-linecap="round"
							stroke-linejoin="round"
							class="text-accent-blue"
						>
							<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
							<path d="M13.73 21a2 2 0 0 1-3.46 0" />
						</svg>
					</div>
					<div class="min-w-0 flex-1">
						<p class="text-sm font-semibold text-text-primary">{foregroundNotification.title}</p>
						<p class="mt-0.5 text-xs text-text-secondary">{foregroundNotification.body}</p>
					</div>
					<button
						onclick={() => (foregroundNotification = null)}
						class="shrink-0 text-text-muted hover:text-text-secondary"
					>
						<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
							<path d="M18 6 6 18" /><path d="m6 6 12 12" />
						</svg>
					</button>
				</div>
			</div>
		{/if}
	</div>
{/if}
