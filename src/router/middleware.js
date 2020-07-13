import { store } from "@/plugins";
import { isRestaurantOpen } from "@/components/OpeningTimes";

/**
 *  Will check to see that the user is authenticated.
 */
export const requireAuth = (to, from, next) => {
  if (store.getters.hasAuth) {
    next();
  } else {
    next(`/error?type=login&redirect=${from.name}`);
  }
};

/**
 *  Will check that the user is authenticated as an admin.
 */
export const requireAdmin = (to, _, next) => {
  if (store.getters.isAdmin) {
    next();
  } else {
    next({ name: "error", query: { type: "unauthorised" } });
  }
};

export const requireManager = (to, _, next) => {
  if (store.getters.isManager) {
    next();
  } else {
    next({ name: "error", query: { type: "unauthorised" } });
  }
};

/**
 *  Will check that the user is authenticated as a courier (or is a site admin)
 */
export const requireCourier = (to, _, next) => {
  if (store.getters.isCourier || store.getters.isAdmin) {
    next();
  } else {
    next({ name: "error", query: { type: "unauthorised" } });
  }
};

export const requireStage = async (to, _, next) => {
  const reject = (redirect, error) => {
    console.debug(`[requireStage middleware] Failed navigation to ${to.name}: ${error}`);

    if (typeof redirect === "string") {
      next({ name: redirect });
    } else if (redirect) {
      next(redirect);
    } else {
      next(false);
    }
  };

  // TODO: show routing errors as a snackbar message so that the user understands
  //  why navigation failed.
  switch (to.name) {
    case "checkout":
      // The user must have items in their basket before accessing the checkout page
      if (!store.getters.basket || store.getters.basket.length <= 0) {
        return reject("menu", "Basket is empty");
      }

      const restaurant = (await store.getters.restaurantRef.get()).data();
      if (!isRestaurantOpen(restaurant) && !store.getters.isAdmin) {
        return reject("home");
      }

    case "menu":
      // The user must have selected a restaurant before accessing the menu route
      if (!store.getters.restaurantUid) {
        return reject("locations", "No restaurant selected");
      }

    default:
      // Unknown route
      console.warn(`requireStage middleware: Unknown route "${to.name}"`);
      break;
  }

  // All tests passed. Continue with navigation.
  next();
};
