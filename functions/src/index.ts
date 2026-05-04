import { initializeApp } from "firebase-admin/app";
import { setGlobalOptions } from "firebase-functions";
import { onCall, HttpsError, onRequest } from "firebase-functions/v2/https";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { getFirestore } from "firebase-admin/firestore";
import { getMessaging } from "firebase-admin/messaging";
import { CloudTasksClient } from "@google-cloud/tasks";
import * as logger from "firebase-functions/logger";
import { SEED_CHARGERS } from "./seed.js";

initializeApp();
setGlobalOptions({ maxInstances: 10, region: "asia-southeast1" });

const MAX_BOOKING_DURATION_MINUTES = 180;
const MAX_BOOKING_DAYS_AHEAD = 7;
const REGION = "asia-southeast1";

/** Lazy Firestore instance. */
function getDb() {
  return getFirestore();
}

// ── Cloud Tasks Setup ───────────────────────────────────────────────────────
const tasksClient = new CloudTasksClient();

/**
 * Schedules a Cloud Task to process a booking at its end time.
 * The task calls the `processExpiredBooking` HTTP function.
 */
async function scheduleBookingExpiry(chargerId: string, bookingId: string, endTime: string) {
  const projectId = process.env.FIREBASE_CONFIG ?
    JSON.parse(process.env.FIREBASE_CONFIG).projectId :
    process.env.GCLOUD_PROJECT || "tesla-destination-club";

  const queue = process.env.BOOKING_EXPIRY_QUEUE || "booking-expiry";
  const queuePath = tasksClient.queuePath(projectId, REGION, queue);

  // Calculate delay from now until endTime
  const endMs = new Date(endTime).getTime();
  const nowMs = Date.now();
  const delayMs = Math.max(endMs - nowMs, 0); // Clamp to 0 if already past

  const payload = {
    chargerId,
    bookingId,
  };

  const taskName = `booking-expire-${chargerId}-${bookingId}`;

  const task = {
    name: tasksClient.taskPath(projectId, REGION, queue, taskName),
    httpRequest: {
      httpMethod: "POST" as const,
      url: `https://${REGION}-${projectId}.cloudfunctions.net/processExpiredBooking`,
      headers: { "Content-Type": "application/json" },
      body: Buffer.from(JSON.stringify(payload)).toString("base64"),
      oidcToken: {
        serviceAccountEmail: `${projectId}@appspot.gserviceaccount.com`,
      },
    },
    scheduleTime: {
      seconds: Math.floor(nowMs / 1000) + Math.floor(delayMs / 1000),
    },
  };

  await tasksClient.createTask({ parent: queuePath, task });
  logger.info(`Scheduled expiry task for booking ${bookingId} at ${endTime} (delay: ${Math.round(delayMs / 1000)}s)`);
}

// ── Process Expired Booking (called by Cloud Task) ─────────────────────────

export const processExpiredBooking = onRequest(
  { region: REGION, invoker: "private" },
  async (req, res) => {
    // Verify this is called by Cloud Tasks (not a random HTTP request)
    // The "private" invoker setting ensures only authenticated Google Cloud
    // services (like Cloud Tasks) can call this function.
    const { chargerId, bookingId } = req.body;

    if (!chargerId || !bookingId) {
      logger.error("Missing chargerId or bookingId in request body");
      res.status(400).send("Missing chargerId or bookingId");
      return;
    }

    const bookingRef = getDb()
      .collection("chargers")
      .doc(chargerId)
      .collection("bookings")
      .doc(bookingId);

    const bookingDoc = await bookingRef.get();
    if (!bookingDoc.exists) {
      logger.warn(`Booking ${bookingId} not found, skipping.`);
      res.status(200).send("Booking not found");
      return;
    }

    const bookingData = bookingDoc.data()!;

    // Only process if still pending or active (idempotency check)
    if (bookingData.status !== "pending" && bookingData.status !== "active") {
      logger.info(`Booking ${bookingId} already ${bookingData.status}, skipping.`);
      res.status(200).send(`Already ${bookingData.status}`);
      return;
    }

    const now = new Date().toISOString();
    const updates: Record<string, string> = {
      updatedAt: now,
    };

    if (bookingData.status === "active") {
      // User checked in but never checked out — auto complete
      updates.status = "completed";
      if (!bookingData.checkedOutAt) {
        updates.checkedOutAt = now;
      }
    } else {
      // User never checked in — mark as no_show
      updates.status = "no_show";
    }

    await bookingRef.update(updates);
    logger.info(
      `Processed expired booking ${bookingId} (was ${bookingData.status} → ${updates.status})`
    );

    res.status(200).send({ success: true, status: updates.status });
  }
);

