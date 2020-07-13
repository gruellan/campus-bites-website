<template>
  <div id="home">
    <div
      id="header"
      :style="{
      'background-attachment': $vuetify.breakpoint.mdAndUp ? 'fixed' : 'scroll',
      'background-image': `linear-gradient(rgba(0, 0, 0, 0.47), rgba(0, 0, 0, 0.47)), url('${config.headerImageURL}')`,
      'min-height': `${fullHeight}px`
    }"
      v-scroll="scrolled"
    >
      <!-- Transparent toolbar to match the spec -->
      <v-toolbar id="nav-bar" app class="white--text transparent-background" fixed>
        <slot></slot>
      </v-toolbar>

      <!-- Fast campus delivery on demand.. (onboarding form) -->
      <v-container fluid>
        <v-layout column id="onboarding">
          <v-flex class="vert-spacer big"></v-flex>

          <!-- Onboarding form -->
          <v-flex xs12 md8 style="padding: 0 4vw">
            <h1 id="title" class="text-uppercase display-3 white--text">
              Lancaster's On-campus Food delivery Service
            </h1>
          </v-flex>


          <v-flex align-self-center class="justify-center row">
          <v-btn align-self-center color="primary" @click="goToRestaurants()">Order Now</v-btn>
          </v-flex>

          <!-- Onboarding process diagram -->
          <v-flex id="onboarding-diagram" align-self-center>
            <img id="diagram" :src="config.deliveryDiagramURL" alt="Delivery process diagram" />
          </v-flex>
          <v-flex align-self-center justify-end>
            <v-icon @click="$vuetify.goTo('#app-footer-bottom')" class="arrow">keyboard_arrow_down</v-icon>
          </v-flex>
        </v-layout>
      </v-container>

      <!-- Beta service disclaimer -->
      <v-snackbar
        id="disclaimer"
        class="primary white--text"
        v-if="config.disclaimer && config.disclaimer.enabled"
        v-model="disclaimer"
        bottom
        :timeout="timeout"
      >
        <p>
          <v-icon color="white">{{ config.disclaimer.icon }}</v-icon>
          {{ config.disclaimer.message }}
        </p>
        <v-btn color="white" flat @click="disclaimer = false">Close</v-btn>
      </v-snackbar>
    </div>
        <!-- Popular locations -->
    <div id="popular-restaurants">
      <v-layout row wrap>
        <v-flex xs12 xl10 offset-xl1>
          <v-container grid-list-xl>
            <v-layout row wrap v-show="loaded">
              <v-flex xs12 style="text-align: center">
                <h1 class="display-1" id="title">Our Partnered Restaurants</h1>
              </v-flex>
              <v-flex id="restaurant-list" xs12 md6 lg4 grow v-for="r of config.ourRestaurants" :key="r.name">
                <RestaurantCard :restaurant="r"  @click="goToRestaurants()"/>
              </v-flex>
            </v-layout>
            <div v-if="!loaded" style="width: 100%">
              <v-progress-circular indeterminate color="primary" size="64" style="display: block; margin: auto"/>
            </div>
          </v-container>
        </v-flex>
      </v-layout>
    </div>

    <div id="bottom-header">
      <v-layout row wrap>
        <v-flex md6 xs12 class="text-xs-center pa-3">
          <v-card>
            <CampusBitesOpeningTimes :filter="{ hideClosed: true, alwaysShowToday: true }" />
          </v-card>
        </v-flex>
        <v-flex md6 xs12 class="text-xs-center pa-3">
          <v-card>
            <h1 class="display-1 pa-2" id="faq-title">Interested in how we operate?</h1>
            <a href="/faq" target="_blank" class>
              <h3>Please read our FAQ</h3>
              <v-icon class="questionicon">question_answer</v-icon>
            </a>
          </v-card>
        </v-flex>
      </v-layout>
    </div>
  </div>
</template>

