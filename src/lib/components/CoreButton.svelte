<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLButtonAttributes } from 'svelte/elements';

	type Props = HTMLButtonAttributes & {
		variant?: 'primary' | 'secondary' | 'ghost';
		size?: 'sm' | 'md' | 'lg';
		href?: string;
		children: Snippet;
	};

	let {
		variant = 'primary',
		size = 'md',
		href,
		children,
		class: className = '',
		...rest
	}: Props = $props();

	const baseClasses =
		'inline-flex items-center justify-center font-semibold font-[family-name:var(--font-display)] rounded-xl transition-all duration-300 ease-[var(--ease-out-expo)] cursor-pointer select-none';

	const variantClasses = {
		primary:
			'bg-tesla-red text-white hover:bg-tesla-red-dark hover:shadow-[0_0_30px_rgba(232,33,39,0.3)] active:scale-[0.97]',
		secondary:
			'bg-surface-elevated text-text-primary border border-border hover:bg-surface-overlay hover:border-text-muted active:scale-[0.97]',
		ghost: 'text-text-secondary hover:text-text-primary hover:bg-surface-elevated'
	};

	const sizeClasses = {
		sm: 'px-4 py-2 text-sm gap-1.5',
		md: 'px-6 py-3 text-base gap-2',
		lg: 'px-8 py-4 text-lg gap-2.5'
	};
</script>

{#if href}
	<a
		href={href}
		class="{baseClasses} {variantClasses[variant]} {sizeClasses[size]} {className}"
	>
		{@render children()}
	</a>
{:else}
	<button
		class="{baseClasses} {variantClasses[variant]} {sizeClasses[size]} {className}"
		{...rest}
	>
		{@render children()}
	</button>
{/if}
