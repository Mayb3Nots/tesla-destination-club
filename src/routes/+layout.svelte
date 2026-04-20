<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link
		href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=Sora:wght@400;600;700;800&display=swap"
		rel="stylesheet"
	/>
	<meta name="description" content="Fair, stress-free destination charging for every Tesla owner in Malaysia. Book slots, track queues, and charge together." />
	<meta name="theme-color" content="#0a0a0a" />
	<title>Tesla Destination Club</title>
</svelte:head>

{@render children()}
