<template>
  <v-app>
    <v-toolbar absolute app class="white--text" color="accent" v-if="!hideToolbar">
      <router-link to="/" class="no-link">
        <v-toolbar-title class="headline font-weight-bold">
          <img class="logo" src="/photos/app/logo-white.svg" />
          <BetaChip />
        </v-toolbar-title>
      </router-link>

      <v-spacer />

      <LoginButton @login="login()" @logout="logout()" />
    </v-toolbar>

    <v-content>
      <transition name="fade">
        <router-view>
          <router-link to="/" class="no-link">
            <v-toolbar-title class="headline font-weight-bold">
              <img class="logo" src="/photos/app/logo-white.svg" />
              <BetaChip />
            </v-toolbar-title>
          </router-link>

          <v-spacer />

          <LoginButton @login="login()" @logout="logout()" />
        </router-view>
      </transition>

      <v-dialog v-model="dialog" width="500" :fullscreen="$vuetify.breakpoint.xsOnly">
        <v-card>
          <v-card-title class="headline grey lighten-2" primary-title>Sign in to Campus Bites</v-card-title>

          <v-card-text>
            <div id="firebaseui-auth-container"></div>
          </v-card-text>

          <v-divider></v-divider>

          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn color="primary" flat @click="dialog = false">Cancel</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </v-content>

    <AppFooter v-if="!hideFooter" />
  </v-app>
</template>

<script>
import { firebaseUi, uiConfig } from "@/plugins/firebase";
import AppFooter from "@/components/AppFooter";
import BetaChip from "@/components/BetaChip";
import LoginButton from "@/components/LoginButton";

export default {
  name: "App",
  components: {
    AppFooter,
    BetaChip,
    LoginButton
  },
  data: () => ({
    startedFirebaseUi: false,
    dialog: false,
    drawer: false
  }),
  computed: {
    hideToolbar() {
      // Some pages, like Home.vue, implement their own toolbar. On these pages
      // the default toolbar should be hidden.
      return this.$route.meta.hideToolbar || false;
    },
    hideFooter() {
      return this.$route.meta.hideFooter || false;
    }
  },
  mounted() {
    this.startFirebaseUi();
  },
  created() {
    this.$root.$on("openDialog", this.login);
  },
  methods: {
    login(route) {
      // store the route name so that we return to this route after login
      // is completed
      this.$store.dispatch("SET_SIGN_IN_REDIRECT", route || this.$route.name);
      this.startFirebaseUi();
      this.dialog = true;
    },
    logout() {
      this.$auth.signOut().then(() => {
        // refresh the page after logout so that state is updated
        window.location.reload();
      });
    },
    startFirebaseUi() {
      if (!this.startedFirebaseUi) {
        // Setup Firebase UI when the page is loaded so that 'Google Yolo' begins
        // immediately (https://developers.google.com/identity/one-tap/web/overview)
        firebaseUi.start("#firebaseui-auth-container", uiConfig);
        this.startedFirebaseUi = true;
      }
    }
  }
};
</script>

<style lang="scss">
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s;
}

.fade-enter, .fade-leave-to /* .fade-leave-active below version 2.1.8 */
 {
  opacity: 0;
}

.no-link {
  color: inherit;
  text-decoration: inherit;
}

.v-content {
  padding: 0 !important;
}

// Don't change the size of the toolbar on different displays
//  because it causes issues with the homepage header
.v-toolbar__content {
  height: 56px !important;
  margin: 0 !important;
  padding: 0 24px !important;

  .logo {
    height: 1.5em;
    margin-bottom: -9px;
  }
}

.transparent-background {
  background-color: rgba(0, 0, 0, 0) !important;
  border-color: rgba(0, 0, 0, 0) !important;
  box-shadow: none !important;
}

.v-stepper__label {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.text-monospaced {
  font-family: "Montserrat" !important;
}

.v-icon {
  display: inline-flex;
  vertical-align: bottom;
}
</style>
