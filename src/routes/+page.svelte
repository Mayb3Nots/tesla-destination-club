<script lang="ts">
	// Tesla Destination Club — Landing Page
</script>

<svelte:head>
	<title>Tesla Destination Club</title>
</svelte:head>

<!-- Hero -->
<section class="relative flex min-h-screen flex-col items-center justify-center px-6 text-center">
	<!-- Subtle glow -->
	<div class="pointer-events-none absolute inset-0 overflow-hidden">
		<div class="absolute left-1/2 top-1/3 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-red-600/10 blur-3xl"></div>
	</div>

	<div class="relative z-10 max-w-3xl">
		<div class="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm text-gray-400">
			<span class="inline-block h-2 w-2 rounded-full bg-red-500"></span>
			Open Source
		</div>

		<h1 class="mb-4 text-5xl font-bold tracking-tight sm:text-7xl">
			Tesla Destination
			<span class="bg-gradient-to-r from-red-500 to-red-600 bg-clip-text text-transparent">Club</span>
		</h1>

		<p class="mb-8 text-lg text-gray-400 sm:text-xl">
			Queue management for Tesla destination chargers.
			<br />
			No more circling the lot.
		</p>

		<div class="flex flex-col gap-4 sm:flex-row sm:justify-center">
			<a
				href="/queue"
				class="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-6 py-3 font-medium text-white transition-colors hover:bg-red-700"
			>
				<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
				Join a Queue
			</a>
			<a
				href="https://github.com/Mayb3Nots/tesla-destination-club"
				target="_blank"
				rel="noopener"
				class="inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 px-6 py-3 font-medium text-white transition-colors hover:bg-white/10"
			>
				<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
				GitHub
			</a>
		</div>
	</div>
</section>

<!-- How It Works -->
<section class="mx-auto max-w-5xl px-6 py-24">
	<h2 class="mb-12 text-center text-3xl font-bold">How It Works</h2>

	<div class="grid gap-8 sm:grid-cols-3">
		<div class="rounded-xl border border-white/10 bg-white/5 p-6">
			<div class="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-red-600/10 text-red-500 text-xl font-bold">1</div>
			<h3 class="mb-2 font-semibold text-lg">Find a Location</h3>
			<p class="text-sm text-gray-400">Browse Tesla destination charger locations near you. Hotels, malls, restaurants — wherever you're heading.</p>
		</div>

		<div class="rounded-xl border border-white/10 bg-white/5 p-6">
			<div class="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-red-600/10 text-red-500 text-xl font-bold">2</div>
			<h3 class="mb-2 font-semibold text-lg">Join the Queue</h3>
			<p class="text-sm text-gray-400">Get in line virtually instead of circling the lot. See your position, estimated wait time, and charger status in real time.</p>
		</div>

		<div class="rounded-xl border border-white/10 bg-white/5 p-6">
			<div class="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-red-600/10 text-red-500 text-xl font-bold">3</div>
			<h3 class="mb-2 font-semibold text-lg">Plug In & Go</h3>
			<p class="text-sm text-gray-400">Get notified when it's your turn. Plug in, charge up, and check out so the next person can go. Simple as that.</p>
		</div>
	</div>
</section>

<!-- Footer -->
<footer class="border-t border-white/10 px-6 py-8 text-center text-sm text-gray-500">
	<p>
		<span class="text-gray-400">Tesla Destination Club</span> — Open source, built by the community.
	</p>
	<p class="mt-1">Not affiliated with Tesla, Inc.</p>
</footer>
