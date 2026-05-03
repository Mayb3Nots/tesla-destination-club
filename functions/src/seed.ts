export interface SeedCharger {
	name: string;
	address: string;
	latitude: number;
	longitude: number;
	totalPorts: number;
	bayLocation?: string;
	bayNames?: string[];
	createdAt: string;
}

export const SEED_CHARGERS: SeedCharger[] = [

	{
		name: "The Gardens Mall",
		address: "59, Jalan Tun Razak, 59100 Kuala Lumpur",
		latitude: 3.1449,
		longitude: 101.7135,
		totalPorts: 1,
		bayLocation: "LG Floor, near entrance C",
		bayNames: ["Bay 1"],
		createdAt: new Date().toISOString(),
	},

	{
		name: "IOI City Mall (Normal Parking)",
		address:
			"No 2, Lebuh IRC, IOI Resort City, 62502 Putrajaya, Selangor",
		latitude: 2.9456,
		longitude: 101.6907,
		totalPorts: 1,
		bayLocation: "B1, Section A",
		bayNames: ["Bay A1"],
		createdAt: new Date().toISOString(),
	},
	{
		name: "IOI City Mall (Premier Car Park)",
		address:
			"IOI City Mall, Lebuh IRC, IOI Resort City, 62502 Putrajaya, Selangor",
		latitude: 2.9453,
		longitude: 101.6902,
		totalPorts: 6,
		bayLocation: "B2, Premier Zone",
		bayNames: ["Bay P1", "Bay P2", "Bay P3", "Bay P4", "Bay P5", "Bay P6"],
		createdAt: new Date().toISOString(),
	},
	{
		name: "Pavilion Bukit Jalil",
		address: "No 2, Persiaran Jalil, Bukit Jalil, 57000 Kuala Lumpur",
		latitude: 3.0546,
		longitude: 101.6908,
		totalPorts: 2,
		bayLocation: "B1, near Lift Lobby B",
		bayNames: ["Bay 1", "Bay 2"],
		createdAt: new Date().toISOString(),
	},
	{
		name: "Sunway Velocity",
		address: "No 1, Jalan Kuchai, 58200 Kuala Lumpur",
		latitude: 3.0936,
		longitude: 101.7146,
		totalPorts: 6,
		bayLocation: "B1, Zone C",
		bayNames: ["Bay C1", "Bay C2", "Bay C3", "Bay C4", "Bay C5", "Bay C6"],
		createdAt: new Date().toISOString(),
	},
];
