import { auth } from './client';
import {
	type User,
	onAuthStateChanged,
	signInWithEmailAndPassword,
	createUserWithEmailAndPassword,
	signInWithPopup,
	GoogleAuthProvider,
	signOut as firebaseSignOut
} from 'firebase/auth';

let currentUser = $state<User | null>(null);
let loading = $state(true);
let error = $state<string | null>(null);

if (typeof window !== 'undefined') {
	onAuthStateChanged(auth, (user) => {
		currentUser = user;
		loading = false;
		error = null;
	});
}

async function signInWithEmail(email: string, password: string) {
	error = null;
	try {
		await signInWithEmailAndPassword(auth, email, password);
	} catch (err) {
		const code = (err as { code?: string })?.code;
		if (code === 'auth/invalid-credential' || code === 'auth/wrong-password') {
			error = 'Invalid email or password';
		} else if (code === 'auth/user-not-found') {
			error = 'No account found with this email';
		} else if (code === 'auth/too-many-requests') {
			error = 'Too many attempts. Please try again later';
		} else {
			error = 'Something went wrong. Please try again';
		}
		throw err;
	}
}

async function signUpWithEmail(email: string, password: string) {
	error = null;
	try {
		await createUserWithEmailAndPassword(auth, email, password);
	} catch (err) {
		const code = (err as { code?: string })?.code;
		if (code === 'auth/email-already-in-use') {
			error = 'An account with this email already exists';
		} else if (code === 'auth/weak-password') {
			error = 'Password should be at least 6 characters';
		} else if (code === 'auth/invalid-email') {
			error = 'Please enter a valid email address';
		} else {
			error = 'Something went wrong. Please try again';
		}
		throw err;
	}
}

async function signInWithGoogle() {
	error = null;
	try {
		const provider = new GoogleAuthProvider();
		await signInWithPopup(auth, provider);
	} catch (err) {
		const code = (err as { code?: string })?.code;
		if (code === 'auth/popup-closed-by-user') {
			return;
		}
		error = 'Failed to sign in with Google. Please try again';
		throw err;
	}
}

async function signOut() {
	error = null;
	try {
		await firebaseSignOut(auth);
	} catch (err) {
		error = 'Failed to sign out';
		throw err;
	}
}

function clearError() {
	error = null;
}

export function getAuthState() {
	return {
		get currentUser() {
			return currentUser;
		},
		get loading() {
			return loading;
		},
		get error() {
			return error;
		},
		signInWithEmail,
		signUpWithEmail,
		signInWithGoogle,
		signOut,
		clearError
	};
}
