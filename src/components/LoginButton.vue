<template>
  <div id="login-button">
    <!-- <v-btn outline color="white" v-if="!hasAuth" @click="$emit('login')">
      <v-icon>lock</v-icon>
      <span class="mr-2">Login</span>
    </v-btn>-->
    <v-dialog
      outline
      color="white"
      v-if="!hasAuth"
      @click="$emit('login')"
      v-model="dialog"
      max-width="290"
    >
      <v-btn slot="activator" color="primary" dark>
        <v-icon>lock</v-icon>
        <span class="mr-2">Login</span>
      </v-btn>
      <v-card>
        <v-card-title class="headline">Login with Campus Bites</v-card-title>
        <!-- Add links to T&C, PP and Cookies -->
        <v-card-text>
          By creating an account on our website, you are agreeing to our Terms and Conditions. Please read
          our Privacy Policy and Cookie Policy.
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary darken-1" flat @click="dialog = false">Disagree</v-btn>
          <v-btn color="primary darken-1" flat @click="$emit('login')">Agree</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-menu bottom left offset-y>
      <v-btn slot="activator" outline color="white" v-if="hasAuth" id="user-button">
        <v-icon>person</v-icon>
        <span class="mr-2 text-truncate" id="username">{{ firstName }}</span>
      </v-btn>

      <v-list>
        <template v-for="route of routes">
          <v-list-tile v-if="testRoute(route)" :key="route.name" :to="route.path">
            <v-list-tile-avatar>
              <v-icon>{{ route.meta.showInUserMenu.icon }}</v-icon>
            </v-list-tile-avatar>
            <v-list-tile-content>
              <v-list-tile-title
                class="grey--text text--darken-3"
              >{{ route.meta.showInUserMenu.name }}</v-list-tile-title>
            </v-list-tile-content>
          </v-list-tile>
        </template>

        <v-list-tile @click="$emit('logout')">
          <v-list-tile-avatar>
            <v-icon color="red">exit_to_app</v-icon>
          </v-list-tile-avatar>
          <v-list-tile-content>
            <v-list-tile-title class="red--text">Logout</v-list-tile-title>
          </v-list-tile-content>
        </v-list-tile>
      </v-list>
    </v-menu>
  </div>
</template>

<script>
import { mapGetters } from "vuex";
import { userMenuRoutes } from "@/router";

export default {
  name: "LoginButton",
  computed: {
    ...mapGetters([
      "hasAuth",
      "displayName",
      "isAdmin",
      "isCourier",
      "isManager"
    ]),
    firstName() {
      return this.displayName ? this.displayName.split(" ")[0] : "";
    },
    routes: {
      get() {
        return userMenuRoutes;
      }
    }
  },
  data() {
    return {
      dialog: false
    };
  },
  methods: {
    testRoute(route) {
      const tests = Object.keys(route.meta);
      let result = true;
      for (const test of tests) {
        switch (test) {
          case "requiresAuth":
            result = result && this.hasAuth;
            break;
          case "requiresAdmin":
            result = result && this.isAdmin;
            break;
          case "requiresManager":
            result = result && this.isManager;
            break;
          case "requiresCourier":
            result = result && this.isCourier;
            break;
          default:
            break;
        }
      }
      return result;
    }
  }
};
</script>

<style lang="scss">
#login-button {
  .v-btn {
    padding-left: 10px;
    padding-right: 10px;
    margin-right: -8px;

    .v-icon {
      margin-right: 8px;
    }
  }

  #user-button {
    max-width: 140px;

    #username {
      max-width: 88px;
    }
  }
}
</style>
