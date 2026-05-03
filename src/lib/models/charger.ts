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
