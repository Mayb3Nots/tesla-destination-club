export type UnregisteredChargeReportStatus = 'active' | 'resolved' | 'expired';

export interface UnregisteredChargeReport {
    id: string;
    chargerId: string;
    chargerName: string;
    plateNumber?: string; // optional
    bayName?: string; // optional — which bay/port
    estimatedDurationMinutes?: number; // optional — how long they've been charging
    photoStoragePath?: string; // optional photo proof
    reportedByUserId: string;
    reportedByEmail?: string;
    reportedByDisplayName?: string;
    reportedAt: string; // ISO 8601
    status: UnregisteredChargeReportStatus;
    resolvedAt?: string; // ISO 8601 — when marked resolved
    expiresAt: string; // ISO 8601 — auto-expire after some time
    createdAt: string; // ISO 8601
    updatedAt: string; // ISO 8601
}
