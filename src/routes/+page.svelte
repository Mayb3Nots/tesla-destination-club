<script lang="ts">
	import CoreButton from '$lib/components/CoreButton.svelte';
</script>

<svelte:head>
	<title>Tesla Destination Club — Fair Charging for Every Owner</title>
	<meta
		name="description"
		content="Book slots, track live queues, and get notified when it's your turn. The fair way to share Tesla destination chargers in Malaysia."
	/>
</svelte:head>

<div class="relative min-h-screen overflow-hidden bg-surface">
	<!-- Ambient background elements -->
	<div class="pointer-events-none absolute inset-0">
		<div
			class="absolute -top-1/2 left-1/2 h-[800px] w-[800px] -translate-x-1/2 rounded-full opacity-[0.07]"
			style="background: radial-gradient(circle, var(--color-tesla-red), transparent 70%); animation: pulse-glow 6s ease-in-out infinite;"
		></div>
		<div
			class="absolute -right-32 top-1/4 h-[500px] w-[500px] rounded-full opacity-[0.04]"
			style="background: radial-gradient(circle, var(--color-accent-blue), transparent 70%);"
		></div>
	</div>

	<!-- Navigation -->
	<nav class="animate-fade-in relative z-10 mx-auto flex max-w-6xl items-center justify-between px-6 py-6 lg:px-8">
		<div class="flex items-center gap-3">
			<div class="flex h-9 w-9 items-center justify-center rounded-lg bg-tesla-red">
				<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
					<path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
				</svg>
			</div>
			<span class="font-display text-lg font-bold tracking-tight text-text-primary">Destination Club</span>
		</div>
		<CoreButton variant="ghost" size="sm" href="/login">
			Sign In
		</CoreButton>
	</nav>

	<!-- Hero Section -->
	<section class="relative z-10 mx-auto max-w-6xl px-6 pb-24 pt-12 lg:px-8 lg:pb-32 lg:pt-20">
		<div class="mx-auto max-w-3xl text-center">
			<div class="animate-fade-up mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-surface-elevated px-4 py-1.5">
				<span class="h-2 w-2 rounded-full bg-accent-green animate-pulse"></span>
				<span class="text-sm font-medium text-text-secondary">Built for Tesla owners in Malaysia</span>
			</div>

			<h1 class="animate-fade-up delay-100 font-display text-4xl font-extrabold leading-[1.1] tracking-tight text-text-primary sm:text-5xl lg:text-6xl">
				Fair charging.
				<br />
				<span class="text-tesla-red">No more waiting games.</span>
			</h1>

			<p class="animate-fade-up delay-200 mx-auto mt-6 max-w-xl text-lg leading-relaxed text-text-secondary sm:text-xl">
				Tesla destination chargers are free — but "free for all" doesn't mean fair for all.
				Book a slot, track the queue, and charge without the stress.
			</p>

			<div class="animate-fade-up delay-300 mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
				<CoreButton variant="primary" size="lg" href="/login">
					Get Started
					<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<path d="M5 12h14" />
						<path d="m12 5 7 7-7 7" />
					</svg>
				</CoreButton>
				<CoreButton variant="secondary" size="lg" href="#how-it-works">
					How It Works
				</CoreButton>
			</div>
		</div>

		<!-- Hero visual - charging status mockup -->
		<div class="animate-scale-in delay-500 mx-auto mt-16 max-w-2xl lg:mt-24">
			<div class="animate-float rounded-2xl border border-border bg-surface-elevated p-1 shadow-2xl shadow-black/40">
				<div class="rounded-xl bg-surface-overlay p-6">
					<div class="mb-5 flex items-center justify-between">
						<div class="flex items-center gap-3">
							<div class="flex h-10 w-10 items-center justify-center rounded-full bg-tesla-red/10">
								<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-tesla-red)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
									<path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
								</svg>
							</div>
							<div>
								<p class="text-sm font-semibold text-text-primary">Pavilion KL</p>
								<p class="text-xs text-text-muted">Destination Charger</p>
							</div>
						</div>
						<span class="inline-flex items-center gap-1.5 rounded-full bg-accent-green/10 px-3 py-1 text-xs font-semibold text-accent-green">
							<span class="h-1.5 w-1.5 rounded-full bg-accent-green"></span>
							2 of 4 free
						</span>
					</div>

					<div class="space-y-3">
						<div class="flex items-center justify-between rounded-lg bg-surface-elevated px-4 py-3">
							<div class="flex items-center gap-3">
								<div class="flex h-8 w-8 items-center justify-center rounded-full bg-accent-green/10 text-xs font-bold text-accent-green">A</div>
								<div>
									<p class="text-sm font-medium text-text-primary">Alex T.</p>
									<p class="text-xs text-text-muted">Model Y · 75%</p>
								</div>
							</div>
							<div class="text-right">
								<p class="text-sm font-semibold text-tesla-red">~12 min</p>
								<p class="text-xs text-text-muted">remaining</p>
							</div>
						</div>

						<div class="flex items-center justify-between rounded-lg bg-surface-elevated px-4 py-3">
							<div class="flex items-center gap-3">
								<div class="flex h-8 w-8 items-center justify-center rounded-full bg-accent-blue/10 text-xs font-bold text-accent-blue">S</div>
								<div>
									<p class="text-sm font-medium text-text-primary">Sarah K.</p>
									<p class="text-xs text-text-muted">Model 3 · 62%</p>
								</div>
							</div>
							<div class="text-right">
								<p class="text-sm font-semibold text-accent-blue">Next up</p>
								<p class="text-xs text-text-muted">in queue</p>
							</div>
						</div>

						<div class="flex items-center justify-between rounded-lg bg-surface-elevated px-4 py-3 opacity-60">
							<div class="flex items-center gap-3">
								<div class="flex h-8 w-8 items-center justify-center rounded-full bg-surface-muted text-xs font-bold text-text-muted">J</div>
								<div>
									<p class="text-sm font-medium text-text-primary">You</p>
									<p class="text-xs text-text-muted">Model 3 · 45%</p>
								</div>
							</div>
							<div class="text-right">
								<p class="text-sm font-semibold text-text-muted">#3</p>
								<p class="text-xs text-text-muted">in queue</p>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</section>

	<!-- How It Works -->
	<section id="how-it-works" class="relative z-10 border-t border-border-subtle py-24 lg:py-32">
		<div class="mx-auto max-w-6xl px-6 lg:px-8">
			<div class="mx-auto mb-16 max-w-2xl text-center">
				<h2 class="font-display text-3xl font-bold tracking-tight text-text-primary sm:text-4xl">
					Simple. Fast. Fair.
				</h2>
				<p class="mt-4 text-lg text-text-secondary">
					Three steps to stress-free charging
				</p>
			</div>

			<div class="grid gap-8 md:grid-cols-3">
				<!-- Step 1 -->
				<div class="group relative rounded-2xl border border-border bg-surface-elevated p-8 transition-all duration-300 hover:border-text-muted/30 hover:bg-surface-overlay">
					<div class="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-tesla-red/10 text-lg font-bold text-tesla-red font-display transition-colors group-hover:bg-tesla-red/20">
						1
					</div>
					<h3 class="mb-2 font-display text-lg font-semibold text-text-primary">Book a Slot</h3>
					<p class="text-sm leading-relaxed text-text-secondary">
						Pick your charger location and reserve a time window. No more driving there only to find all spots taken.
					</p>
				</div>

				<!-- Step 2 -->
				<div class="group relative rounded-2xl border border-border bg-surface-elevated p-8 transition-all duration-300 hover:border-text-muted/30 hover:bg-surface-overlay">
					<div class="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-accent-blue/10 text-lg font-bold text-accent-blue font-display transition-colors group-hover:bg-accent-blue/20">
						2
					</div>
					<h3 class="mb-2 font-display text-lg font-semibold text-text-primary">Track the Queue</h3>
					<p class="text-sm leading-relaxed text-text-secondary">
						See who's charging right now, how long they have left, and your position in line. Real-time, no guessing.
					</p>
				</div>

				<!-- Step 3 -->
				<div class="group relative rounded-2xl border border-border bg-surface-elevated p-8 transition-all duration-300 hover:border-text-muted/30 hover:bg-surface-overlay">
					<div class="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-accent-green/10 text-lg font-bold text-accent-green font-display transition-colors group-hover:bg-accent-green/20">
						3
					</div>
					<h3 class="mb-2 font-display text-lg font-semibold text-text-primary">Charge Up</h3>
					<p class="text-sm leading-relaxed text-text-secondary">
						Get notified when it's your turn. Pull up, plug in, and enjoy. Share your status with the WhatsApp group in one tap.
					</p>
				</div>
			</div>
		</div>
	</section>

	<!-- Philosophy Section -->
	<section class="relative z-10 border-t border-border-subtle py-24 lg:py-32">
		<div class="mx-auto max-w-6xl px-6 lg:px-8">
			<div class="mx-auto max-w-3xl">
				<div class="overflow-hidden rounded-2xl border border-border bg-surface-elevated p-8 sm:p-12">
					<div class="mb-6 flex items-center gap-3">
						<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-tesla-red)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
							<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
						</svg>
						<h2 class="font-display text-2xl font-bold text-text-primary sm:text-3xl">Our Promise</h2>
					</div>
					<p class="mb-6 text-lg leading-relaxed text-text-secondary">
						The app exists to serve the community — not to give app users an unfair advantage.
						If someone is physically present and waiting at the charger, they take priority. <strong class="text-text-primary">Always.</strong>
					</p>
					<p class="text-base leading-relaxed text-text-muted">
						Not everyone is on this platform yet — and that's okay. Be patient, be gracious,
						and remember that the goal is a better experience for the whole community,
						not just app users.
					</p>
				</div>
			</div>
		</div>
	</section>

	<!-- Features Grid -->
	<section class="relative z-10 border-t border-border-subtle py-24 lg:py-32">
		<div class="mx-auto max-w-6xl px-6 lg:px-8">
			<div class="mx-auto mb-16 max-w-2xl text-center">
				<h2 class="font-display text-3xl font-bold tracking-tight text-text-primary sm:text-4xl">
					Everything you need, nothing you don't
				</h2>
				<p class="mt-4 text-lg text-text-secondary">
					Designed to keep things simple so you can focus on the road
				</p>
			</div>

			<div class="grid gap-6 sm:grid-cols-2">
				<div class="rounded-2xl border border-border bg-surface-elevated p-8">
					<svg class="mb-4 text-tesla-red" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
						<rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
						<line x1="16" y1="2" x2="16" y2="6" />
						<line x1="8" y1="2" x2="8" y2="6" />
						<line x1="3" y1="10" x2="21" y2="10" />
					</svg>
					<h3 class="mb-2 font-display text-base font-semibold text-text-primary">Slot Booking</h3>
					<p class="text-sm leading-relaxed text-text-secondary">Reserve a time at a destination charger so everyone gets a fair turn.</p>
				</div>

				<div class="rounded-2xl border border-border bg-surface-elevated p-8">
					<svg class="mb-4 text-accent-blue" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
						<polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
					</svg>
					<h3 class="mb-2 font-display text-base font-semibold text-text-primary">Live Queue</h3>
					<p class="text-sm leading-relaxed text-text-secondary">See who's charging, how long they have left, and your position in line.</p>
				</div>

				<div class="rounded-2xl border border-border bg-surface-elevated p-8">
					<svg class="mb-4 text-accent-green" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
						<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
						<circle cx="9" cy="7" r="4" />
						<path d="M23 21v-2a4 4 0 0 0-3-3.87" />
						<path d="M16 3.13a4 4 0 0 1 0 7.75" />
					</svg>
					<h3 class="mb-2 font-display text-base font-semibold text-text-primary">Community Reports</h3>
					<p class="text-sm leading-relaxed text-text-secondary">Flag when a charger is occupied by a non-app user so the queue stays accurate.</p>
				</div>

				<div class="rounded-2xl border border-border bg-surface-elevated p-8">
					<svg class="mb-4 text-text-secondary" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
						<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
					</svg>
					<h3 class="mb-2 font-display text-base font-semibold text-text-primary">WhatsApp Sharing</h3>
					<p class="text-sm leading-relaxed text-text-secondary">Share your booking to the community group in one tap so non-app users stay in the loop.</p>
				</div>
			</div>
		</div>
	</section>

	<!-- CTA Section -->
	<section class="relative z-10 border-t border-border-subtle py-24 lg:py-32">
		<div class="mx-auto max-w-6xl px-6 lg:px-8">
			<div class="mx-auto max-w-2xl text-center">
				<h2 class="font-display text-3xl font-bold tracking-tight text-text-primary sm:text-4xl">
					Ready to charge smarter?
				</h2>
				<p class="mt-4 text-lg text-text-secondary">
					Join the community of Tesla owners making destination charging fair for everyone.
				</p>
				<div class="mt-10">
					<CoreButton variant="primary" size="lg" href="/login">
						Sign In to Get Started
						<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
							<path d="M5 12h14" />
							<path d="m12 5 7 7-7 7" />
						</svg>
					</CoreButton>
				</div>
				<p class="mt-4 text-sm text-text-muted">No install required. Works right in your browser.</p>
			</div>
		</div>
	</section>

	<!-- Footer -->
	<footer class="relative z-10 border-t border-border-subtle py-8">
		<div class="mx-auto max-w-6xl px-6 lg:px-8">
			<div class="flex flex-col items-center justify-between gap-4 sm:flex-row">
				<div class="flex items-center gap-2">
					<div class="flex h-6 w-6 items-center justify-center rounded bg-tesla-red">
						<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
							<path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
						</svg>
					</div>
					<span class="text-sm font-medium text-text-muted">Tesla Destination Club</span>
				</div>
				<p class="text-xs text-text-muted">Built with care for the Malaysian Tesla community</p>
			</div>
		</div>
	</footer>
</div>
