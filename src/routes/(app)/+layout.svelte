<script lang="ts">
	import { goto } from '$app/navigation';
	import { getAuthState } from '$lib/firebase/auth.svelte';
	import { onMount } from 'svelte';
	import ThemeToggle from '$lib/components/ThemeToggle.svelte';
	import NotificationPermissionBanner from '$lib/components/NotificationPermissionBanner.svelte';
	import { onForegroundMessage, getNotificationStatus } from '$lib/firebase/messaging';

	let { children } = $props();

	const auth = getAuthState();
	let profileMenuOpen = $state(false);
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
						href="/leaderboard"
						class="rounded-lg px-3 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-overlay hover:text-text-primary"
					>
						Leaderboard
					</a>
					<a
						href="/report"
						class="rounded-lg px-3 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-overlay hover:text-text-primary"
					>
						Report
					</a>
					<a
						href="/faq"
						class="rounded-lg px-3 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-overlay hover:text-text-primary"
					>
						FAQ
					</a>
					<ThemeToggle />
					<div class="relative ml-2">
						<button
							onclick={() => (profileMenuOpen = !profileMenuOpen)}
							class="flex items-center gap-2 rounded-lg border border-border bg-surface-overlay px-3 py-1.5 transition-colors hover:bg-surface-muted"
						>
							{#if auth.currentUser?.photoURL}
								<img
									src={auth.currentUser.photoURL}
									alt=""
									class="h-6 w-6 rounded-full object-cover"
								/>
							{:else}
								<div
									class="flex h-6 w-6 items-center justify-center rounded-full bg-tesla-red/20 text-xs font-semibold text-tesla-red"
								>
									{#if auth.currentUser?.displayName}
										{auth.currentUser.displayName.charAt(0).toUpperCase()}
									{:else if auth.currentUser?.email}
										{auth.currentUser.email.charAt(0).toUpperCase()}
									{/if}
								</div>
							{/if}
							<span class="max-w-[120px] truncate text-sm text-text-secondary">
								{auth.currentUser?.displayName || auth.currentUser?.email || 'User'}
							</span>

						</button>
						{#if profileMenuOpen}
							<!-- svelte-ignore a11y_no_static_element_interactions -->
							<div
								onclick={() => (profileMenuOpen = false)}
								class="fixed inset-0 z-40"
								aria-hidden="true"
								onkeydown={() => {}}
							></div>
							<div
								class="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-xl border border-border bg-surface-elevated shadow-2xl shadow-black/40"
							>
								<div class="border-b border-border px-4 py-3">
									<p class="truncate text-sm font-medium text-text-primary">
										{auth.currentUser?.displayName || 'User'}
									</p>
									<p class="truncate text-xs text-text-muted">
										{auth.currentUser?.email}
									</p>
								</div>
								<div class="p-1">										<a
											href="/bookings"
											onclick={() => (profileMenuOpen = false)}
											class="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-overlay hover:text-text-primary"
										>
											<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
												<rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
												<line x1="16" y1="2" x2="16" y2="6" />
												<line x1="8" y1="2" x2="8" y2="6" />
												<line x1="3" y1="10" x2="21" y2="10" />
											</svg>
											My Bookings
										</a>
										<a
											href="/vehicles"
											onclick={() => (profileMenuOpen = false)}
											class="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-overlay hover:text-text-primary"
										>
											<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
												<path d="M14 16H9m10 0h3v-3.15a1 1 0 0 0-.84-.99L16 11l-2.7-3.6a1 1 0 0 0-.8-.4H5.24a2 2 0 0 0-1.8 1.1l-.8 1.63A6 6 0 0 0 2 12.42V16h2" />
												<circle cx="6.5" cy="16.5" r="2.5" />
												<circle cx="16.5" cy="16.5" r="2.5" />
											</svg>
											My Vehicles
										</a>
										<div class="my-1 border-t border-border"></div>									<button
										onclick={() => {
											profileMenuOpen = false;
											auth.signOut();
										}}
										class="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-overlay hover:text-text-primary"
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
										>
											<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
											<polyline points="16 17 21 12 16 7" />
											<line x1="21" y1="12" x2="9" y2="12" />
										</svg>
										Sign Out
									</button>
								</div>
							</div>
						{/if}
					</div>
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
