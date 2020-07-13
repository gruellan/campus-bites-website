// Give the service worker access to Firebase Messaging.
// Note that you can only use Firebase Messaging here, other Firebase libraries
// are not available in the service worker.
importScripts('/__/firebase/5.8.5/firebase-app.js');
importScripts('/__/firebase/5.8.5/firebase-messaging.js');
importScripts('/__/firebase/init.js');

// Retrieve an instance of Firebase Messaging so that it can handle background
// messages.
const messaging = firebase.messaging();

// If you would like to customize notifications that are received in the
// background (Web app is closed or not in browser focus) then you should
// implement this optional method.
// [START background_handler]
messaging.setBackgroundMessageHandler(function(payload) {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);

  if (!payload.data || !payload.data.notification) {
    return;
  }

  const notification = JSON.parse(payload.data.notification);
  return self.registration.showNotification(notification.title, notification);
});
// [END background_handler]
