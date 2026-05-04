<script lang="ts">
	import { onMount } from 'svelte';
	import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
	import { getAuth } from 'firebase/auth';
	import CoreButton from './CoreButton.svelte';
	import { useChargers, submitHoggingReport } from '$lib/firebase/firestore.svelte';
	import type { Charger } from '$lib/models/charger';

	let plateNumber = $state('');
	let selectedChargerId = $state('');
	let selectedChargerName = $state('');
	let location = $state('');
	let hoggingDurationMinutes = $state<number | null>(null);
	let photoFile = $state<File | null>(null);
	let photoPreviewUrl = $state<string | null>(null);

	let submitting = $state(false);
	let error = $state<string | null>(null);
	let success = $state(false);

	const { chargers, loading: chargersLoading, fetch: fetchChargers } = useChargers();

	onMount(() => {
		fetchChargers();
	});

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

		// Validation
		if (!plateNumber.trim()) {
			error = 'Please enter a license plate number';
			return;
		}
		if (!selectedChargerId) {
			error = 'Please select a charger location';
			return;
		}
		if (!photoFile) {
			error = 'Please upload a photo as proof';
			return;
		}

		submitting = true;

		try {
			const auth = getAuth();
			const user = auth.currentUser;
			if (!user) {
				error = 'You must be signed in to submit a report';
				submitting = false;
				return;
			}

			// Upload photo to Firebase Storage
			const storage = getStorage();
			const photoPath = `hogging_reports/${Date.now()}_${photoFile.name}`;
			const photoRef = ref(storage, photoPath);
			await uploadBytes(photoRef, photoFile);
			const photoUrl = await getDownloadURL(photoRef);

			// Submit report
			const result = await submitHoggingReport({
				plateNumber: plateNumber.toUpperCase().trim(),
				chargerId: selectedChargerId,
				chargerName: selectedChargerName,
				location: location.trim() || undefined,
				hoggingDurationMinutes: hoggingDurationMinutes || undefined,
				photoStoragePath: photoPath,
				reportedAt: new Date().toISOString()
			});

			if (result.success) {
				success = true;
				// Reset form
				plateNumber = '';
				selectedChargerId = '';
				selectedChargerName = '';
				location = '';
				hoggingDurationMinutes = null;
				photoFile = null;
				photoPreviewUrl = null;

				// Clear success message after 3 seconds
				setTimeout(() => {
					success = false;
				}, 3000);
			}
		} catch (err) {
			console.error('Error submitting report:', err);
			error = err instanceof Error ? err.message : 'Failed to submit report. Please try again.';
		} finally {
			submitting = false;
		}
	}

	// Charger selector helper
	function handleChargerSelect(chargerId: string) {
		selectedChargerId = chargerId;
		const selected = chargers.find((c) => c.id === chargerId);
		if (selected) {
			selectedChargerName = selected.name;
		}
	}
</script>

<div class="w-full max-w-2xl mx-auto p-4 md:p-6">
	<form on:submit={handleSubmit} class="space-y-6">
		{#if success}
			<div
				class="p-4 rounded-lg bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
			>
				<p class="font-semibold">✓ Report submitted successfully</p>
				<p class="text-sm mt-1">Thank you for helping keep chargers available! Your report is under review.</p>
			</div>
		{/if}

		{#if error}
			<div class="p-4 rounded-lg bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
				<p class="font-semibold">Error</p>
				<p class="text-sm mt-1">{error}</p>
			</div>
		{/if}

		<!-- License Plate Input -->
		<div>
			<label for="plateNumber" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
				License Plate Number <span class="text-red-500">*</span>
			</label>
			<input
				id="plateNumber"
				type="text"
				placeholder="e.g., ABC 1234"
				bind:value={plateNumber}
				disabled={submitting}
				class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-600 dark:text-white disabled:opacity-50"
				maxlength="20"
			/>
			<p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Enter without spaces or special characters</p>
		</div>

		<!-- Charger Selection -->
		<div>
			<label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
				Charger Location <span class="text-red-500">*</span>
			</label>
			{#if chargersLoading}
				<div class="text-gray-500 dark:text-gray-400 text-sm">Loading chargers...</div>
			{:else}
				<select
					bind:value={selectedChargerId}
					on:change={(e) => handleChargerSelect(e.currentTarget.value)}
					disabled={submitting}
					class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-600 dark:text-white disabled:opacity-50"
				>
					<option value="">-- Select a charger --</option>
					{#each chargers as charger (charger.id)}
						<option value={charger.id}>{charger.name} ({charger.address})</option>
					{/each}
				</select>
			{/if}
		</div>

		<!-- Location (Optional) -->
		<div>
			<label for="location" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
				Specific Location/Bay (Optional)
			</label>
			<input
				id="location"
				type="text"
				placeholder="e.g., Bay 3, Near entrance"
				bind:value={location}
				disabled={submitting}
				class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-600 dark:text-white disabled:opacity-50"
				maxlength="100"
			/>
		</div>

		<!-- Duration (Optional) -->
		<div>
			<label for="duration" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
				How long the car hogged the charger (Optional)
			</label>
			<div class="flex gap-2">
				<input
					id="duration"
					type="number"
					min="1"
					max="1440"
					placeholder="Duration in minutes"
					bind:value={hoggingDurationMinutes}
					disabled={submitting}
					class="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-600 dark:text-white disabled:opacity-50"
				/>
				<span class="text-sm text-gray-500 dark:text-gray-400 py-2">minutes</span>
			</div>
		</div>

		<!-- Photo Upload -->
		<div>
			<label for="photo" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
				Photo (Proof) <span class="text-red-500">*</span>
			</label>
			<div class="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center dark:border-gray-600">
				{#if photoPreviewUrl}
					<div class="relative inline-block">
						<img src={photoPreviewUrl} alt="Preview" class="h-40 w-auto rounded-lg" />
						<button
							type="button"
							on:click={removePhoto}
							class="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600"
						>
							×
						</button>
					</div>
					<p class="text-sm text-gray-600 dark:text-gray-400 mt-3">{photoFile?.name}</p>
				{:else}
					<input
						id="photo"
						type="file"
						accept="image/jpeg,image/png,image/webp"
						on:change={handlePhotoSelect}
						disabled={submitting}
						class="hidden"
					/>
					<label
						for="photo"
						class="cursor-pointer flex flex-col items-center gap-2"
					>
						<svg
							class="w-8 h-8 text-gray-400"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M12 4v16m8-8H4"
							/>
						</svg>
						<span class="text-sm font-medium text-gray-600 dark:text-gray-400">Click to upload photo</span>
						<span class="text-xs text-gray-500 dark:text-gray-500">JPG, PNG, WebP up to 5MB</span>
					</label>
				{/if}
			</div>
		</div>

		<!-- Submit Button -->
		<div class="flex gap-2">
			<CoreButton
				type="submit"
				variant="primary"
				disabled={submitting || chargersLoading}
				class="flex-1"
			>
				{submitting ? 'Submitting...' : 'Submit Report'}
			</CoreButton>
		</div>

		<p class="text-xs text-gray-600 dark:text-gray-400 text-center">
			Reports go through moderation before appearing on the leaderboard
		</p>
	</form>
</div>

<style>
	input[type='text'],
	input[type='number'],
	select {
		font-family: inherit;
	}

	input:disabled,
	select:disabled {
		cursor: not-allowed;
	}
</style>