export const seedChargers = onCall(async () => {
  const snapshot = await getDb().collection("chargers").limit(1).get();

  if (!snapshot.empty) {
    logger.info("Chargers already seeded, skipping.");
    return { success: true, message: "Chargers already exist." };
  }

  const batch = getDb().batch();
  for (const charger of SEED_CHARGERS) {
    const ref = getDb().collection("chargers").doc();
    batch.set(ref, charger);
  }
  await batch.commit();
  logger.info(`Seeded ${SEED_CHARGERS.length} chargers.`);
  return { success: true, count: SEED_CHARGERS.length };
});

export const createBooking = onCall(async (request) => {
  const { auth } = request;
  if (!auth) {
    throw new HttpsError(
      "unauthenticated",
      "You must be signed in to book a slot."
    );
  }

  const { chargerId, startTime, endTime, bayName } = request.data;
  const userId = auth.uid;
  const userEmail = auth.token?.email || "";
  const userDisplayName = auth.token?.name || userEmail.split("@")[0];

  if (!chargerId || !startTime || !endTime) {
    throw new HttpsError(
      "invalid-argument",
      "Missing required fields: chargerId, startTime, endTime."
    );
  }

  const start = new Date(startTime);
  const end = new Date(endTime);
  const now = new Date();

  if (end <= start) {
    throw new HttpsError(
      "invalid-argument",
      "End time must be after start time."
    );
  }

  const durationMs = end.getTime() - start.getTime();
  const durationMinutes = durationMs / (1000 * 60);

  if (durationMinutes > MAX_BOOKING_DURATION_MINUTES) {
    throw new HttpsError(
      "invalid-argument",
      `Booking cannot exceed ${MAX_BOOKING_DURATION_MINUTES} minutes.`
    );
  }

  if (durationMinutes < 15) {
    throw new HttpsError(
      "invalid-argument",
      "Booking must be at least 15 minutes."
    );
  }

  const maxDate = new Date(
    now.getTime() + MAX_BOOKING_DAYS_AHEAD * 24 * 60 * 60 * 1000
  );
  if (start > maxDate) {
    throw new HttpsError(
      "invalid-argument",
      `Bookings cannot be more than ${MAX_BOOKING_DAYS_AHEAD} days ahead.`
    );
  }

  if (start < now) {
    throw new HttpsError(
      "invalid-argument",
      "Start time must be in the future."
    );
  }

  // Check charger exists
  const chargerDoc = await getDb().collection("chargers").doc(chargerId).get();
  if (!chargerDoc.exists) {
    throw new HttpsError("not-found", "Charger not found.");
  }
  const chargerData = chargerDoc.data()!;
  const totalPorts = chargerData.totalPorts || 1;
  const chargerBayNames = chargerData.bayNames || Array.from({ length: totalPorts }, (_, i) => `Bay ${i + 1}`);

  // Validate bayName if provided
  let resolvedBayName: string | undefined;
  if (bayName) {
    if (!chargerBayNames.includes(bayName)) {
      throw new HttpsError(
        "invalid-argument",
        `Invalid bay name: ${bayName}. Available bays: ${chargerBayNames.join(", ")}`
      );
    }
    resolvedBayName = bayName;
  }

  // Check for overlapping bookings
  // Firestore only supports range filters on a single field, so we query by
  // startTime < endTime and filter endTime > startTime in code.
  const candidateSnapshot = await getDb()
    .collection("chargers")
    .doc(chargerId)
    .collection("bookings")
    .where("startTime", "<", endTime)
    .where("status", "in", ["pending", "active"])
    .get();

  const overlappingDocs = candidateSnapshot.docs.filter(
    (doc) => doc.data().endTime > startTime
  );

  // If a specific bay is selected, check only that bay's availability
  if (resolvedBayName) {
    const bayOverlapping = overlappingDocs.filter(
      (doc) => doc.data().bayName === resolvedBayName
    );
    if (bayOverlapping.length > 0) {
      throw new HttpsError(
        "already-exists",
        `Bay "${resolvedBayName}" is already booked at this time. Choose another bay or time.`
      );
    }
  } else {
    // No specific bay selected — check overall port availability
    const activePortsUsed = overlappingDocs.length;
    if (activePortsUsed >= totalPorts) {
      throw new HttpsError(
        "already-exists",
        "All ports at this charger are booked. Choose another time."
      );
    }
  }

  // Check user doesn't already have an active booking
  const userBookingsSnapshot = await getDb()
    .collectionGroup("bookings")
    .where("userId", "==", userId)
    .where("status", "in", ["pending", "active"])
    .get();

  if (!userBookingsSnapshot.empty) {
    throw new HttpsError(
      "already-exists",
      "You already have an active booking. Cancel it first."
    );
  }

  const bookingRef = getDb()
    .collection("chargers")
    .doc(chargerId)
    .collection("bookings")
    .doc();

  const booking = {
    userId,
    userEmail,
    userDisplayName,
    chargerId,
    chargerName: chargerData.name,
    bayLocation: chargerData.bayLocation || (chargerData.totalPorts === 1 ? "Bay 1" : "Multiple bays available"),
    bayNames: chargerBayNames,
    bayName: resolvedBayName || chargerBayNames[0],
    status: "pending",
    startTime: start.toISOString(),
    endTime: end.toISOString(),
    estimatedMinutes: Math.round(durationMinutes),
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };

  await bookingRef.set(booking);
  logger.info(`Booking created: ${bookingRef.id} for user ${userId}`);

  // Schedule a Cloud Task to auto-complete this booking at its end time
  await scheduleBookingExpiry(chargerId, bookingRef.id, end.toISOString());

  return { success: true, bookingId: bookingRef.id, ...booking };
});