<script>
import { mapGetters } from "vuex";
import { isCampusBitesOpen } from "@/components/OpeningTimes";
import { firestore } from "@/plugins/firebase";
import RestaurantCard from "@/components/RestaurantCard";
import CampusBitesOpeningTimes from "../components/CampusBitesOpeningTimes";

export default {
  name: "Home",
  components: {
    CampusBitesOpeningTimes,
    RestaurantCard
  },
  data: () => ({
    disclaimer: true,
    dialog: false,
    timeout: 0,
    offsetTop: 0,
    config: {
      headerImageURL: undefined
    },

    colleges: [],
    fullHeight: document.documentElement.clientHeight - 250
  }),
  firestore: {
    config: firestore.collection("config").doc("website")
  },
  created() {
    // sort the list of colleges alphabetically
    this.$bind("colleges", firestore.collection("colleges").orderBy('name'));
  },
  computed: {
    ...mapGetters(["college"]),
    loaded() {
      return this.config;
    },
    buttonDepressed() {
      return !this.$store.getters.college;
    },
    buttonColour() {
      return this.buttonDepressed ? "grey darken-1" : "primary";
    }
  },
  methods: {
    updateCollege(value) {
      if (value) {
        const { name, fee } = this.colleges.find(obj => obj.id === value);
        this.$store.dispatch("SET_COLLEGE", { id: value, name, fee });
      } else {
        this.$store.dispatch("SET_COLLEGE", undefined);
      }
    },
    scrolled(position) {
      this.offsetTop = document.documentElement.scrollTop;
      const element = document.getElementById("nav-bar");
      if (this.offsetTop > element.offsetTop + element.offsetHeight) {
        element.classList.add("nav-fill");
      } else {
        element.classList.remove("nav-fill");
      }
    },
    goToRestaurants() {
      this.$router.push({ name: "locations" });
    },
    checkIfOpen() {
      if (!isCampusBitesOpen()) {
        this.dialog = true;
      } else {
        this.$router.push({ name: "locations" });
      }
    }
  }
};
</script>

<style lang="scss">
.v-content {
  padding: 0 !important;
}

#home {
  #header {
    background-position: center;
    background-size: cover;
    position: relative;
    // z-index: 2;

    .nav-fill {
      background-color: rgb(19, 29, 40) !important;
      transition: 800ms !important;
    }

    #disclaimer {
      text-align: center;
      width: 100%;

      .v-snack__wrapper {
        box-shadow: none;
      }

      .v-snack__content {
        width: 100%;
        background-color: #ff6d1d;
        text-decoration: none !important;
      }

      p {
        margin-bottom: 4px;
        padding: 4px;

        .v-icon {
          margin-right: 4px;
          margin-top: 4px;
          width: 24px;
        }
      }
    }
  }

  #onboarding {
    #title {
      font-size: 9vh !important;
      text-align: center;
      width: 70%;
      margin-left: auto;
      margin-right: auto;
    }

    #onboarding-diagram {
      max-width: 590px;
      padding: 48px 0 0px 0;
      width: 95%;
    }

    .arrow {
      color: white;
      font-size: 50px;
    }
  }

  #bottom-header {
    .v-card {
      .openingTimes {
        font-size: 15px;

        .v-list__tile__title {
          text-align: center;
        }
      }

      a {
        text-decoration: none;
      }

      .questionicon {
        font-size: 60px;
        color: #ff6d1d;
      }
    }
  }

  #popular-restaurants {
    margin: 32px 0;

    .restaurant-item {
      border-radius: 4px;
      z-index: 1;
    }
  }

  #restaurant-list {
    margin-left: auto;
    margin-right: auto;
  }

  .vert-spacer {
    height: 15vw;
    max-height: 15vh;
    min-height: 64px;
  }

  .vert-spacer.big {
    height: 10vw;
    max-height: 17vh;
    min-height: 96px;
  }
}
</style>
