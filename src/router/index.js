import Vue from "vue";
import Router from "vue-router";

import { store } from "@/plugins";
import { requireAdmin, requireAuth, requireCourier, requireManager, requireStage } from "./middleware";

Vue.use(Router);

export const routes = [
  { path: "/", redirect: { name: "home" } },
  {
    path: "/home",
    name: "home",
    meta: { hideToolbar: true },
    component: () => import("@/views/Home.vue")
  },
  {
    path: "/locations",
    name: "locations",
    component: () => import("@/views/Locations.vue")
  },
  {
    path: "/menu",
    name: "menu",
    component: () => import("@/views/Menu.vue")
  },
  {
    path: "/checkout",
    name: "checkout",
    meta: {
      requiresStage: true
    },
    component: () => import("@/views/Checkout.vue")
  },
  {
    path: "/success",
    name: "success",
    component: () => import("@/views/Success.vue")
  },
  {
    path: "/error",
    name: "error",
    component: () => import("@/views/Error.vue")
  },
  {
    path: "/privacy",
    name: "privacy",
    component: () => import("@/views/Privacy.vue")
  },
  {
    path: "/cookies",
    name: "cookies",
    component: () => import("@/views/Cookies.vue")
  },
  {
    path: "/contact",
    name: "contact",
    component: () => import("@/views/Contact.vue")
  },
  {
    path: "/account",
    name: "account",
    meta: {
      requiresAuth: true,
      showInUserMenu: {
        name: "My Account",
        icon: "info"
      }
    },
    component: () => import("@/views/MyAccount.vue")
  },
  {
    path: "/admin",
    name: "admin",
    meta: {
      requiresAdmin: true,
      showInUserMenu: {
        name: "Admin Dashboard",
        icon: "dashboard"
      }
    },
    component: () => import("@/views/AdminPage.vue"),
    children: [
      {
        path: "dashboard",
        component: () => import("@/views/admin/AdminDashboard.vue")
      },
      {
        path: "restaurants",
        component: () => import("@/views/admin/RestaurantManager.vue")
      },
      {
        path: "users",
        component: () => import("@/views/admin/UserManager.vue")
      },
      {
        path: "notifications",
        component: () => import("@/views/admin/NotificationManager.vue")
      },
      {
        path: "food-items",
        component: () => import("@/views/admin/FoodItemManager.vue")
      },
      {
        path: "",
        redirect: "dashboard"
      }
    ]
  },
  {
    path: "/restaurant-dashboard",
    name: "restaurant-dashboard",
    meta: {
      requiresManager: true,
      showInUserMenu: {
        name: "Restaurant Dashboard",
        icon: "local_dining"
      }
    },
    component: () => import("@/views/RestaurantDashboard.vue")
  },
  {
    path: "/courier",
    name: "courier",
    meta: {
      requiresCourier: true,
      showInUserMenu: {
        name: "Courier Dashboard",
        icon: "all_inbox"
      }
    },
    component: () => import("@/views/Courier.vue")
  },
  {
    path: "/cook",
    name: "cook",
    meta: {
      requiresManager: true,
      showInUserMenu: {
        name: "Cook Dashboard",
        icon: "fastfood"
      }
    },
    component: () => import("@/views/Cook.vue")
  },
  {
    path: "/terms",
    name: "Terms",
    component: () => import("@/views/Terms.vue")
  },
  {
    path: "/faq",
    name: "FAQ",
    component: () => import("@/views/Faq.vue")
  },
  {
    path: "/receipt",
    name: "receipt",
    meta: { hideToolbar: true, hideFooter: true },
    component: () => import("@/views/Receipt.vue")
  }
];

export const userMenuRoutes = routes.filter(route => route.meta && route.meta.showInUserMenu);

const router = new Router({
  mode: "history",
  base: process.env.BASE_URL,
  routes,
  // Reset scroll position when navigating
  //  to different routes
  scrollBehavior() {
    return { x: 0, y: 0 };
  }
});

router.beforeEach((to, from, next) => {
  const process = () => {
    if (to.matched.some(route => route.meta.requiresCourier)) {
      requireCourier(to, from, next);
    } else if (to.matched.some(route => route.meta.requiresAdmin)) {
      requireAdmin(to, from, next);
    } else if (to.matched.some(route => route.meta.requiresAuth)) {
      requireAuth(to, from, next);
    } else if (to.meta.requiresManager) {
      requireManager(to, from, next);
    } else if (to.meta.requiresStage) {
      requireStage(to, from, next);
    } else {
      next();
    }
  };

  if (from.name) {
    process();
  } else {
    store.dispatch("INITIALISE").then(process);
  }
});

export default router;