export const cancelBooking = onCall(async (request) => {
  const { auth } = request;
  if (!auth) {
    throw new HttpsError(
      "unauthenticated",
      "You must be signed in to cancel a booking."
    );
  }

  const { chargerId, bookingId } = request.data;
  const userId = auth.uid;

  if (!chargerId || !bookingId) {
    throw new HttpsError(
      "invalid-argument",
      "Missing required fields: chargerId, bookingId."
    );
  }

  const bookingRef = getDb()
    .collection("chargers")
    .doc(chargerId)
    .collection("bookings")
    .doc(bookingId);

  const bookingDoc = await bookingRef.get();
  if (!bookingDoc.exists) {
    throw new HttpsError("not-found", "Booking not found.");
  }

  const bookingData = bookingDoc.data()!;
  if (bookingData.userId !== userId) {
    throw new HttpsError(
      "permission-denied",
      "You can only cancel your own bookings."
    );
  }

  if (bookingData.status !== "pending") {
    throw new HttpsError(
      "failed-precondition",
      "Only pending bookings can be cancelled."
    );
  }

  await bookingRef.update({
    status: "cancelled",
    updatedAt: new Date().toISOString(),
  });

  logger.info(`Booking cancelled: ${bookingId} by user ${userId}`);
  return { success: true };
});

// ── Check-in ────────────────────────────────────────────────────────────────
const CHECK_IN_EARLY_MINUTES = 15;

