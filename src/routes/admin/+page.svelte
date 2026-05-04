<script lang="ts">
	import { onMount } from 'svelte';
	import {
		usePendingReports,
		approveHoggingReport,
		rejectHoggingReport
	} from '$lib/firebase/firestore.svelte';
	import type { HoggingReport } from '$lib/models/hoggingReport';
	import { getStorage, ref, getDownloadURL } from 'firebase/storage';

	const { reports, loading, subscribe } = usePendingReports();

	let actionLoading = $state<Record<string, boolean>>({});
	let actionError = $state<Record<string, string>>({});
	let rejectionReasons = $state<Record<string, string>>({});
	let showRejectForm = $state<Record<string, boolean>>({});
	let photoUrls = $state<Record<string, string>>({});

	let unsubscribe: (() => void) | null = null;

	onMount(() => {
		unsubscribe = subscribe() ?? null;
		return () => {
			unsubscribe?.();
		};
	});

	async function handleApprove(report: HoggingReport) {
		actionLoading[report.id] = true;
		actionError[report.id] = '';
		try {
			await approveHoggingReport(report.id);
		} catch (err) {
			actionError[report.id] = err instanceof Error ? err.message : 'Failed to approve';
		} finally {
			actionLoading[report.id] = false;
		}
	}

	async function handleReject(report: HoggingReport) {
		const reason = rejectionReasons[report.id]?.trim();
		if (!reason) {
			actionError[report.id] = 'Please provide a rejection reason';
			return;
		}
		actionLoading[report.id] = true;
		actionError[report.id] = '';
		try {
			await rejectHoggingReport(report.id, reason);
			showRejectForm[report.id] = false;
			rejectionReasons[report.id] = '';
		} catch (err) {
			actionError[report.id] = err instanceof Error ? err.message : 'Failed to reject';
		} finally {
			actionLoading[report.id] = false;
		}
	}

	async function loadPhotoUrl(report: HoggingReport) {
		if (photoUrls[report.id]) return;
		try {
			const storage = getStorage();
			const photoRef = ref(storage, report.photoStoragePath);
			const url = await getDownloadURL(photoRef);
			photoUrls[report.id] = url;
		} catch {
			photoUrls[report.id] = 'error';
		}
	}

	function formatDate(iso: string): string {
		return new Date(iso).toLocaleDateString('en-MY', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}
</script>

<svelte:head>
	<title>Admin - Hogging Reports - Tesla Destination Club</title>
</svelte:head>

<div class="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
	<!-- Header -->
	<div class="mb-8">
		<h1 class="text-2xl font-bold text-text-primary md:text-3xl">Hogging Reports</h1>
		<p class="mt-1 text-sm text-text-secondary">
			Review and approve or reject submitted hogging reports.
		</p>
	</div>

	<!-- Content -->
	{#if loading}
		<div class="rounded-lg border border-border bg-surface-elevated p-8 text-center">
			<div
				class="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-border border-t-accent-blue"
			></div>
			<p class="text-text-secondary">Loading pending reports...</p>
		</div>
	{:else if reports.length === 0}
		<div class="rounded-lg border border-border bg-surface-elevated p-8 text-center">
			<div class="mx-auto mb-4 text-4xl">🎉</div>
			<p class="text-lg font-medium text-text-primary">All caught up!</p>
			<p class="mt-1 text-sm text-text-secondary">No pending reports to review.</p>
		</div>
	{:else}
		<div class="space-y-4">
			{#each reports as report (report.id)}
				<div class="rounded-lg border border-border bg-surface-elevated p-4 md:p-6">
					<div class="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
						<!-- Report details -->
						<div class="flex-1 space-y-3">
							<div class="flex flex-wrap items-center gap-2">
								<span
									class="inline-flex items-center rounded-full bg-accent-blue/10 px-2.5 py-0.5 text-xs font-semibold text-accent-blue"
								>
									{report.status.toUpperCase()}
								</span>
								<span class="text-xs text-text-muted">{report.id}</span>
							</div>

							<div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
								<div>
									<p class="text-xs font-medium text-text-muted uppercase tracking-wider">
										Plate Number
									</p>
									<p class="font-mono text-lg font-bold text-text-primary">
										{report.plateNumber}
									</p>
								</div>
								<div>
									<p class="text-xs font-medium text-text-muted uppercase tracking-wider">
										Charger
									</p>
									<p class="text-sm font-medium text-text-primary">
										{report.chargerName}
									</p>
								</div>
								<div>
									<p class="text-xs font-medium text-text-muted uppercase tracking-wider">
										Reported At
									</p>
									<p class="text-sm text-text-secondary">{formatDate(report.reportedAt)}</p>
								</div>
								{#if report.hoggingDurationMinutes}
									<div>
										<p
											class="text-xs font-medium text-text-muted uppercase tracking-wider"
										>
											Duration
										</p>
										<p class="text-sm text-text-secondary">
											{report.hoggingDurationMinutes} min
										</p>
									</div>
								{/if}
							</div>

							{#if report.location}
								<div>
									<p class="text-xs font-medium text-text-muted uppercase tracking-wider">
										Location Detail
									</p>
									<p class="text-sm text-text-secondary">{report.location}</p>
								</div>
							{/if}

							<div>
								<p class="text-xs font-medium text-text-muted uppercase tracking-wider">
									Reported By
								</p>
								<p class="text-sm text-text-secondary">
									{report.reportedByDisplayName || 'Unknown'}
									{#if report.reportedByEmail}
										<span class="text-text-muted">({report.reportedByEmail})</span>
									{/if}
								</p>
							</div>

							<!-- Photo -->
							<div>
								<p class="text-xs font-medium text-text-muted uppercase tracking-wider mb-1">
									Proof Photo
								</p>
								{#if photoUrls[report.id] === 'error'}
									<p class="text-sm text-red-500">Failed to load photo</p>
								{:else if photoUrls[report.id]}
									<a
										href={photoUrls[report.id]}
										target="_blank"
										rel="noopener noreferrer"
									>
										<img
											src={photoUrls[report.id]}
											alt="Hogging proof"
											class="h-32 w-auto rounded-lg border border-border object-cover"
										/>
									</a>
								{:else}
									<button
										onclick={() => loadPhotoUrl(report)}
										class="text-sm text-accent-blue hover:underline"
									>
										Load Photo
									</button>
								{/if}
							</div>
						</div>

						<!-- Actions -->
						<div class="flex flex-col gap-2 md:min-w-[180px]">
							{#if actionError[report.id]}
								<p class="text-xs text-red-500">{actionError[report.id]}</p>
							{/if}

							{#if showRejectForm[report.id]}
								<div class="space-y-2">
									<textarea
										bind:value={rejectionReasons[report.id]}
										placeholder="Reason for rejection..."
										rows="3"
										class="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-accent-blue focus:outline-none"
									></textarea>
									<div class="flex gap-2">
										<button
											onclick={() => handleReject(report)}
											disabled={actionLoading[report.id]}
											class="flex-1 rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
										>
											{#if actionLoading[report.id]}
												Confirming...
											{:else}
												Confirm Reject
											{/if}
										</button>
										<button
											onclick={() => (showRejectForm[report.id] = false)}
											class="rounded-lg border border-border px-3 py-2 text-sm text-text-secondary hover:bg-surface-overlay"
										>
											Cancel
										</button>
									</div>
								</div>
							{:else}
								<button
									onclick={() => handleApprove(report)}
									disabled={actionLoading[report.id]}
									class="rounded-lg bg-accent-green px-4 py-2.5 text-sm font-semibold text-white hover:bg-accent-green/90 disabled:opacity-50"
								>
									{#if actionLoading[report.id]}
										Approving...
									{:else}
										✓ Approve
									{/if}
								</button>
								<button
									onclick={() => (showRejectForm[report.id] = true)}
									disabled={actionLoading[report.id]}
									class="rounded-lg border border-red-300 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-100 disabled:opacity-50 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30"
								>
									✕ Reject
								</button>
							{/if}
						</div>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>
