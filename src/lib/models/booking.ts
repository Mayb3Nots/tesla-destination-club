export enum BookingStatus {
	Pending = 'pending',
	Active = 'active',
	Completed = 'completed',
	Cancelled = 'cancelled',
	NoShow = 'no_show'
}

export interface Booking {
	id: string;
	userId: string;
	userEmail: string;
	userDisplayName: string;
	chargerId: string;
	chargerName: string;
	bayLocation?: string;
	bayNames?: string[];
	bayName?: string; // The specific bay the user selected
	status: BookingStatus;
	startTime: string;
	endTime: string;
	estimatedMinutes: number;
	checkedInAt?: string;
	checkedOutAt?: string;
	createdAt: string;
	updatedAt: string;
}