export const checkInBooking = onCall(async (request) => {
  const { auth } = request;
  if (!auth) {
    throw new HttpsError("unauthenticated", "You must be signed in to check in.");
  }

  const { chargerId, bookingId } = request.data;
  const userId = auth.uid;

  if (!chargerId || !bookingId) {
    throw new HttpsError("invalid-argument", "Missing required fields: chargerId, bookingId.");
  }

  const bookingRef = getDb()
    .collection("chargers")
    .doc(chargerId)
    .collection("bookings")
    .doc(bookingId);

  const bookingDoc = await bookingRef.get();
  if (!bookingDoc.exists) {
    throw new HttpsError("not-found", "Booking not found.");
  }

  const bookingData = bookingDoc.data()!;
  if (bookingData.userId !== userId) {
    throw new HttpsError("permission-denied", "You can only check in to your own bookings.");
  }

  if (bookingData.status !== "pending") {
    throw new HttpsError("failed-precondition", "Only pending bookings can be checked in.");
  }

  const now = new Date();
  const start = new Date(bookingData.startTime);
  const end = new Date(bookingData.endTime);
  const earliestCheckIn = new Date(start.getTime() - CHECK_IN_EARLY_MINUTES * 60 * 1000);

  if (now < earliestCheckIn) {
    throw new HttpsError(
      "failed-precondition",
      `You can check in up to ${CHECK_IN_EARLY_MINUTES} minutes before your slot starts.`
    );
  }

  if (now > end) {
    throw new HttpsError("failed-precondition", "Your booking time has already passed.");
  }

  await bookingRef.update({
    status: "active",
    checkedInAt: now.toISOString(),
    updatedAt: now.toISOString(),
  });

  logger.info(`Booking checked in: ${bookingId} by user ${userId}`);
  return { success: true };
});

// ── Check-out ───────────────────────────────────────────────────────────────

export const checkOutBooking = onCall(async (request) => {
  const { auth } = request;
  if (!auth) {
    throw new HttpsError("unauthenticated", "You must be signed in to check out.");
  }

  const { chargerId, bookingId } = request.data;
  const userId = auth.uid;

  if (!chargerId || !bookingId) {
    throw new HttpsError("invalid-argument", "Missing required fields: chargerId, bookingId.");
  }

  const bookingRef = getDb()
    .collection("chargers")
    .doc(chargerId)
    .collection("bookings")
    .doc(bookingId);

  const bookingDoc = await bookingRef.get();
  if (!bookingDoc.exists) {
    throw new HttpsError("not-found", "Booking not found.");
  }

  const bookingData = bookingDoc.data()!;
  if (bookingData.userId !== userId) {
    throw new HttpsError("permission-denied", "You can only check out of your own bookings.");
  }

  if (bookingData.status !== "active") {
    throw new HttpsError("failed-precondition", "Only active bookings can be checked out.");
  }

  const now = new Date();

  await bookingRef.update({
    status: "completed",
    checkedOutAt: now.toISOString(),
    updatedAt: now.toISOString(),
  });

  logger.info(`Booking checked out: ${bookingId} by user ${userId}`);
  return { success: true };
});

// ── Auto-complete expired bookings (backup sweep) ─────────────────────────
// Runs every 30 minutes as a safety net in case a Cloud Task was missed or
// the function was redeployed with pending tasks in the queue.
export const autoCompleteBookings = onSchedule(
  {
    schedule: "every 30 minutes",
    timeZone: "Asia/Kuala_Lumpur",
    region: "asia-southeast1",
  },
  async () => {
    const now = new Date().toISOString();
    const db = getDb();

    const chargersSnapshot = await db.collection("chargers").get();
    let totalUpdated = 0;

    for (const chargerDoc of chargersSnapshot.docs) {
      // Only catch bookings that expired more than 10 minutes ago
      // (give Cloud Tasks a chance to process first)
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();

      const expiredSnapshot = await db
        .collection("chargers")
        .doc(chargerDoc.id)
        .collection("bookings")
        .where("status", "in", ["pending", "active"])
        .where("endTime", "<=", tenMinutesAgo)
        .get();

      for (const bookingDoc of expiredSnapshot.docs) {
        const bookingData = bookingDoc.data();
        const updates: Record<string, string> = {
          updatedAt: now,
        };

        if (bookingData.status === "active") {
          updates.status = "completed";
          if (!bookingData.checkedOutAt) {
            updates.checkedOutAt = now;
          }
        } else {
          updates.status = "no_show";
        }

        await bookingDoc.ref.update(updates);
        totalUpdated++;
        logger.warn(
          `Backup sweep: processed booking ${bookingDoc.id} ` +
          `(was ${bookingData.status}, endTime ${bookingData.endTime})`
        );
      }
    }

    if (totalUpdated > 0) {
      logger.warn(`Backup sweep: updated ${totalUpdated} missed bookings.`);
    }
  }
);

