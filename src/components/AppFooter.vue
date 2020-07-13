<template>
  <v-footer id="app-footer" height="auto" color="primary lighten-2">
    <v-layout justify-center row wrap>
      <v-btn
        v-for="link of navLinks"
        :key="link.name"
        color="white"
        flat
        round
        :to="link.to"
      >{{ link.name }}</v-btn>
      <v-flex id="app-footer-bottom" primary py-3 text-xs-center white--text xs12>
        &copy; 2019 —
        <strong>Campus Bites</strong>
      </v-flex>
    </v-layout>
  </v-footer>
</template>

<script>
import { firestore } from "@/plugins";

export default {
  name: "AppFooter",
  data: () => ({
    config: {}
  }),
  firestore: {
    config: firestore.collection("config").doc("global")
  },
  computed: {
    navLinks() {
      return this.config ? this.config.navLinks : [];
    }
  }
};
</script>
<style lang="scss">
#app-footer {
  #app-footer-bottom {
    padding-bottom: 45px !important;
  }
}
</style>
