/* global importScripts, firebase */
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: self?.REACT_APP_FIREBASE_API_KEY || "AIzaSyCKPiM3fjQWqxrdN4UoyfLxsJKNk6h8lIU",
  authDomain: "real-estate-marketplace-37544.firebaseapp.com",
  projectId: "real-estate-marketplace-37544",
  messagingSenderId: "759115682573",
  appId: "1:759115682573:web:2dbddf9ba6dac14764d644"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function(payload) {
  const { title, body } = payload.notification || {};
  const notificationTitle = title || 'Naija Luxury Homes';
  const notificationOptions = { body: body || '', icon: '/logo192.png' };
  self.registration.showNotification(notificationTitle, notificationOptions);
});