// ── FCM Token Management ────────────────────────────────────────────────────

export const storeFcmToken = onCall(async (request) => {
  const { auth } = request;
  if (!auth) {
    throw new HttpsError("unauthenticated", "You must be signed in.");
  }

  const { token } = request.data;
  const uid = auth.uid;

  if (token === null || token === undefined) {
    // Remove the token (user signed out or revoked permission)
    await getDb().collection("users").doc(uid).set(
      { fcmToken: null, updatedAt: new Date().toISOString() },
      { merge: true }
    );
    return { success: true };
  }

  if (typeof token !== "string" || token.length === 0) {
    throw new HttpsError("invalid-argument", "Token must be a non-empty string or null.");
  }

  await getDb().collection("users").doc(uid).set(
    { fcmToken: token, updatedAt: new Date().toISOString() },
    { merge: true }
  );

  logger.info(`FCM token stored for user ${uid}`);
  return { success: true };
});

// ── Check-in Reminder (N-01) ────────────────────────────────────────────────
// Sends a push notification to users whose booking starts in ~15 minutes.
// Runs every 5 minutes and targets pending bookings in the 10–20 min window.

export const sendCheckInReminders = onSchedule(
  {
    schedule: "every 5 minutes",
    timeZone: "Asia/Kuala_Lumpur",
    region: "asia-southeast1",
  },
  async () => {
    const now = new Date();
    const fromTime = new Date(now.getTime() + 10 * 60 * 1000).toISOString();
    const toTime = new Date(now.getTime() + 20 * 60 * 1000).toISOString();

    const db = getDb();

    // Query all pending bookings across all chargers that start in the 10–20 min window
    const snapshot = await db
      .collectionGroup("bookings")
      .where("status", "==", "pending")
      .where("startTime", ">=", fromTime)
      .where("startTime", "<=", toTime)
      .get();

    if (snapshot.empty) {
      return;
    }

    let sentCount = 0;

    for (const bookingDoc of snapshot.docs) {
      const booking = bookingDoc.data();

      // Skip if reminder already sent
      if (booking.checkInReminderSentAt) {
        continue;
      }

      // Get the user's FCM token
      const userDoc = await db.collection("users").doc(booking.userId).get();
      const fcmToken = userDoc.data()?.fcmToken;

      if (!fcmToken) {
        logger.info(`No FCM token for user ${booking.userId}, skipping reminder.`);
        continue;
      }

      const chargerName = booking.chargerName || "your charger";
      const startTime = new Date(booking.startTime);
      const timeStr = startTime.toLocaleTimeString("en-MY", {
        hour: "numeric",
        minute: "2-digit",
        timeZone: "Asia/Kuala_Lumpur",
      });

      const chargerId = booking.chargerId;

      try {
        await getMessaging().send({
          token: fcmToken,
          notification: {
            title: "⏰ Check-in Reminder",
            body: `Your slot at ${chargerName} starts at ${timeStr}. Don't forget to check in!`,
          },
          data: {
            url: `/chargers/${chargerId}/book`,
          },
          webpush: {
            fcmOptions: {
              link: `https://tesla-destination-club.web.app/chargers/${chargerId}/book`,
            },
          },
        });

        // Mark reminder as sent to prevent duplicates
        await bookingDoc.ref.update({
          checkInReminderSentAt: now.toISOString(),
          updatedAt: now.toISOString(),
        });

        sentCount++;
        logger.info(`Check-in reminder sent to user ${booking.userId} for booking ${bookingDoc.id}`);
      } catch (err) {
        logger.error(`Failed to send check-in reminder to user ${booking.userId}:`, err);

        // If the token is invalid, remove it
        if (
          err instanceof Error &&
          (err.message.includes("not a valid FCM registration token") ||
            err.message.includes("requested entity was not found"))
        ) {
          await db.collection("users").doc(booking.userId).set(
            { fcmToken: null, updatedAt: now.toISOString() },
            { merge: true }
          );
          logger.info(`Removed invalid FCM token for user ${booking.userId}`);
        }
      }
    }

    if (sentCount > 0) {
      logger.info(`Check-in reminders: sent ${sentCount} notifications.`);
    }
  }
);

