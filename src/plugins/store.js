import Vue from "vue";
import Vuex from "vuex";

import { firestore } from "@/plugins/firebase";

Vue.use(Vuex);

export default new Vuex.Store({
  state: {
    // Data from /users/{userUid} document
    user: undefined,
    // Selected college on home page
    college: undefined,
    // Selected restaurant uid
    restaurantUid: undefined,
    // Object containing food items and quantities
    basket: [],
    // Redirect URL for after sign-in
    signInRedirect: "home"
  },

  getters: {
    user: state => state.user,
    college: state => state.college,
    restaurantUid: state => state.restaurantUid,
    basket: state => state.basket,
    signInRedirect: state => state.signInRedirect,

    userUid: state => state.user ? state.user.uid : undefined,

    // the name of the selected college
    collegeName: state => state.college ? state.college.name : undefined,
    // the fee for delivering to the selected college
    collegeFee: state => 150,

    // has the user signed in to the app
    hasAuth: (_, getters) => !!getters.user,
    // get the user permissions map, empty if not logged in
    permissions: (_, getters) => {
      if (!getters.hasAuth)
        return {};
      return getters.user.permissions || {};
    },
    // does the user have the admin permission
    isAdmin: (_, getters) => !!getters.permissions.admin,
    // does the user have the courier permission
    isCourier: (_, getters) => !!getters.permissions.courier,
    // does the user have a restaurant permission reference
    isManager: (_, getters) => !!getters.permissions.restaurant,

    // firestore reference to the user document for the currently signed in
    //  user
    userRef: (_, getters) => {
      if (getters.hasAuth) {
        const userUid = getters.user.uid;
        return firestore.collection("users").doc(userUid);
      }
      return undefined;
    },

    // firestore reference to the restaurant document for the currently
    //  selected restaurant
    restaurantRef: (_, getters) => {
      const restaurantUid = getters.restaurantUid;
      if (restaurantUid) {
        return firestore.collection("restaurants").doc(restaurantUid);
      }
      return undefined;
    },

    managedRestaurantRef: (_, getters) => {
      const permissions = getters.permissions;
      if (permissions.restaurant) {
        return firestore.collection("restaurants").doc(permissions.restaurant);
      }
      return undefined;
    },

    // display name of the user, "" if not signed in
    displayName: (_, getters) =>
      getters.hasAuth ? getters.user.displayName : ""
  },

  // Mutations are synchronous so should not perform long running tasks or await
  //  asynchronous tasks
  mutations: {
    SET_USER: (state, value) => {
      state.user = value;
    },
    SET_COLLEGE: (state, value) => {
      state.college = value;
    },
    SET_RESTAURANT_UID: (state, value) => {
      state.restaurantUid = value;
    },
    SET_BASKET: (state, value) => {
      state.basket = value;
    },
    SET_SIGN_IN_REDIRECT: (state, value) => {
      state.signInRedirect = value;
    }
  },

  // Actions are asynchronous
  actions: {
    SET_USER: (context, user) => {
      context.commit("SET_USER", user);

      // Write user object to localStorage
      if (user) {
        const userJson = JSON.stringify(user);
        localStorage.setItem("user", userJson);

        // FIXME: This was required to update the user"s display name after logging in with
        //  their email. It should be replaced with a call to update the displayName property
        //  only instead of attempting to update all of the properties of the user.
        firestore.collection("users").doc(user.uid).update(user);
      } else {
        localStorage.removeItem("user");
      }
    },
    SET_COLLEGE: (context, college) => {
      // TODO: In future, this action might update the selected college
      //  (location) in the user"s document on Firestore
      context.commit("SET_COLLEGE", college);

      if (college) {
        const collegeJson = JSON.stringify(college);
        localStorage.setItem("college2", collegeJson);
      } else {
        localStorage.removeItem("college2");
      }
    },
    SET_RESTAURANT_UID: (context, restaurantUid) => {
      context.commit("SET_RESTAURANT_UID", restaurantUid);

      if (restaurantUid) {
        localStorage.setItem("restaurantUid", restaurantUid);
      } else {
        localStorage.removeItem("restaurantUid");
      }
    },
    SET_BASKET: (context, basket) => {
      context.commit("SET_BASKET", basket);

      if (basket) {
        const basketJson = JSON.stringify(basket);
        localStorage.setItem("basket", basketJson);
      } else {
        localStorage.removeItem("basket");
      }
    },
    ADD_BASKET_ITEM: (context, item) => {
      const basket = context.getters.basket;
      const { id, name, properties, label } = item;
      const newPrice = item.price;
      const deltaQuantity = item.quantity || 1;

      const propertiesJSON = JSON.stringify(properties);

      // Get the array index for the item we want to add to the basket
      // (if no index is found then we haven"t added this item before)
      const itemIndex = basket.findIndex(other => {
        const ids = other.id === id;
        const properties = JSON.stringify(other.properties) === propertiesJSON;

        return ids && properties;
      });

      if (itemIndex >= 0) {
        const { price, quantity } = basket[itemIndex];

        const unitPrice = price / quantity;
        const newQuantity = quantity + deltaQuantity;
        const newPrice = unitPrice * newQuantity;

        basket.splice(itemIndex, 1, {
          id,
          name,
          properties,
          label,
          price: newPrice,
          quantity: newQuantity
        });
      } else {
        // We couldn"t find the item in the basket, so add it as a new element
        basket.push({
          id,
          name,
          properties,
          label,
          price: newPrice,
          quantity: deltaQuantity
        });
      }

      // update basket state
      context.dispatch("SET_BASKET", basket);
    },
    REMOVE_BASKET_ITEM: (context, item) => {
      const basket = context.getters.basket;

      // Get the array index for the item we want to add to the basket
      // (if no index is found then we haven"t added this item before)
      const itemIndex = basket.findIndex(other => {
        const ids = other.id === item.id;

        // idk why this works and a normal comparison does not
        const properties = JSON.stringify(other.properties) === JSON.stringify(item.properties);

        return ids && properties;
      });
      if (itemIndex < 0) {
        // If for some reason the item couldn"t be found in the basket,
        //  don"t do anything
        return;
      }

      // We want to reduce the quantity of the item by one
      //  and the overall price of the item by the unitPrice
      const basketItem = basket[itemIndex];
      if (basketItem.quantity > 1) {
        // Find the price of a single item
        const unitPrice = basketItem.price / basketItem.quantity;
        const quantity = item.quantity || 1;

        basket[itemIndex].quantity -= quantity;
        basket[itemIndex].price = unitPrice * basket[itemIndex].quantity;
      } else {
        // If the quantity is less than or equal to 1 already,
        //  remove the item from the basket
        basket.splice(itemIndex, 1);
      }

      // update basket state
      context.dispatch("SET_BASKET", basket);
    },
    CLEAR_BASKET: (context) => {
      context.dispatch("SET_BASKET", []);
    },
    SET_SIGN_IN_REDIRECT: (context, signInRedirect) => {
      context.commit("SET_SIGN_IN_REDIRECT", signInRedirect);

      // Write signInRedirect to localStorage
      if (signInRedirect) {
        localStorage.setItem("signInRedirect", signInRedirect);
      } else {
        localStorage.removeItem("signInRedirect");
      }
    },

    // "DELETE_USER" action is simpler method for clearing User data
    DELETE_USER: (context) => {
      context.dispatch("SET_USER", undefined);
    },

    /*
     * The "initialise" action should run when the app starts to load the state
     * from localStorage. We could change this in the future to load some state
     * from the user"s Firestore document (for example caching college/basket
     * information across devices.
    */
    INITIALISE: (state) => {
      // user
      const userJson = localStorage.getItem("user");
      if (userJson) {
        const user = JSON.parse(userJson);
        state.commit("SET_USER", user);
      }

      // college
      const collegeJson = localStorage.getItem("college2");
      if (collegeJson) {
        const college = JSON.parse(collegeJson);
        state.commit("SET_COLLEGE", college);
      }

      // restaurantUid
      const restaurantUid = localStorage.getItem("restaurantUid");
      if (restaurantUid) {
        state.commit("SET_RESTAURANT_UID", restaurantUid);
      }

      // basket
      const basketJson = localStorage.getItem("basket");
      if (basketJson) {
        const basket = JSON.parse(basketJson);
        state.commit("SET_BASKET", basket);
      }

      // signInRedirect
      const signInRedirect = localStorage.getItem("signInRedirect");
      if (signInRedirect) {
        state.commit("SET_SIGN_IN_REDIRECT", signInRedirect);
      }
    }
  }
});
