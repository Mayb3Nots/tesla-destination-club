import { getMessagingInstance, vapidKey } from './client';
import { getToken, onMessage } from 'firebase/messaging';
import { app, db } from './client';
import { doc, setDoc } from 'firebase/firestore';
import type { Unsubscribe } from 'firebase/messaging';

/**
 * Request notification permission from the browser and obtain an FCM token.
 * Returns the token string on success, or null if denied / unavailable.
 */
export async function requestNotificationPermission(): Promise<string | null> {
    const messaging = await getMessagingInstance();
    if (!messaging) return null;

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return null;

    try {
        const token = await getToken(messaging, { vapidKey });
        return token || null;
    } catch (err) {
        console.error('Failed to get FCM token:', err);
        return null;
    }
}

/**
 * Store the FCM token directly in Firestore.
 */
export async function storeFcmToken(uid: string, token: string): Promise<void> {
    await setDoc(doc(db, 'users', uid), { fcmToken: token, updatedAt: new Date().toISOString() }, { merge: true });
}

/**
 * Remove the FCM token from Firestore on sign-out.
 */
export async function removeFcmToken(uid: string): Promise<void> {
    try {
        await setDoc(doc(db, 'users', uid), { fcmToken: null, updatedAt: new Date().toISOString() }, { merge: true });
    } catch (err) {
        console.error('Failed to remove FCM token:', err);
    }
}

/**
 * Full permission request + token storage flow.
 * Returns true if token was successfully stored.
 */
export async function enableNotifications(uid: string): Promise<boolean> {
    const token = await requestNotificationPermission();
    if (!token) return false;

    await storeFcmToken(uid, token);
    return true;
}

/**
 * Listen for foreground messages (when the app tab is active).
 * Returns an unsubscribe function.
 */
export function onForegroundMessage(
    callback: (payload: { notification?: { title?: string; body?: string }; data?: Record<string, string> }) => void
): Unsubscribe {
    // Set up listener asynchronously — we return a sync unsubscribe that
    // cancels the setup if called before messaging is ready.
    let cancelled = false;
    let realUnsubscribe: Unsubscribe | null = null;

    (async () => {
        const messaging = await getMessagingInstance();
        if (cancelled || !messaging) return;
        realUnsubscribe = onMessage(messaging, callback);
    })();

    return () => {
        cancelled = true;
        realUnsubscribe?.();
    };
}

/**
 * Check if notifications are currently supported and permitted.
 */
export function getNotificationStatus(): 'granted' | 'denied' | 'default' | 'unsupported' {
    if (typeof window === 'undefined' || typeof Notification === 'undefined') return 'unsupported';
    return Notification.permission as 'granted' | 'denied' | 'default';
}