// ── Hogging Report Submission ───────────────────────────────────────────────

export const submitHoggingReport = onCall(async (request) => {
  const { auth } = request;
  if (!auth) {
    throw new HttpsError(
      "unauthenticated",
      "You must be signed in to report a hogging incident."
    );
  }

  const { plateNumber, chargerId, chargerName, location, hoggingDurationMinutes, photoStoragePath } = request.data;
  const userId = auth.uid;
  const userEmail = auth.token?.email || "";
  const userDisplayName = auth.token?.name || userEmail.split("@")[0];

  // Validation
  if (!plateNumber || !chargerId || !photoStoragePath) {
    throw new HttpsError(
      "invalid-argument",
      "Missing required fields: plateNumber, chargerId, photoStoragePath."
    );
  }

  if (typeof plateNumber !== "string" || plateNumber.trim().length === 0) {
    throw new HttpsError(
      "invalid-argument",
      "Plate number must be a non-empty string."
    );
  }

  // Basic plate number validation (alphanumeric and dashes/spaces)
  if (!/^[A-Z0-9\s\-]+$/i.test(plateNumber)) {
    throw new HttpsError(
      "invalid-argument",
      "Invalid plate number format. Use letters, numbers, dashes, or spaces."
    );
  }

  // Check charger exists
  const chargerDoc = await getDb().collection("chargers").doc(chargerId).get();
  if (!chargerDoc.exists) {
    throw new HttpsError("not-found", "Charger not found.");
  }

  // Normalize plate number to uppercase
  const normalizedPlate = plateNumber.toUpperCase().trim();

  // Optional: Check user hasn't already reported this plate on the same day
  const today = new Date().toISOString().split("T")[0];
  const todayStart = `${today}T00:00:00Z`;
  const todayEnd = `${today}T23:59:59Z`;

  const existingReportSnapshot = await getDb()
    .collection("hoggingReports")
    .where("plateNumber", "==", normalizedPlate)
    .where("reportedByUserId", "==", userId)
    .where("reportedAt", ">=", todayStart)
    .where("reportedAt", "<=", todayEnd)
    .limit(1)
    .get();

  if (!existingReportSnapshot.empty) {
    throw new HttpsError(
      "already-exists",
      "You have already reported this plate today. Please wait before submitting another report."
    );
  }

  const now = new Date();
  const reportRef = getDb().collection("hoggingReports").doc();

  const report = {
    plateNumber: normalizedPlate,
    reportedAt: request.data.reportedAt || now.toISOString(),
    chargerId,
    chargerName: chargerName || chargerDoc.data()?.name || "Unknown",
    location: location || "",
    hoggingDurationMinutes: hoggingDurationMinutes || null,
    photoStoragePath,
    reportedByUserId: userId,
    reportedByEmail: userEmail,
    reportedByDisplayName: userDisplayName,
    status: "pending",
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };

  await reportRef.set(report);
  logger.info(`Hogging report submitted: ${reportRef.id} for plate ${normalizedPlate} by user ${userId}`);

  return { success: true, reportId: reportRef.id };
});

