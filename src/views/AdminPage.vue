<template>
  <div id="admin">
    <v-layout>
      <v-flex sm3 md2>
        <v-navigation-drawer stateless value="true">
          <v-list>
            <v-list-tile v-for="route of routes" :key="route.name" :to="route.to">
              <v-list-tile-action>
                <v-icon>{{ route.icon }}</v-icon>
              </v-list-tile-action>
              <v-list-tile-title>{{ route.name }}</v-list-tile-title>
            </v-list-tile>
          </v-list>
        </v-navigation-drawer>
      </v-flex>

      <v-flex sm9 md10 id="route-container">
        <router-view></router-view>
      </v-flex>
    </v-layout>
  </div>
</template>

<script>
import { requestNotificationPermission } from "@/plugins/firebase";

export default {
  name: "Admin",
  created() {
    requestNotificationPermission();
  },
  data: () => ({
    routes: [
      {
        name: "Dashboard",
        icon: "dashboard",
        to: "/admin/dashboard"
      },
      {
        name: "Restaurant Manager",
        icon: "restaurant",
        to: "/admin/restaurants"
      },
      /**
       * TODO: make the food item manager a subroute of the restaurant
       *  manager
       */
      {
        name: "Food Items Manager",
        icon: "fastfood",
        to: "/admin/food-items"
      },
      {
        name: "User Manager",
        icon: "account_box",
        to: "/admin/users"
      },
      {
        name: "Notification Manager",
        icon: "notifications",
        to: "/admin/notifications"
      }
    ]
  })
};
</script>

<style lang="scss">
#admin {
  padding-top: 64px;

  #route-container {
    padding: 24px;
  }
}
</style>
