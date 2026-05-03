export interface Charger {
	id: string;
	name: string;
	address: string;
	latitude: number;
	longitude: number;
	totalPorts: number;
	bayLocation?: string;
	bayNames?: string[];
	createdAt: string;
}

/** Get bay names, falling back to "Bay 1", "Bay 2", etc. based on totalPorts */
export function getBayNames(charger: Charger): string[] {
	if (charger.bayNames && charger.bayNames.length > 0) {
		return charger.bayNames;
	}
	return Array.from({ length: charger.totalPorts }, (_, i) => `Bay ${i + 1}`);
}

/** Get bay location, falling back to single bay name or "Multiple bays available" */
export function getBayLocation(charger: Charger): string {
	if (charger.bayLocation) {
		return charger.bayLocation;
	}
	if (charger.totalPorts === 1) {
		return getBayNames(charger)[0];
	}
	return 'Multiple bays available';
}
