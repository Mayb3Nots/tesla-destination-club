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
				return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
			case 2:
				return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
			case 3:
				return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
			default:
				return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
		}
	}
</script>

<svelte:head>
	<title>Hogging Leaderboard - Tesla Destination Club</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4 sm:px-6 lg:px-8">
	<div class="max-w-4xl mx-auto">
		<!-- Header -->
		<div class="mb-8">
			<h1 class="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
				🏆 Hogging Leaderboard
			</h1>
			<p class="text-gray-600 dark:text-gray-300">
				Top 10 vehicles with the most hogging reports. Plates appear here after 2+ approved reports.
			</p>
		</div>

		<!-- Content -->
		{#if loading}
			<div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center">
				<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
				<p class="text-gray-600 dark:text-gray-400">Loading leaderboard...</p>
			</div>
		{:else if error}
			<div class="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center">
				<p class="text-red-800 dark:text-red-200 font-medium">{error}</p>
			</div>
		{:else if leaderboard.length === 0}
			<div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center">
				<p class="text-gray-600 dark:text-gray-400 text-lg">
					No hogging reports yet. Help keep our chargers available!
				</p>
			</div>
		{:else}
			<div class="overflow-hidden rounded-lg shadow-md bg-white dark:bg-gray-800">
				<!-- Desktop Table -->
				<div class="hidden md:block overflow-x-auto">
					<table class="min-w-full">
						<thead class="bg-gray-100 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
							<tr>
								<th class="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Rank</th>
								<th class="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">License Plate</th>
								<th class="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Reports</th>
								<th class="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Last Reported</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-gray-200 dark:divide-gray-700">
							{#each leaderboard as entry, index}
								<tr class="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
									<td class="px-6 py-4">
										<span class={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${getRankBadgeColor(entry.rank)}`}>
											{entry.rank}
										</span>
									</td>
									<td class="px-6 py-4">
										<span class="font-mono font-semibold text-gray-900 dark:text-white text-lg">{entry.plateNumber}</span>
									</td>
									<td class="px-6 py-4">
										<span class="inline-flex items-center justify-center bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 px-3 py-1 rounded-full font-bold">
											{entry.approvedReportCount}
										</span>
									</td>
									<td class="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
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
						<div class="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
							<div class="flex items-center justify-between mb-3">
								<span class={`inline-flex items-center justify-center w-10 h-10 rounded-full font-bold text-lg ${getRankBadgeColor(entry.rank)}`}>
									{entry.rank}
								</span>
								<span class="inline-flex items-center justify-center bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 px-3 py-1 rounded-full font-bold text-sm">
									{entry.approvedReportCount} reports
								</span>
							</div>
							<p class="font-mono font-semibold text-gray-900 dark:text-white mb-2 text-lg">{entry.plateNumber}</p>
							<p class="text-xs text-gray-600 dark:text-gray-400">Last reported: {formatDate(entry.lastReportedAt)}</p>
						</div>
					{/each}
				</div>
			</div>
		{/if}

		<!-- Info Box -->
		<div class="mt-8 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
			<h3 class="font-semibold text-blue-900 dark:text-blue-100 mb-2">📋 About This Leaderboard</h3>
			<ul class="text-sm text-blue-800 dark:text-blue-200 space-y-1">
				<li>• Only plates with <strong>2+ approved reports</strong> appear on this leaderboard</li>
				<li>• First-time offenders are given the benefit of the doubt</li>
				<li>• Reports are reviewed by our moderation team before counting</li>
				<li>• Have you spotted a hogging incident? <a href="/report" class="font-semibold hover:underline">Submit a report</a></li>
			</ul>
		</div>
	</div>
</div>
