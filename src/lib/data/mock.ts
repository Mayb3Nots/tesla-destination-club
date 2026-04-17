import type { ChargerLocation } from '$lib/types';

function minutesFromNow(mins: number): string {
	return new Date(Date.now() + mins * 60_000).toISOString();
}

export const mockLocations: ChargerLocation[] = [
	{
		id: 'tdc-001',
		name: 'Pavilion KL',
		address: '168, Jalan Bukit Bintang, 55100 Kuala Lumpur',
		lat: 3.1458,
		lng: 101.7121,
		distance: 1.2,
		totalSlots: 4,
		slots: [
			{ id: 1, status: 'charging', user: 'Ahmad', estimatedDone: minutesFromNow(35) },
			{ id: 2, status: 'available' },
			{ id: 3, status: 'charging', user: 'Sarah', estimatedDone: minutesFromNow(22) },
			{ id: 4, status: 'offline' },
		],
		queue: { position: 0, total: 0, estimatedWait: '0 min' },
		lastUpdated: new Date(),
	},
	{
		id: 'tdc-002',
		name: 'TRX Exchange',
		address: 'Kuala Lumpur, 55188',
		lat: 3.1542,
		lng: 101.7145,
		distance: 2.5,
		totalSlots: 6,
		slots: [
			{ id: 1, status: 'charging', user: 'Jason', estimatedDone: minutesFromNow(50) },
			{ id: 2, status: 'charging', user: 'Mei Ling', estimatedDone: minutesFromNow(15) },
			{ id: 3, status: 'charging', user: 'Raj', estimatedDone: minutesFromNow(40) },
			{ id: 4, status: 'charging', user: 'Tom', estimatedDone: minutesFromNow(28) },
			{ id: 5, status: 'charging', user: 'Nina', estimatedDone: minutesFromNow(55) },
			{ id: 6, status: 'charging', user: 'Wei', estimatedDone: minutesFromNow(10) },
		],
		queue: { position: 3, total: 5, estimatedWait: '~45 min' },
		lastUpdated: new Date(),
	},
	{
		id: 'tdc-003',
		name: 'Sunway Pyramid',
		address: '3, Jalan PJS 11/15, Bandar Sunway, 47500 Subang Jaya',
		lat: 3.0732,
		lng: 101.6079,
		distance: 15.8,
		totalSlots: 2,
		slots: [
			{ id: 1, status: 'available' },
			{ id: 2, status: 'available' },
		],
		queue: { position: 0, total: 0, estimatedWait: '0 min' },
		lastUpdated: new Date(),
	},
	{
		id: 'tdc-004',
		name: 'IOI City Mall',
		address: 'IOI Resort City, 62502 Putrajaya',
		lat: 2.9738,
		lng: 101.7182,
		distance: 28.4,
		totalSlots: 3,
		slots: [
			{ id: 1, status: 'charging', user: 'Kumar', estimatedDone: minutesFromNow(20) },
			{ id: 2, status: 'available' },
			{ id: 3, status: 'available' },
		],
		queue: { position: 0, total: 1, estimatedWait: '~15 min' },
		lastUpdated: new Date(),
	},
	{
		id: 'tdc-005',
		name: 'Gurney Plaza',
		address: "170, Gurney Drive, 10250 George Town, Penang",
		lat: 5.4315,
		lng: 100.3128,
		distance: 345.0,
		totalSlots: 2,
		slots: [
			{ id: 1, status: 'offline' },
			{ id: 2, status: 'offline' },
		],
		queue: { position: 0, total: 0, estimatedWait: '—' },
		lastUpdated: new Date(),
	},
];
