<script lang="ts">
	import { onMount } from 'svelte';
	import { getLeaderboard } from '$lib/firebase/firestore.svelte';

	let leaderboard = $state<any[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);

	onMount(async () => {
		try {
			const result = await getLeaderboard();
			if (result.success) {
				leaderboard = result.leaderboard;
			}
		} catch (err) {
			console.error('Failed to load leaderboard:', err);
			error = 'Failed to load leaderboard. Please try again.';
		} finally {
			loading = false;
		}
	});

	function formatDate(dateString: string): string {
		const date = new Date(dateString);
		return date.toLocaleDateString('en-MY', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}

	function getRankBadgeColor(rank: number): string {
		switch (rank) {
			case 1:
				return 'bg-accent-yellow/15 text-accent-yellow';
			case 2:
				return 'bg-surface-muted text-text-secondary';
			case 3:
				return 'bg-orange-500/15 text-orange-400';
			default:
				return 'bg-accent-blue/10 text-accent-blue';
		}
	}
</script>

<svelte:head>
	<title>Hogger Leaderboard - Tesla Destination Club</title>
</svelte:head>

<div class="mx-auto max-w-2xl px-6 py-10 lg:px-8">
	<!-- Header -->
	<div class="mb-8">
		<h1 class="font-display text-3xl font-bold tracking-tight text-text-primary">
			🏆 Hogger Leaderboard
		</h1>
		<p class="mt-2 text-base text-text-secondary">
			Top 10 vehicles with the most hogging reports. Plates appear here after 2+ approved reports.
		</p>
	</div>

		<!-- Content -->
		{#if loading}
			<div class="flex items-center justify-center py-20">
				<div class="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-tesla-red"></div>
			</div>
		{:else if error}
			<div class="rounded-lg bg-tesla-red/10 border border-tesla-red/20 p-6 text-center">
				<p class="text-sm font-medium text-tesla-red-light">{error}</p>
			</div>
		{:else if leaderboard.length === 0}
			<div class="rounded-2xl border border-border bg-surface-elevated p-8 text-center">
				<p class="text-text-secondary text-lg">
					No hogging reports yet. Help keep our chargers available!
				</p>
			</div>
		{:else}
			<div class="overflow-hidden rounded-2xl border border-border bg-surface-elevated">
				<!-- Desktop Table -->
				<div class="hidden md:block overflow-x-auto">
					<table class="min-w-full">
						<thead class="border-b border-border bg-surface-overlay">
							<tr>
								<th class="px-6 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wider">Rank</th>
								<th class="px-6 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wider">License Plate</th>
								<th class="px-6 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wider">Reports</th>
								<th class="px-6 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wider">Last Reported</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-border">
							{#each leaderboard as entry, index}
							<tr class="transition-colors hover:bg-surface-overlay">
								<td class="px-6 py-4">
									<span class={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${getRankBadgeColor(entry.rank)}`}>
										{entry.rank}
									</span>
								</td>
								<td class="px-6 py-4">
									<span class="font-mono font-semibold text-text-primary text-lg">{entry.plateNumber}</span>
								</td>
								<td class="px-6 py-4">
									<span class="inline-flex items-center justify-center bg-tesla-red/10 text-tesla-red px-3 py-1 rounded-full font-bold">
										{entry.approvedReportCount}
									</span>
								</td>
								<td class="px-6 py-4 text-sm text-text-muted">
										{formatDate(entry.lastReportedAt)}
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>

				<!-- Mobile Cards -->
				<div class="md:hidden space-y-3 p-4">
					{#each leaderboard as entry}
					<div class="rounded-xl border border-border bg-surface p-4">
						<div class="flex items-center justify-between mb-3">
							<span class={`inline-flex items-center justify-center w-10 h-10 rounded-full font-bold text-lg ${getRankBadgeColor(entry.rank)}`}>
								{entry.rank}
							</span>
							<span class="inline-flex items-center justify-center bg-tesla-red/10 text-tesla-red px-3 py-1 rounded-full font-bold text-sm">
								{entry.approvedReportCount} reports
							</span>
						</div>
						<p class="font-mono font-semibold text-text-primary mb-2 text-lg">{entry.plateNumber}</p>
						<p class="text-xs text-text-muted">Last reported: {formatDate(entry.lastReportedAt)}</p>
						</div>
					{/each}
				</div>
			</div>
		{/if}

	<!-- Info Box -->
	<div class="mt-8 rounded-2xl border border-accent-blue/20 bg-accent-blue/5 p-6">
		<h3 class="font-semibold text-accent-blue mb-2">📋 About This Hogger Leaderboard</h3>
		<ul class="text-sm text-text-secondary space-y-1">
			<li>• Only plates with <strong>2+ approved reports</strong> appear on this hogger leaderboard</li>
			<li>• First-time offenders are given the benefit of the doubt</li>
			<li>• Reports are reviewed by our moderation team before counting</li>
			<li>• Have you spotted a hogging incident? <a href="/report" class="font-semibold text-accent-blue hover:underline">Submit a report</a></li>
		</ul>
	</div>
</div>
