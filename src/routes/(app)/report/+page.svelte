<script lang="ts">
	import HoggingReportForm from '$lib/components/HoggingReportForm.svelte';
</script>

<svelte:head>
	<title>Report Hogging - Tesla Destination Club</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4 sm:px-6 lg:px-8">
	<div class="max-w-2xl mx-auto">
		<div class="mb-8">
			<h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">Report a Hogging Incident</h1>
			<p class="text-gray-600 dark:text-gray-300">
				Help us keep our charging network running smoothly by reporting instances where a car hogged a charger without using it.
			</p>
		</div>

		<div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 md:p-8 mb-6">
			<HoggingReportForm />
		</div>

		<div class="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
			<h3 class="font-semibold text-blue-900 dark:text-blue-100 mb-2">How it works:</h3>
			<ul class="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-disc list-inside">
				<li>Submit a report with the car's license plate, location, and a photo as proof</li>
				<li>Our team reviews the report to ensure quality and accuracy</li>
				<li>Approved reports are tallied and visible on our public hogger leaderboard</li>
				<li>Plates appearing 2+ times are considered repeat hoggers</li>
				<li>This helps us identify and address chronic hogging behavior</li>
			</ul>
		</div>
	</div>
</div>
