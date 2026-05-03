/* eslint-disable no-undef */
importScripts('https://www.gstatic.com/firebasejs/12.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/12.12.0/firebase-messaging-compat.js');

firebase.initializeApp({
	apiKey: 'AIzaSyBEy1c1OyGPRndFDAsTtNs515C9RsuyAYE',
	authDomain: 'tesla-destination-club.firebaseapp.com',
	projectId: 'tesla-destination-club',
	storageBucket: 'tesla-destination-club.firebasestorage.app',
	messagingSenderId: '794509533450',
	appId: '1:794509533450:web:be1a0f59b7932e7aea1af3'
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
	const title = payload.notification?.title || 'Tesla Destination Club';
	const body = payload.notification?.body || '';
	const url = payload.data?.url || '/';

	self.registration.showNotification(title, {
		body,
		icon: '/favicon.png',
		badge: '/favicon.png',
		data: { url }
	});
});

self.addEventListener('notificationclick', (event) => {
	event.notification.close();
	const url = event.notification.data?.url || '/';

	event.waitUntil(
		self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
			for (const client of clientList) {
				if (client.url.includes(self.location.origin) && 'focus' in client) {
					client.navigate(url);
					return client.focus();
				}
			}
			return self.clients.openWindow(url);
		})
	);
});
