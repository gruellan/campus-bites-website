import Vue from "vue";
import { firestorePlugin } from "vuefire";

import firebase from "firebase/app";
import firebaseui from "firebaseui";
import "firebase/auth";
import "firebase/firestore";
import "firebase/storage";
import "firebase/messaging";

import config from "../config";
import store from "./store";

// Need to initialise Firebase with our config before we can do anything
firebase.initializeApp(config.firebase);

// Handling Firebase authentication
let userUid = undefined;
let unsubscribe = undefined;

// Export Firebase libraries
export const auth = firebase.auth();
export const firestore = firebase.firestore();
export const storage = firebase.storage();

let _messaging;
if (firebase.messaging.isSupported()) {
  _messaging = firebase.messaging();
}
export const messaging = _messaging;
export let requestNotificationPermission;

// TODO: move to config.js
export const uiConfig = {
  signInFlow: "popup",
  signInSuccessUrl: "/success?type=login",
  signInOptions: [
    {
      provider: firebase.auth.GoogleAuthProvider.PROVIDER_ID,
      authMethod: "https://accounts.google.com",
      clientId: "663577647170-4orppe44j31nn6np2p77cgj1madtqd6u.apps.googleusercontent.com"
    }
  ]
};
export const firebaseUi = new firebaseui.auth.AuthUI(auth);

// A Vue plugin so that Firebase stuff is easy
//  to access inside other Vue components
Vue.use(firestorePlugin);


const FirebasePlugin = {
  install: (Vue) => {
    Vue.prototype.$auth = auth;
    Vue.prototype.$firestore = firestore;

    let pushToken, sendTokenToServer;

    if (messaging) {
      Vue.prototype.$messaging = messaging;

      let fcmToken;
      let pushedToken = false;
      let pushingToken = false;

      pushToken = () => {
        const user = store.getters.user;
        if (pushedToken || pushingToken || !user || !fcmToken) {
          return;
        }

        const notificationTokens = Object.keys(user.notificationTokens || {});
        if (notificationTokens.indexOf(pushedToken) >= 0) {
          return;
        }

        pushingToken = true;

        let update = {};
        update[`notificationTokens.${fcmToken}`] = true;
        store.getters.userRef.update(update)
          .then(() => {
            pushedToken = true;
            pushingToken = false;
            console.debug("Pushed token:", fcmToken);
          })
          .catch((err) => {
            pushingToken = false;
            console.debug("An error occurred while pushing the token:", err);
          });
      };

      sendTokenToServer = (token) => {
        if (fcmToken === token) {
          console.debug("Token was same as old token");
          return;
        }

        if (!token) {
          console.debug("Token was undefined");
          return;
        }

        fcmToken = token;
        pushedToken = false;
        pushToken();
      };

      // Initialise Firebase Cloud Messaging
      messaging.usePublicVapidKey(config.messagingPublicKey);

      requestNotificationPermission = () => {
        messaging.requestPermission().then(() => {
          console.debug("Notification permission granted.");

          // Get Instance ID token. Initially this makes a network call, once retrieved
          //  subsequent calls to getToken will return from cache.
          messaging.getToken().then((currentToken) => {
            console.debug("New token:", currentToken);
            if (currentToken) {
              sendTokenToServer(currentToken);
            } else {
              console.debug("No Instance ID token available. Request permission to generate one.");
            }
          }).catch((err) => {
            console.debug("An error occurred while retrieving token.", err);
          });

          // Callback fired if Instance ID token is updated.
          messaging.onTokenRefresh(() => {
            messaging.getToken().then((refreshedToken) => {
              console.debug("Token refreshed.");
              // Indicate that the new Instance ID token has not yet been sent to the
              // app server.
              sendTokenToServer(refreshedToken);
            }).catch((err) => {
              console.debug("Unable to retrieve refreshed token ", err);
            });
          });
        }).catch((err) => {
          console.debug("Unable to get permission to notify.", err);
        });
      };

      messaging.onMessage((payload) => {
        console.debug("Notifications received.", payload);

        if (!payload.data || !payload.data.notification) {
          return;
        }

        const data = JSON.parse(payload.data.notification);
        const notification = new Notification(data.title, data);
        notification.onclick = function () {
          window.open(data.click_action);
        };

        // TODO: display Vuetify dialog or snackbar
      });
    }

    // Listen to login state changes
    auth.onAuthStateChanged((user) => {
      const firebaseUser = user;
      // Did the user login? (user will be null if logged out)
      if (user) {
        // Stop listening for changes to the user in the database
        //  if a new user has logged in
        if (userUid !== user.uid && unsubscribe)
          unsubscribe();

        // Setup a new listener for the logged in user
        unsubscribe = firestore.collection("users").doc(user.uid)
          .onSnapshot((doc) => {
            if (doc.exists) {
              let user = doc.data();
              user.displayName = firebaseUser.displayName;

              if (messaging) {
                store.dispatch("SET_USER", user).then(pushToken);
              } else {
                store.dispatch("SET_USER", user);
              }
            }
          });
      } else {
        // If they have logged out clear the user state
        store.dispatch("DELETE_USER");

        // Stop listening for changes to the user in the database
        if (unsubscribe) {
          unsubscribe();
        }
      }
    });
  }
};
Vue.use(FirebasePlugin);
