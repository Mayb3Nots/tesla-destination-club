import { initializeApp, getApps } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';

const firebaseConfig = {
	apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyBEy1c1OyGPRndFDAsTtNs515C9RsuyAYE',
	authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'tesla-destination-club.firebaseapp.com',
	projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'tesla-destination-club',
	storageBucket:
		import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'tesla-destination-club.firebasestorage.app',
	messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '794509533450',
	appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:794509533450:web:be1a0f59b7932e7aea1af3'
};

// VAPID key for web push notifications — generate in Firebase Console → Project Settings → Cloud Messaging → Web Push certificates
const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY || '';

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

const auth = getAuth(app);
const db = getFirestore(app);

// Messaging is initialized lazily because isSupported() is async.
// Use getMessagingInstance() to get the messaging object where needed.
let _messaging: ReturnType<typeof import('firebase/messaging').getMessaging> | null = null;

async function getMessagingInstance() {
	if (_messaging !== undefined) return _messaging;
	const { isSupported, getMessaging } = await import('firebase/messaging');
	if (typeof window !== 'undefined' && (await isSupported())) {
		_messaging = getMessaging(app);
	} else {
		_messaging = null;
	}
	return _messaging;
}

if (import.meta.env.DEV && import.meta.env.VITE_FIREBASE_AUTH_EMULATOR_HOST) {
	connectAuthEmulator(auth, import.meta.env.VITE_FIREBASE_AUTH_EMULATOR_HOST);
}

if (import.meta.env.DEV && import.meta.env.VITE_FIREBASE_FIRESTORE_EMULATOR_HOST) {
	connectFirestoreEmulator(db, 'localhost', 8080);
}

export { app, auth, db, getMessagingInstance, firebaseConfig, vapidKey };
