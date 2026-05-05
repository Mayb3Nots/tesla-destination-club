<script lang="ts">
	interface EtiquetteRule {
		icon: string;
		title: string;
		description: string;
		important?: boolean;
	}

	const rules: EtiquetteRule[] = [
		{
			icon: '⚡',
			title: 'Booking is a courtesy, not a right',
			description:
				'This booking system is provided as a courtesy to help coordinate charging sessions. Making a booking does not grant you the exclusive right to use a charger. The system is meant to help everyone plan better — not to claim ownership of a charging spot.',
			important: true
		},
		{
			icon: '🧍',
			title: 'Physical queues always take priority',
			description:
				'If someone is physically waiting at the charger, they should always get priority — regardless of any booking. If you have a booking but arrive to find someone already queuing in person, the physical queue takes precedence. Always respect people who have taken the time to wait on-site.',
			important: true
		},
		{
			title: 'Leave when your session is done',
			icon: '🚗',
			description:
				'Once your charging session is complete, move your vehicle promptly. Do not remain parked at the charger to hold the spot or wait around unnecessarily. Other owners may be waiting to charge.'
		},
		{
			icon: '🚫',
			title: 'No charger hogging or passing',
			description:
				'Do not use the booking system to "hold" a charger just to pass it on to someone else after your session. The system is not meant for reserving chargers for friends or passing slots between users. Each booking should be for your own genuine charging need.'
		},
		{
			icon: '🤝',
			title: 'Act as if there is no queue system',
			description:
				'The bottom line: behave as you normally would at any public charging station. Be courteous, be mindful of others, and use common sense. The booking system is simply a helpful tool — it does not change the basic etiquette of sharing charging infrastructure with fellow owners.'
		},
		{
			icon: '⏰',
			title: 'Be punctual',
			description:
				'If you make a booking, try to arrive on time. If you no longer need the slot, cancel your booking so someone else can use it. Lingering bookings that go unused prevent others from planning their charging sessions.'
		},
		{
			icon: '🔌',
			title: 'Unplug when finished',
			description:
				'Once your vehicle has charged sufficiently, unplug the connector and return it to its holder. This makes it immediately clear to others that the charger is available and keeps the station tidy for the next user.'
		},
		{
			icon: '💬',
			title: 'Communicate respectfully',
			description:
				'If you encounter a conflict over a charger, handle it politely. We\'re all part of the same community. Aggressive behaviour or arguments over charging spots are not acceptable.'
		}
	];
</script>

<svelte:head>
	<title>Rules & Etiquette — Tesla Destination Club</title>
</svelte:head>

<div class="mx-auto max-w-3xl px-6 py-12 lg:px-8">
	<div class="mb-10">
		<h1 class="font-display text-3xl font-bold tracking-tight text-text-primary">
			Rules & Etiquette
		</h1>
		<p class="mt-2 text-base text-text-secondary">
			Guidelines for using the Tesla Destination Club charging system responsibly.
		</p>
	</div>

	<!-- Highlighted callout box -->
	<div
		class="mb-8 rounded-xl border border-tesla-red/30 bg-tesla-red/5 p-5"
	>
		<div class="flex items-start gap-3">
			<div
				class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-tesla-red/10"
			>
				<svg
					width="16"
					height="16"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
					class="text-tesla-red"
				>
					<circle cx="12" cy="12" r="10" />
					<line x1="12" y1="8" x2="12" y2="12" />
					<line x1="12" y1="16" x2="12.01" y2="16" />
				</svg>
			</div>
			<div>
				<h2 class="text-sm font-semibold text-tesla-red">Important reminder</h2>
				<p class="mt-1 text-sm leading-relaxed text-text-secondary">
					This booking system is a <strong class="text-text-primary">courtesy tool only</strong>. It does not give you the right to a charger. Physical queues
					<strong class="text-text-primary">always</strong> take priority. Act and behave like there is no queuing system — charge normally and be respectful to others.
				</p>
			</div>
		</div>
	</div>

	<div class="space-y-4">
		{#each rules as rule, i}
			<div
				class="overflow-hidden rounded-xl border bg-surface-elevated transition-colors {rule.important
					? 'border-accent-blue/30'
					: 'border-border'}"
			>
				<div class="flex items-start gap-4 px-5 py-4">
					<span class="mt-0.5 text-xl">{rule.icon}</span>
					<div class="min-w-0 flex-1">
						<h3
							class="text-sm font-semibold text-text-primary"
						>
							{rule.title}
							{#if rule.important}
								<span
									class="ml-1.5 inline-flex items-center rounded-md bg-accent-blue/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-accent-blue"
								>
									Key rule
								</span>
							{/if}
						</h3>
						<p class="mt-2 text-sm leading-relaxed text-text-secondary">
							{rule.description}
						</p>
					</div>
				</div>
			</div>
		{/each}
	</div>

	<div
		class="mt-12 rounded-xl border border-border bg-surface-elevated p-6 text-center"
	>
		<h2 class="font-display text-base font-semibold text-text-primary">
			Let's keep it civil
		</h2>
		<p class="mt-1 text-sm text-text-secondary">
			This system works best when everyone cooperates. Be kind, be fair, and happy
			charging! ⚡
		</p>
	</div>
</div>
