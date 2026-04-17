export interface ChargerLocation {
	id: string;
	name: string;
	address: string;
	lat: number;
	lng: number;
	distance: number; // km from user
	totalSlots: number;
	slots: ChargerSlot[];
	queue: QueueInfo;
	lastUpdated: Date;
}

export interface ChargerSlot {
	id: number;
	status: 'available' | 'charging' | 'offline';
	user?: string; // who's charging
	estimatedDone?: string; // ISO time when they'll be done
}

export interface QueueInfo {
	position: number; // user's position (0 = not in queue)
	total: number; // people waiting
	estimatedWait: string; // human-readable
}

export type LocationStatus = 'available' | 'busy' | 'full' | 'offline';
