/**
 * Tesla vehicle data for smart dropdown selections.
 *
 * Models are keyed by year range so the "Model" dropdown only shows
 * models that were actually available in the selected year.
 * Colors are keyed by model so only valid color options appear.
 */

export interface TeslaModelInfo {
    name: string;
    startYear: number;
    endYear: number | null; // null = still in production
}

export interface TeslaColor {
    name: string;
    hex: string; // for colour swatch preview
}

// ── Tesla Models ──────────────────────────────────────────────────────────────

export const TESLA_MODELS: TeslaModelInfo[] = [
    { name: 'Model S', startYear: 2012, endYear: null },
    { name: 'Model X', startYear: 2015, endYear: null },
    { name: 'Model 3', startYear: 2017, endYear: null },
    { name: 'Model Y', startYear: 2020, endYear: null },
    { name: 'Cybertruck', startYear: 2024, endYear: null },
    { name: 'Model S Plaid', startYear: 2021, endYear: null },
    { name: 'Model X Plaid', startYear: 2021, endYear: null },
    { name: 'Model 3 Performance', startYear: 2018, endYear: null },
    { name: 'Model Y Performance', startYear: 2020, endYear: null },
    { name: 'Roadster', startYear: 2008, endYear: 2012 },
    { name: 'Roadster (2nd Gen)', startYear: 2026, endYear: null },
    { name: 'Semi', startYear: 2025, endYear: null },
];

/** Returns models available for a given year, sorted alphabetically. */
export function getModelsForYear(year: number): string[] {
    return TESLA_MODELS.filter(
        (m) => m.startYear <= year && (m.endYear === null || m.endYear >= year)
    )
        .map((m) => m.name)
        .sort((a, b) => a.localeCompare(b));
}

// ── Tesla Colors ──────────────────────────────────────────────────────────────

const SHARED_COLORS: TeslaColor[] = [
    { name: 'Pearl White Multi-Coat', hex: '#F5F5F0' },
    { name: 'Solid Black', hex: '#1A1A1A' },
    { name: 'Deep Blue Metallic', hex: '#1E3A5F' },
    { name: 'Silver Metallic', hex: '#A8A9AD' },
    { name: 'Red Multi-Coat', hex: '#CC0000' },
    { name: 'Midnight Cherry Red', hex: '#7B1E2F' },
    { name: 'Quicksilver', hex: '#8C8C8C' },
    { name: 'Starbase Gray', hex: '#4A4A4A' },
];

const MODEL_S_COLORS: TeslaColor[] = [
    { name: 'Pearl White Multi-Coat', hex: '#F5F5F0' },
    { name: 'Solid Black', hex: '#1A1A1A' },
    { name: 'Deep Blue Metallic', hex: '#1E3A5F' },
    { name: 'Silver Metallic', hex: '#A8A9AD' },
    { name: 'Red Multi-Coat', hex: '#CC0000' },
    { name: 'Ultra Red', hex: '#B91C1C' },
];

const MODEL_3_COLORS: TeslaColor[] = [
    { name: 'Pearl White Multi-Coat', hex: '#F5F5F0' },
    { name: 'Solid Black', hex: '#1A1A1A' },
    { name: 'Deep Blue Metallic', hex: '#1E3A5F' },
    { name: 'Silver Metallic', hex: '#A8A9AD' },
    { name: 'Red Multi-Coat', hex: '#CC0000' },
    { name: 'Midnight Cherry Red', hex: '#7B1E2F' },
    { name: 'Stealth Grey', hex: '#5A5A5A' },
];

const MODEL_X_COLORS: TeslaColor[] = [
    { name: 'Pearl White Multi-Coat', hex: '#F5F5F0' },
    { name: 'Solid Black', hex: '#1A1A1A' },
    { name: 'Deep Blue Metallic', hex: '#1E3A5F' },
    { name: 'Silver Metallic', hex: '#A8A9AD' },
    { name: 'Red Multi-Coat', hex: '#CC0000' },
];

const MODEL_Y_COLORS: TeslaColor[] = [
    { name: 'Pearl White Multi-Coat', hex: '#F5F5F0' },
    { name: 'Solid Black', hex: '#1A1A1A' },
    { name: 'Deep Blue Metallic', hex: '#1E3A5F' },
    { name: 'Quicksilver', hex: '#8C8C8C' },
    { name: 'Red Multi-Coat', hex: '#CC0000' },
    { name: 'Midnight Cherry Red', hex: '#7B1E2F' },
    { name: 'Stealth Grey', hex: '#5A5A5A' },
];

const CYBERTRUCK_COLORS: TeslaColor[] = [
    { name: 'Brushed Stainless Steel', hex: '#C0C0C0' },
    { name: 'Wrapped - Matte Black', hex: '#1A1A1A' },
    { name: 'Wrapped - Satin White', hex: '#E8E8E8' },
    { name: 'Wrapped - Satin Rose Gold', hex: '#B76E79' },
    { name: 'Wrapped - Army Green', hex: '#4B5320' },
    { name: 'Wrapped - Satin Dark Purple', hex: '#3D1F56' },
];

const ROADSTER_COLORS: TeslaColor[] = [
    { name: 'Pearl White Multi-Coat', hex: '#F5F5F0' },
    { name: 'Solid Black', hex: '#1A1A1A' },
    { name: 'Deep Blue Metallic', hex: '#1E3A5F' },
    { name: 'Red Multi-Coat', hex: '#CC0000' },
    { name: 'Electric Blue', hex: '#2D5DA1' },
    { name: 'Vermillion Red', hex: '#E34234' },
    { name: 'Radiant Silver', hex: '#B0B0B0' },
    { name: 'Racing Green', hex: '#004225' },
];

const SEMI_COLORS: TeslaColor[] = [
    { name: 'Brushed Stainless Steel', hex: '#C0C0C0' },
    { name: 'Solid Black', hex: '#1A1A1A' },
    { name: 'Pearl White Multi-Coat', hex: '#F5F5F0' },
];

const COLOR_MAP: Record<string, TeslaColor[]> = {
    'Model S': MODEL_S_COLORS,
    'Model S Plaid': MODEL_S_COLORS,
    'Model 3': MODEL_3_COLORS,
    'Model 3 Performance': MODEL_3_COLORS,
    'Model X': MODEL_X_COLORS,
    'Model X Plaid': MODEL_X_COLORS,
    'Model Y': MODEL_Y_COLORS,
    'Model Y Performance': MODEL_Y_COLORS,
    'Cybertruck': CYBERTRUCK_COLORS,
    'Roadster': ROADSTER_COLORS,
    'Roadster (2nd Gen)': ROADSTER_COLORS,
    'Semi': SEMI_COLORS,
};

/** Returns the available colours for a given Tesla model. Falls back to shared colours. */
export function getColorsForModel(model: string): TeslaColor[] {
    return COLOR_MAP[model] ?? SHARED_COLORS;
}

// ── Year Range ────────────────────────────────────────────────────────────────

const OLDEST_TESLA_YEAR = 2008;

/** Returns a list of valid production years (newest first). */
export function getYearOptions(): number[] {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: currentYear - OLDEST_TESLA_YEAR + 1 }, (_, i) => currentYear - i);
}
