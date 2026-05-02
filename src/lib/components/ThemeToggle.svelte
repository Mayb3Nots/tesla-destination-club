<script lang="ts">
	import { theme, setThemePref, getResolvedTheme } from '$lib/theme.svelte';

	let open = $state(false);

	function toggleMenu() {
		open = !open;
	}

	function select(pref: 'light' | 'dark' | 'system') {
		setThemePref(pref);
		open = false;
	}

	function handleClickOutside(e: MouseEvent) {
		if (!wrapper?.contains(e.target as Node)) {
			open = false;
		}
	}

	let wrapper: HTMLElement;

	$effect(() => {
		if (open) {
			document.addEventListener('click', handleClickOutside);
		} else {
			document.removeEventListener('click', handleClickOutside);
		}
	});
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="relative" bind:this={wrapper}>
	<button
		onclick={toggleMenu}
		class="rounded-lg p-2 text-text-secondary transition-colors hover:bg-surface-elevated hover:text-text-primary"
		aria-label="Toggle theme"
	>
		{#if getResolvedTheme() === 'dark'}
			<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
				<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
			</svg>
		{:else}
			<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
				<circle cx="12" cy="12" r="5" />
				<line x1="12" y1="1" x2="12" y2="3" />
				<line x1="12" y1="21" x2="12" y2="23" />
				<line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
				<line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
				<line x1="1" y1="12" x2="3" y2="12" />
				<line x1="21" y1="12" x2="23" y2="12" />
				<line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
				<line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
			</svg>
		{/if}
	</button>

	{#if open}
		<div
			class="absolute right-0 top-full z-50 mt-2 w-36 overflow-hidden rounded-xl border border-border bg-surface-elevated shadow-lg animate-scale-in"
		>
			<button
				onclick={() => select('light')}
				class="flex w-full items-center gap-2 px-3 py-2.5 text-sm transition-colors {theme === 'light'
					? 'bg-surface-overlay text-text-primary'
					: 'text-text-secondary hover:bg-surface-overlay hover:text-text-primary'}"
			>
				<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<circle cx="12" cy="12" r="5" />
					<line x1="12" y1="1" x2="12" y2="3" />
					<line x1="12" y1="21" x2="12" y2="23" />
					<line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
					<line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
					<line x1="1" y1="12" x2="3" y2="12" />
					<line x1="21" y1="12" x2="23" y2="12" />
					<line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
					<line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
				</svg>
				Light
			</button>
			<button
				onclick={() => select('dark')}
				class="flex w-full items-center gap-2 px-3 py-2.5 text-sm transition-colors {theme === 'dark'
					? 'bg-surface-overlay text-text-primary'
					: 'text-text-secondary hover:bg-surface-overlay hover:text-text-primary'}"
			>
				<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
				</svg>
				Dark
			</button>
			<button
				onclick={() => select('system')}
				class="flex w-full items-center gap-2 px-3 py-2.5 text-sm transition-colors {theme === 'system'
					? 'bg-surface-overlay text-text-primary'
					: 'text-text-secondary hover:bg-surface-overlay hover:text-text-primary'}"
			>
				<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
					<line x1="8" y1="21" x2="16" y2="21" />
					<line x1="12" y1="17" x2="12" y2="21" />
				</svg>
				System
			</button>
		</div>
	{/if}
</div>
