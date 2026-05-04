<script lang="ts">
	import CoreButton from '$lib/components/CoreButton.svelte';
	import { onMount } from 'svelte';

	const words = ['guessing', 'camping', 'wasting time', 'stressing', 'gambling', 'hovering', 'waiting around', 'rolling the dice'];
	let currentWordIndex = $state(0);
	let fadingOut = $state(false);

	onMount(() => {
		const interval = setInterval(() => {
			fadingOut = true;
			setTimeout(() => {
				currentWordIndex = (currentWordIndex + 1) % words.length;
				fadingOut = false;
			}, 400);
		}, 2500);

		return () => clearInterval(interval);
	});
</script>

<svelte:head>
	<title>Tesla Destination Club — Stop Guessing, Start Charging</title>
	<meta
		name="description"
		content="Know when chargers are free, book your slot, and show up when it's your turn. Save time at Tesla destination chargers in Malaysia."
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
		<div class="flex items-center gap-2">
			<CoreButton variant="ghost" size="sm" href="/leaderboard">
				Leaderboard
			</CoreButton>
			<CoreButton variant="ghost" size="sm" href="/chargers">
				Chargers
			</CoreButton>
			<CoreButton variant="ghost" size="sm" href="/login">
				Sign In
			</CoreButton>
		</div>
	</nav>

	<!-- Hero Section -->
	<section class="relative z-10 mx-auto max-w-6xl px-6 pb-24 pt-12 lg:px-8 lg:pb-32 lg:pt-20">
		<div class="mx-auto max-w-3xl text-center">
			<div class="animate-fade-up mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-surface-elevated px-4 py-1.5">
				<span class="h-2 w-2 rounded-full bg-accent-green animate-pulse"></span>
				<span class="text-sm font-medium text-text-secondary">Built for Tesla owners in Malaysia</span>
			</div>

			<h1 class="animate-fade-up delay-100 font-display text-3xl font-extrabold leading-[1.1] tracking-tight text-text-primary sm:text-4xl lg:text-5xl">
				Stop
				<span
					class="text-tesla-red inline-block transition-all duration-400 min-w-[3ch]"
					class:opacity-0={fadingOut}
					class:translate-y-1={fadingOut}
				>
					{words[currentWordIndex]}
				</span>
				for
				<br />
				a destination charger.
			</h1>

			<p class="animate-fade-up delay-200 mx-auto mt-6 max-w-xl text-lg leading-relaxed text-text-secondary sm:text-xl">
				No more driving there only to find all spots taken. No more camping in the car park.
				See real-time availability, book your slot, and show up when it's your turn.
			</p>

			<div class="animate-fade-up delay-300 mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
				<CoreButton variant="primary" size="lg" href="/chargers">
					View Chargers
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
					How it saves you time
				</h2>
				<p class="mt-4 text-lg text-text-secondary">
					Three steps — no more guesswork
				</p>
			</div>

			<div class="grid gap-8 md:grid-cols-3">
				<!-- Step 1 -->
				<div class="group relative rounded-2xl border border-border bg-surface-elevated p-8 transition-all duration-300 hover:border-text-muted/30 hover:bg-surface-overlay">
					<div class="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-tesla-red/10 text-lg font-bold text-tesla-red font-display transition-colors group-hover:bg-tesla-red/20">
						1
					</div>
					<h3 class="mb-2 font-display text-lg font-semibold text-text-primary">Check Availability</h3>
					<p class="text-sm leading-relaxed text-text-secondary">
						See which chargers are free right now and how long the wait is. No need to drive there to find out.
					</p>
				</div>

				<!-- Step 2 -->
				<div class="group relative rounded-2xl border border-border bg-surface-elevated p-8 transition-all duration-300 hover:border-text-muted/30 hover:bg-surface-overlay">
					<div class="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-accent-blue/10 text-lg font-bold text-accent-blue font-display transition-colors group-hover:bg-accent-blue/20">
						2
					</div>
					<h3 class="mb-2 font-display text-lg font-semibold text-text-primary">Book Your Slot</h3>
					<p class="text-sm leading-relaxed text-text-secondary">
						Reserve a time window so you can plan your day. Go grab a coffee, run errands — show up when it's your turn.
					</p>
				</div>

				<!-- Step 3 -->
				<div class="group relative rounded-2xl border border-border bg-surface-elevated p-8 transition-all duration-300 hover:border-text-muted/30 hover:bg-surface-overlay">
					<div class="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-accent-green/10 text-lg font-bold text-accent-green font-display transition-colors group-hover:bg-accent-green/20">
						3
					</div>
					<h3 class="mb-2 font-display text-lg font-semibold text-text-primary">Get Notified</h3>
					<p class="text-sm leading-relaxed text-text-secondary">
						We'll ping you when it's almost your turn. Pull up, plug in, and get on with your day. Share your status to WhatsApp in one tap.
					</p>
				</div>
			</div>
		</div>
	</section>

	<!-- Time Saved Section -->
	<section class="relative z-10 border-t border-border-subtle py-24 lg:py-32">
		<div class="mx-auto max-w-6xl px-6 lg:px-8">
			<div class="mx-auto max-w-3xl">
				<div class="overflow-hidden rounded-2xl border border-border bg-surface-elevated p-8 sm:p-12">
					<div class="mb-6 flex items-center gap-3">
						<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-tesla-red)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
							<circle cx="12" cy="12" r="10" />
							<polyline points="12 6 12 12 16 14" />
						</svg>
						<h2 class="font-display text-2xl font-bold text-text-primary sm:text-3xl">Your time matters</h2>
					</div>
					<p class="mb-6 text-lg leading-relaxed text-text-secondary">
						We've all been there — drive to a destination charger, find all spots taken, and end up sitting around waiting.
						This app exists so you can <strong class="text-text-primary">stop wasting time</strong> and actually plan your charge.
					</p>
					<p class="text-base leading-relaxed text-text-muted">
						If someone is physically at the charger, they take priority — that's just basic courtesy.
						This tool is about making the whole process smoother for everyone, whether you use the app or not.
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
					Built for the real-world charging experience
				</h2>
				<p class="mt-4 text-lg text-text-secondary">
					Everything you need to skip the wait and get charged up
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
					<p class="text-sm leading-relaxed text-text-secondary">Reserve a time slot so you can plan your day instead of sitting around waiting.</p>
				</div>

				<div class="rounded-2xl border border-border bg-surface-elevated p-8">
					<svg class="mb-4 text-accent-blue" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
						<polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
					</svg>
					<h3 class="mb-2 font-display text-base font-semibold text-text-primary">Live Queue</h3>
					<p class="text-sm leading-relaxed text-text-secondary">See who's charging and how long they have left — before you even leave the house.</p>
				</div>

				<div class="rounded-2xl border border-border bg-surface-elevated p-8">
					<svg class="mb-4 text-accent-green" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
						<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
						<path d="M13.73 21a2 2 0 0 1-3.46 0" />
					</svg>
					<h3 class="mb-2 font-display text-base font-semibold text-text-primary">Push Notifications</h3>
					<p class="text-sm leading-relaxed text-text-secondary">Get pinged when it's almost your turn so you can time your arrival perfectly.</p>
				</div>

				<div class="rounded-2xl border border-border bg-surface-elevated p-8">
					<svg class="mb-4 text-text-secondary" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
						<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
					</svg>
					<h3 class="mb-2 font-display text-base font-semibold text-text-primary">WhatsApp Sharing</h3>
					<p class="text-sm leading-relaxed text-text-secondary">Share your booking to the community group in one tap so others know the charger is taken.</p>
				</div>
			</div>
		</div>
	</section>

	<!-- CTA Section -->
	<section class="relative z-10 border-t border-border-subtle py-24 lg:py-32">
		<div class="mx-auto max-w-6xl px-6 lg:px-8">
			<div class="mx-auto max-w-2xl text-center">
				<h2 class="font-display text-3xl font-bold tracking-tight text-text-primary sm:text-4xl">
					Ready to stop waiting around?
				</h2>
				<p class="mt-4 text-lg text-text-secondary">
					Join the Tesla owners who'd rather plan ahead than camp at a charger.
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
