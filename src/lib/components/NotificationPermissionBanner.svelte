<script lang="ts">
	import { onMount } from 'svelte';
	import { enableNotifications, getNotificationStatus } from '$lib/firebase/messaging';
	import { getAuthState } from '$lib/firebase/auth.svelte';

	let { onclose }: { onclose?: () => void } = $props();

	const auth = getAuthState();
	let loading = $state(false);
	let dismissed = $state(false);

	onMount(() => {
		// Check if user previously dismissed the banner
		const wasDismissed = localStorage.getItem('notification-banner-dismissed');
		if (wasDismissed) {
			dismissed = true;
		}
	});

	async function handleEnable() {
		if (!auth.currentUser) return;
		loading = true;
		try {
			const success = await enableNotifications(auth.currentUser.uid);
			if (success) {
				dismissed = true;
			}
		} catch (err) {
			console.error('Failed to enable notifications:', err);
		} finally {
			loading = false;
		}
	}

	function handleDismiss() {
		localStorage.setItem('notification-banner-dismissed', 'true');
		dismissed = true;
		onclose?.();
	}

	let visible = $derived(!dismissed && getNotificationStatus() === 'default');
</script>

{#if visible}
	<div
		class="mx-auto flex max-w-6xl items-center justify-between gap-4 rounded-xl border border-border bg-surface-elevated px-5 py-3.5 lg:px-6"
	>
		<div class="flex items-center gap-3">
			<div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent-blue/10">
				<svg
					width="18"
					height="18"
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
			<div>
				<p class="text-sm font-medium text-text-primary">Stay ahead of your slot</p>
				<p class="text-xs text-text-secondary">Get a reminder 15 minutes before your charging session</p>
			</div>
		</div>
		<div class="flex shrink-0 items-center gap-2">
			<button
				onclick={handleDismiss}
				class="rounded-lg px-3 py-1.5 text-xs font-medium text-text-muted transition-colors hover:text-text-secondary"
			>
				Later
			</button>
			<button
				onclick={handleEnable}
				disabled={loading}
				class="rounded-lg bg-accent-blue px-3.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-accent-blue/90 disabled:opacity-50"
			>
				{#if loading}
					Enable...
				{:else}
					Enable
				{/if}
			</button>
		</div>
	</div>
{/if}
