export type HoggingReportStatus = 'pending' | 'approved' | 'rejected';

export interface HoggingReport {
  id: string;
  plateNumber: string;
  reportedAt: string; // ISO 8601 date string
  chargerId: string;
  chargerName: string;
  location?: string;
  hoggingDurationMinutes?: number; // 15-180 minutes, optional
  photoStoragePath: string; // Path in Firebase Storage (gs://... or URI)
  reportedByUserId: string;
  reportedByEmail?: string;
  reportedByDisplayName?: string;
  status: HoggingReportStatus;
  approvedByAdminId?: string;
  approvalTimestamp?: string; // ISO 8601
  rejectionReason?: string;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}
