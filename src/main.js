import Vue from "vue";

import config from "./config";
import { store } from "./plugins";
import "./filters";
import router from "./router";

import App from "./App.vue";

Vue.config.productionTip = config.productionTip;
Vue.config.devtools = config.devtools;

new Vue({
  el: "#app",
  store,
  router,
  render: h => h(App),
  beforeCreate() {
    this.$store.dispatch("INITIALISE");
  }
});
