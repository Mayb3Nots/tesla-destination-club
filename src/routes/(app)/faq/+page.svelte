<script lang="ts">
	interface FaqItem {
		question: string;
		answer: string;
	}

	const faqs: FaqItem[] = [
		{
			question: 'Can I register for a session that has already ended?',
			answer:
				'No. You can only register for upcoming or currently active sessions. Once a session has ended, it is no longer available for booking. Make sure to book your slot ahead of time to secure your charging spot.'
		}
	];

	let openIndex = $state<number | null>(0);

	function toggle(index: number) {
		openIndex = openIndex === index ? null : index;
	}
</script>

<svelte:head>
	<title>FAQ — Tesla Destination Club</title>
</svelte:head>

<div class="mx-auto max-w-3xl px-6 py-12 lg:px-8">
	<div class="mb-10">
		<h1 class="font-display text-3xl font-bold tracking-tight text-text-primary">
			Frequently Asked Questions
		</h1>
		<p class="mt-2 text-base text-text-secondary">
			Everything you need to know about using Tesla Destination Club.
		</p>
	</div>

	<div class="space-y-3">
		{#each faqs as faq, i}
			<div
				class="overflow-hidden rounded-xl border border-border bg-surface-elevated transition-colors"
			>
				<button
					onclick={() => toggle(i)}
					class="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-surface-overlay"
				>
					<span class="text-sm font-semibold text-text-primary">{faq.question}</span>
					<svg
						width="16"
						height="16"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
						class="shrink-0 text-text-muted transition-transform duration-200 {openIndex === i
							? 'rotate-180'
							: ''}"
					>
						<polyline points="6 9 12 15 18 9" />
					</svg>
				</button>

				{#if openIndex === i}
					<div class="border-t border-border px-5 py-4">
						<p class="text-sm leading-relaxed text-text-secondary">{faq.answer}</p>
					</div>
				{/if}
			</div>
		{/each}
	</div>

	<div class="mt-12 rounded-xl border border-border bg-surface-elevated p-6 text-center">
		<h2 class="font-display text-base font-semibold text-text-primary">Still have questions?</h2>
		<p class="mt-1 text-sm text-text-secondary">
			Reach out to us and we'll be happy to help.
		</p>
	</div>
</div>