// ── Approve Hogging Report (Admin Only) ──────────────────────────────────

export const approveHoggingReport = onCall(async (request) => {
  const { auth } = request;
  if (!auth) {
    throw new HttpsError("unauthenticated", "You must be signed in.");
  }

  // Check if user is admin
  const isAdmin = auth.token?.isAdmin === true;
  if (!isAdmin) {
    throw new HttpsError(
      "permission-denied",
      "Only admins can approve hogging reports."
    );
  }

  const { reportId } = request.data;
  if (!reportId) {
    throw new HttpsError("invalid-argument", "Missing required field: reportId.");
  }

  const reportRef = getDb().collection("hoggingReports").doc(reportId);
  const reportDoc = await reportRef.get();

  if (!reportDoc.exists) {
    throw new HttpsError("not-found", "Report not found.");
  }

  const reportData = reportDoc.data()!;
  if (reportData.status !== "pending") {
    throw new HttpsError(
      "failed-precondition",
      `Report is already ${reportData.status}. Cannot approve.`
    );
  }

  const now = new Date();
  const plateNumber = reportData.plateNumber;

  // Update report status to approved
  await reportRef.update({
    status: "approved",
    approvedByAdminId: auth.uid,
    approvalTimestamp: now.toISOString(),
    updatedAt: now.toISOString(),
  });

  // Increment hog tally (create if doesn't exist)
  const hogRef = getDb().collection("hoggers").doc(plateNumber);
  const hogDoc = await hogRef.get();

  if (hogDoc.exists) {
    // Increment existing count
    await hogRef.update({
      approvedReportCount: (hogDoc.data()?.approvedReportCount || 0) + 1,
      lastReportedAt: now.toISOString(),
      updatedAt: now.toISOString(),
    });
  } else {
    // Create new hog entry
    await hogRef.set({
      plateNumber,
      approvedReportCount: 1,
      lastReportedAt: now.toISOString(),
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    });
  }

  logger.info(`Hogging report ${reportId} approved by admin ${auth.uid}. Hog tally: ${plateNumber}`);

  return { success: true };
});

// ── Reject Hogging Report (Admin Only) ───────────────────────────────────

export const rejectHoggingReport = onCall(async (request) => {
  const { auth } = request;
  if (!auth) {
    throw new HttpsError("unauthenticated", "You must be signed in.");
  }

  // Check if user is admin
  const isAdmin = auth.token?.isAdmin === true;
  if (!isAdmin) {
    throw new HttpsError(
      "permission-denied",
      "Only admins can reject hogging reports."
    );
  }

  const { reportId, rejectionReason } = request.data;
  if (!reportId) {
    throw new HttpsError("invalid-argument", "Missing required field: reportId.");
  }

  const reportRef = getDb().collection("hoggingReports").doc(reportId);
  const reportDoc = await reportRef.get();

  if (!reportDoc.exists) {
    throw new HttpsError("not-found", "Report not found.");
  }

  const reportData = reportDoc.data()!;
  if (reportData.status !== "pending") {
    throw new HttpsError(
      "failed-precondition",
      `Report is already ${reportData.status}. Cannot reject.`
    );
  }

  const now = new Date();

  await reportRef.update({
    status: "rejected",
    rejectionReason: rejectionReason || "",
    updatedAt: now.toISOString(),
  });

  logger.info(`Hogging report ${reportId} rejected by admin ${auth.uid}.`);

  return { success: true };
});

// ── Get Leaderboard (Public) ─────────────────────────────────────────────

export const getLeaderboard = onCall(async () => {
  const snapshot = await getDb()
    .collection("hoggers")
    .where("approvedReportCount", ">=", 2)
    .orderBy("approvedReportCount", "desc")
    .orderBy("plateNumber", "asc")
    .limit(10)
    .get();

  const leaderboard = snapshot.docs.map((doc, index) => ({
    rank: index + 1,
    ...doc.data(),
  }));

  return { success: true, leaderboard };
});
