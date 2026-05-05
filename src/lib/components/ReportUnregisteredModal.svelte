<script lang="ts">
	import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
	import { getAuth } from 'firebase/auth';
	import CoreButton from './CoreButton.svelte';
	import { submitUnregisteredChargeReport } from '$lib/firebase/firestore.svelte';
	import type { Charger } from '$lib/models/charger';

	interface Props {
		charger: Charger;
		onClose: () => void;
	}

	let { charger, onClose }: Props = $props();

	let plateNumber = $state('');
	let bayName = $state('');
	let estimatedDurationMinutes = $state<number | null>(null);
	let photoFile = $state<File | null>(null);
	let photoPreviewUrl = $state<string | null>(null);

	let submitting = $state(false);
	let error = $state<string | null>(null);
	let success = $state(false);

	function handlePhotoSelect(event: Event) {
		const target = event.target as HTMLInputElement;
		const file = target.files?.[0];
		if (!file) return;

		// Validate file size (max 5MB)
		if (file.size > 5 * 1024 * 1024) {
			error = 'Photo must be less than 5MB';
			return;
		}

		// Validate file type
		if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
			error = 'Only JPG, PNG, and WebP images are supported';
			return;
		}

		photoFile = file;
		error = null;

		// Show preview
		const reader = new FileReader();
		reader.onload = (e) => {
			photoPreviewUrl = e.target?.result as string;
		};
		reader.readAsDataURL(file);
	}

	function removePhoto() {
		photoFile = null;
		photoPreviewUrl = null;
	}

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		error = null;
		success = false;

		submitting = true;

		try {
			const auth = getAuth();
			const user = auth.currentUser;
			if (!user) {
				error = 'You must be signed in to submit a report';
				submitting = false;
				return;
			}

			// Upload photo if provided
			let photoStoragePath: string | undefined;
			if (photoFile) {
				const storage = getStorage();
				const path = `unregistered_charges/${Date.now()}_${photoFile.name}`;
				const photoRef = ref(storage, path);
				await uploadBytes(photoRef, photoFile);
				await getDownloadURL(photoRef);
				photoStoragePath = path;
			}

			// Submit report
			const result = await submitUnregisteredChargeReport({
				chargerId: charger.id,
				chargerName: charger.name,
				plateNumber: plateNumber.toUpperCase().trim() || undefined,
				bayName: bayName.trim() || undefined,
				estimatedDurationMinutes: estimatedDurationMinutes || undefined,
				photoStoragePath
			});

			if (result.success) {
				success = true;
				// Auto-close after a short delay
				setTimeout(() => {
					onClose();
				}, 1500);
			}
		} catch (err) {
			console.error('Error submitting report:', err);
			error = err instanceof Error ? err.message : 'Failed to submit report. Please try again.';
		} finally {
			submitting = false;
		}
	}

	function handleBackdropClick(e: MouseEvent) {
		if (e.target === e.currentTarget) {
			onClose();
		}
	}
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	class="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4"
	onclick={handleBackdropClick}
	onkeydown={() => {}}
