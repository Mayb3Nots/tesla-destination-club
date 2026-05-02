<script lang="ts">
	import type { Snippet } from 'svelte';

	type Props = {
		title: string;
		text: string;
		children: Snippet;
		class?: string;
	};

	let { title, text, children, class: className = '' }: Props = $props();

	let copied = $state(false);

	async function handleShare() {
		const shareData = { title, text };

		if (navigator.share) {
			try {
				await navigator.share(shareData);
			} catch {
				// User cancelled or share failed — no action needed
			}
		} else {
			await navigator.clipboard.writeText(text);
			copied = true;
			setTimeout(() => (copied = false), 2000);
		}
	}
</script>

<button
	type="button"
	onclick={handleShare}
	class="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-surface-elevated px-4 py-2.5 text-sm font-semibold font-[family-name:var(--font-display)] text-text-primary transition-all duration-300 ease-[var(--ease-out-expo)] hover:bg-surface-overlay hover:border-text-muted active:scale-[0.97] cursor-pointer select-none {className}"
>
	{#if copied}
		<svg
			width="16"
			height="16"
			viewBox="0 0 24 24"
			fill="none"
			stroke="var(--color-accent-green)"
			stroke-width="2"
			stroke-linecap="round"
			stroke-linejoin="round"
		>
			<polyline points="20 6 9 17 4 12" />
		</svg>
		<span class="text-accent-green">Copied!</span>
	{:else}
		<svg
			width="16"
			height="16"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
			stroke-linecap="round"
			stroke-linejoin="round"
		>
			<circle cx="18" cy="5" r="3" />
			<circle cx="6" cy="12" r="3" />
			<circle cx="18" cy="19" r="3" />
			<line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
			<line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
		</svg>
		{@render children()}
	{/if}
</button>
