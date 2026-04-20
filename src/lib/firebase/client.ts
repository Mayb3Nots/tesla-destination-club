import { initializeApp, getApps } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';

const firebaseConfig = {
	apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyBEy1c1OyGPRndFDAsTtNs515C9RsuyAYE',
	authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'tesla-destination-club.firebaseapp.com',
	projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'tesla-destination-club',
	storageBucket:
		import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'tesla-destination-club.firebasestorage.app',
	messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '794509533450',
	appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:794509533450:web:be1a0f59b7932e7aea1af3'
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

const auth = getAuth(app);

if (import.meta.env.DEV && import.meta.env.VITE_FIREBASE_AUTH_EMULATOR_HOST) {
	connectAuthEmulator(auth, import.meta.env.VITE_FIREBASE_AUTH_EMULATOR_HOST);
}

export { app, auth, firebaseConfig };
