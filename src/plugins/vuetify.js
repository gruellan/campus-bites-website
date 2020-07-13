import Vue from "vue";
import Vuetify from "vuetify";

import "../stylus/main.styl";
import colors from "vuetify/es5/util/colors";

import { library } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import { fas } from "@fortawesome/free-solid-svg-icons";

Vue.use(Vuetify, {
  iconfont: "md",
  theme: {
    primary: "#FF6D1D",
    secondary: colors.deepOrange.darken2,
    accent: "#202A3F"
  },
  options: {
    customProperties: true
  }
});

Vue.component("font-awesome-icon", FontAwesomeIcon); // Register component globally
library.add(fas); // Include needed icons.

Vue.use(Vuetify, {
  iconfont: "faSvg"
});
