<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';
	import '../app.css';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>Tesla Destination Club — Queue Management for Destination Chargers</title>
	<meta name="description" content="Open source queue management for Tesla destination chargers. No more circling the lot." />
	<meta name="theme-color" content="#0a0a0a" />
</svelte:head>

<div class="min-h-screen bg-[#0a0a0a] text-white">
	{@render children()}
</div>
