import { mockLocations } from '$lib/data/mock';
import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';

export const load: PageLoad = ({ params }) => {
	const locationId = params.id;
	const location = mockLocations.find(l => l.id === locationId);

	if (!location) {
		throw error(404, 'Charger location not found');
	}

	return { locationId };
};