>
	<div class="w-full max-w-lg rounded-2xl border border-border bg-surface-elevated shadow-2xl shadow-black/40 max-h-[85vh] overflow-y-auto">
		<!-- Header -->
		<div class="flex items-center justify-between border-b border-border px-6 py-4">
			<div>
				<h2 class="font-display text-lg font-bold text-text-primary">Unregistered Charger</h2>
				<p class="text-sm text-text-secondary">{charger.name}</p>
			</div>
			<button
				onclick={onClose}
				aria-label="Close"
				class="flex h-8 w-8 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-surface-overlay hover:text-text-primary"
			>
				<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<path d="M18 6 6 18" /><path d="m6 6 12 12" />
				</svg>
			</button>
		</div>

		<!-- Body -->
		<form onsubmit={handleSubmit} class="space-y-5 px-6 py-5">
			{#if success}
				<div class="rounded-lg bg-accent-green/10 p-4 text-center">
					<p class="font-semibold text-accent-green">✓ Report submitted</p>
					<p class="mt-1 text-sm text-accent-green/80">Thanks! Other users will be notified that this charger is in use.</p>
				</div>
			{:else}
				{#if error}
					<div class="rounded-lg bg-tesla-red/10 p-3">
						<p class="text-sm text-tesla-red">{error}</p>
					</div>
				{/if}

				<p class="text-sm text-text-secondary">
					Report that a car is currently charging here without a booking. All fields are optional.
				</p>

				<!-- License Plate (Optional) -->
				<div>
					<label for="uc-plate" class="mb-1.5 block text-sm font-medium text-text-secondary">
						License Plate <span class="text-text-muted">(optional)</span>
					</label>
					<input
						id="uc-plate"
						type="text"
						placeholder="e.g., ABC 1234"
						bind:value={plateNumber}
						disabled={submitting}
						class="w-full rounded-lg border border-border bg-surface-overlay px-3 py-2 text-sm text-text-primary placeholder-text-muted focus:border-accent-blue focus:outline-none focus:ring-2 focus:ring-accent-blue/20 disabled:opacity-50"
						maxlength="20"
					/>
				</div>

				<!-- Bay/Port (Optional) -->
				<div>
					<label for="uc-bay" class="mb-1.5 block text-sm font-medium text-text-secondary">
						Bay / Port <span class="text-text-muted">(optional)</span>
					</label>
					{#if charger.bayNames && charger.bayNames.length > 0}
						<select
							id="uc-bay"
							bind:value={bayName}
							disabled={submitting}
							class="w-full rounded-lg border border-border bg-surface-overlay px-3 py-2 text-sm text-text-primary focus:border-accent-blue focus:outline-none focus:ring-2 focus:ring-accent-blue/20 disabled:opacity-50"
						>
							<option value="">Not sure</option>
							{#each charger.bayNames as name}
								<option value={name}>{name}</option>
							{/each}
						</select>
					{:else}
						<input
							id="uc-bay"
							type="text"
							placeholder="e.g., Bay 1"
							bind:value={bayName}
							disabled={submitting}
							class="w-full rounded-lg border border-border bg-surface-overlay px-3 py-2 text-sm text-text-primary placeholder-text-muted focus:border-accent-blue focus:outline-none focus:ring-2 focus:ring-accent-blue/20 disabled:opacity-50"
							maxlength="50"
						/>
					{/if}
				</div>

				<!-- Estimated Duration (Optional) -->
				<div>
					<label for="uc-duration" class="mb-1.5 block text-sm font-medium text-text-secondary">
						Est. charging duration <span class="text-text-muted">(optional)</span>
					</label>
					<div class="flex items-center gap-2">
						<input
							id="uc-duration"
							type="number"
							min="1"
							max="1440"
							placeholder="e.g., 30"
							bind:value={estimatedDurationMinutes}
							disabled={submitting}
							class="flex-1 rounded-lg border border-border bg-surface-overlay px-3 py-2 text-sm text-text-primary placeholder-text-muted focus:border-accent-blue focus:outline-none focus:ring-2 focus:ring-accent-blue/20 disabled:opacity-50"
						/>
						<span class="text-sm text-text-muted">minutes</span>
					</div>
				</div>

				<!-- Photo Upload (Optional) -->
				<div>
					<label for="uc-photo-upload" class="mb-1.5 block text-sm font-medium text-text-secondary">
						Photo proof <span class="text-text-muted">(optional)</span>
					</label>
					<div class="rounded-lg border-2 border-dashed border-border p-4 text-center">
						{#if photoPreviewUrl}
							<div class="relative inline-block">
								<img src={photoPreviewUrl} alt="Preview" class="h-32 w-auto rounded-lg" />
								<button
									type="button"
									onclick={removePhoto}
									class="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-tesla-red text-white hover:bg-tesla-red-light"
								>
									×
								</button>
							</div>
							<p class="mt-2 text-xs text-text-muted">{photoFile?.name}</p>
						{:else}
							<input
								id="uc-photo-upload"
								type="file"
								accept="image/jpeg,image/png,image/webp"
								onchange={handlePhotoSelect}
								disabled={submitting}
								class="hidden"
							/>
							<label for="uc-photo-upload" class="cursor-pointer">
								<span class="text-sm font-medium text-text-secondary hover:text-text-primary">Click to upload</span>
								<span class="mt-1 block text-xs text-text-muted">JPG, PNG, WebP up to 5MB</span>
							</label>
						{/if}
					</div>
				</div>

				<!-- Actions -->
				<div class="flex gap-3 pt-1">
					<CoreButton
						type="button"
						variant="ghost"
						onclick={onClose}
						disabled={submitting}
						class="flex-1"
					>
						Cancel
					</CoreButton>
					<CoreButton
						type="submit"
						variant="primary"
						disabled={submitting}
						class="flex-1"
					>
						{submitting ? 'Submitting...' : 'Submit Report'}
					</CoreButton>
				</div>
			{/if}
		</form>
	</div>
</div>
