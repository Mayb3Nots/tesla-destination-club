export interface SeedCharger {
	name: string;
	address: string;
	latitude: number;
	longitude: number;
	totalPorts: number;
	createdAt: string;
}

export const SEED_CHARGERS: SeedCharger[] = [

	{
		name: "The Gardens Mall",
		address: "59, Jalan Tun Razak, 59100 Kuala Lumpur",
		latitude: 3.1449,
		longitude: 101.7135,
		totalPorts: 1,
		createdAt: new Date().toISOString(),
	},

	{
		name: "IOI City Mall (Normal Parking)",
		address:
			"No 2, Lebuh IRC, IOI Resort City, 62502 Putrajaya, Selangor",
		latitude: 2.9456,
		longitude: 101.6907,
		totalPorts: 1,
		createdAt: new Date().toISOString(),
	},
	{
		name: "IOI City Mall (Premier Car Park)",
		address:
			"IOI City Mall, Lebuh IRC, IOI Resort City, 62502 Putrajaya, Selangor",
		latitude: 2.9453,
		longitude: 101.6902,
		totalPorts: 6,
		createdAt: new Date().toISOString(),
	},
	{
		name: "Pavilion Bukit Jalil",
		address: "No 2, Persiaran Jalil, Bukit Jalil, 57000 Kuala Lumpur",
		latitude: 3.0546,
		longitude: 101.6908,
		totalPorts: 2,
		createdAt: new Date().toISOString(),
	},
	{
		name: "Sunway Velocity",
		address: "No 1, Jalan Kuchai, 58200 Kuala Lumpur",
		latitude: 3.0936,
		longitude: 101.7146,
		totalPorts: 6,
		createdAt: new Date().toISOString(),
	},
];
