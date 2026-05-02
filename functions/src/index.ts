import { initializeApp } from "firebase-admin/app";
import { setGlobalOptions } from "firebase-functions";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { getFirestore } from "firebase-admin/firestore";
import * as logger from "firebase-functions/logger";
import { SEED_CHARGERS } from "./seed";

initializeApp();
setGlobalOptions({ maxInstances: 10 });

const MAX_BOOKING_DURATION_MINUTES = 180;
const MAX_BOOKING_DAYS_AHEAD = 7;

/** Lazy Firestore instance. */
function getDb() {
  return getFirestore();
}

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

  const { chargerId, startTime, endTime } = request.data;
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

  // Check for overlapping bookings
  const overlappingSnapshot = await getDb()
    .collection("chargers")
    .doc(chargerId)
    .collection("bookings")
    .where("startTime", "<", endTime)
    .where("endTime", ">", startTime)
    .where("status", "in", ["pending", "active"])
    .get();

  const activePortsUsed = overlappingSnapshot.size;
  if (activePortsUsed >= totalPorts) {
    throw new HttpsError(
      "already-exists",
      "All ports at this charger are booked. Choose another time."
    );
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
    status: "pending",
    startTime: start.toISOString(),
    endTime: end.toISOString(),
    estimatedMinutes: Math.round(durationMinutes),
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };

  await bookingRef.set(booking);
  logger.info(`Booking created: ${bookingRef.id} for user ${userId}`);

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
