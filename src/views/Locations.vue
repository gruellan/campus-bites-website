<template>
  <v-flex id="locations" xs12 lg10 offset-lg1>
    <v-dialog v-model="filtersDialog" fullscreen hide-overlay transition="dialog-bottom-transition">
      <v-card>
        <v-toolbar>
          <v-toolbar-title class="headline font-weight-bold">Filters</v-toolbar-title>
          <v-spacer></v-spacer>
          <v-toolbar-items>
            <v-btn flat icon @click="filtersDialog = false">
              <v-icon>close</v-icon>
            </v-btn>
          </v-toolbar-items>
        </v-toolbar>
        <v-card-text>
          <RestaurantFilters :filterData="filter" />
        </v-card-text>
      </v-card>
    </v-dialog>

    <v-flex id="header" xs12>
      <OrderStepper step="2" />

      <div id="photo" :style="photoStyle" />
    </v-flex>

    <v-layout id="container" row wrap>
      <v-flex id="details" xs12>
        <v-layout row wrap>
          <v-flex xs5 hidden-sm-and-up>
            <v-btn flat icon @click="filtersDialog = true">
              <v-icon>tune</v-icon>
            </v-btn>
          </v-flex>
          <v-flex sm5 sm6 md4 id="locations-count" hidden-xs-only>
            Showing
            <span class="primary--text font-weight-bold">{{ filteredRestaurants.length }}</span> locations so
            far
          </v-flex>

          <v-spacer />

          <v-flex xs7 sm4 md3>
            <v-select
              :items="filter.sortMethods"
              v-model="filter.sortBy"
              placeholder="Sort by"
              hide-details
              clearable
              outline
            ></v-select>
          </v-flex>
        </v-layout>
      </v-flex>

      <v-flex id="filters-container" xs3 sm4 md3 lg2 xl3 hidden-xs-only>
        <RestaurantFilters :filterData="filter" />
      </v-flex>

      <v-flex xs12 sm8 md9 lg10 xl9 offset-sm0 id="restaurants">
        <!-- Grid list of restaurants which match filters -->
        <v-container grid-list-xs justify-space-between fluid>
          <v-layout row wrap v-show="loaded">
            <v-flex xs12 md6 lg4 v-for="r of filteredRestaurants" :key="r.id">
              <RestaurantCard @click="choose(r)" :restaurant="r" ripple />

              <!-- <v-dialog v-model="r.dialog"
                width="500"
              >

                <v-card>
                  <v-card-title class="headline grey lighten-2" primary-title>This restaurant is closed</v-card-title>
                  <v-card-text>Sorry this restaurant is closed and no orders can be placed. Would you like to view their menu anyway?</v-card-text>
                  <v-divider></v-divider>
                  <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn color="primary"  @click="choose(r)">Yes</v-btn>
                    <v-btn color="primary"  @click="r.dialog=false">No</v-btn>
                  </v-card-actions>
                </v-card>
              </v-dialog>-->
            </v-flex>
          </v-layout>
          <div v-if="!loaded" style="width: 100%">
            <v-progress-circular
              indeterminate
              color="primary"
              size="64"
              style="display: block; margin: auto"
            ></v-progress-circular>
          </div>
        </v-container>

        <!-- Grid list of 'coming soon' restaurants -->
        <div class="ml-3">
          <h2 class="title mb-1">Coming soon</h2>
          <p>We're still working on making these restaurants available, but you'll hear about them soon!</p>
        </div>
        <v-container grid-list-xs justify-space-between fluid>
          <v-layout row wrap v-show="loaded">
            <v-flex xs12 md6 lg4 v-for="r of comingSoonRestaurants" :key="r.name">
              <RestaurantCard :restaurant="r" :disabled="true" />
            </v-flex>
          </v-layout>
        </v-container>
      </v-flex>
    </v-layout>
  </v-flex>
</template>

<script>
import { mapGetters } from "vuex";
import { firestore } from "@/plugins/firebase";
import { isRestaurantOpen } from "@/components/OpeningTimes";
import RestaurantCard from "@/components/RestaurantCard";
import RestaurantFilters from "@/components/RestaurantFilters";
import OrderStepper from "@/components/OrderStepper";

export default {
  name: "Locations",
  components: {
    RestaurantCard,
    RestaurantFilters,
    OrderStepper
  },
  data: () => ({
    dialog: false,
    config: {
      headerImageURL: undefined
    },
    filtersDialog: false,
    filter: {
      tags: ["All"],
      tag: "All",
      sortMethods: ["Alphabetical (A-Z)", "Alphabetical (Z-A)"],
      sortBy: "",
      showClosed: true
    },
    restaurants: [],
    comingSoonRestaurants: []
  }),
  firestore: {
    config: firestore.collection("config").doc("locations"),
    restaurants: firestore
      .collection("restaurants")
      .where("comingSoon", "==", false),
    comingSoonRestaurants: firestore
      .collection("restaurants")
      .where("comingSoon", "==", true)
  },
  computed: {
    ...mapGetters(["isAdmin"]),
    // Is the restaurants array populated
    loaded() {
      return !!this.filteredRestaurants && this.filter.tags.length > 1;
    },
    // Handles the filters
    filteredRestaurants() {
      // Set up references
      const restaurants = this.restaurants;
      const tag = this.filter.tag;
      const showClosed = this.filter.showClosed;
      const sortBy = this.filter.sortBy;

      // Temp var to hold filtered results
      let filtered = [];

      if (tag === "All") {
        // Populate filtered
        filtered = restaurants.filter(() => true);
      } else {
        // Returns only restaurants with selected tag
        filtered = restaurants.filter(r =>
          r.tags ? r.tags.indexOf(tag) > -1 : false
        );
      }

      // Show only open restaurants if box unchecked
      if (!showClosed) {
        filtered = filtered.filter(r => isRestaurantOpen(r));
      }

      // Order the restaurants by sorting method
      switch (sortBy) {
        default:
        case "Alphabetical (A-Z)":
          filtered.sort(this.dynamicSort("name"));
          break;
        case "Alphabetical (Z-A)":
          filtered.sort(this.dynamicSort("-name"));
          break;
      }

      return filtered;
    },
    photoStyle() {
      return {
        backgroundImage: `url('${this.config.headerImageURL}')`,
        backgroundSize: "cover",
        backgroundPositionY: "center"
      };
    }
  },
  methods: {
    choose(restaurant) {
      this.$store
        .dispatch("CLEAR_BASKET")
        .then(() => this.$store.dispatch("SET_RESTAURANT_UID", restaurant.id))
        .then(() => this.$router.push({ name: "menu" }));
    },
    // Function to sort alphabetically an array of objects by some specific key.
    dynamicSort(property) {
      let sortOrder = 1;

      if (property[0] === "-") {
        sortOrder = -1;
        property = property.substr(1);
      }

      return function(a, b) {
        if (sortOrder === -1) {
          return b[property].localeCompare(a[property]);
        } else {
          return a[property].localeCompare(b[property]);
        }
      };
    }
  },
  watch: {
    // Calculates the list of tags across all restaurants
    restaurants() {
      const tags = [];
      for (const restaurant of this.restaurants) {
        for (const tag of restaurant.tags || []) {
          if (tags.indexOf(tag) === -1) {
            tags.push(tag);
          }
        }
      }

      tags.sort();
      tags.unshift("All");

      this.filter.tags = tags;
    }
  }
};
</script>

<style lang="scss">
#locations {
  margin-top: 56px;

  .v-stepper {
    padding: 0;
    margin: 0;
    box-shadow: none;

    .v-stepper__header {
      padding: 2vh 10vw;
      margin: 0;

      .v-stepper__step {
        padding: 12px;
      }
    }

    .v-stepper__content {
      padding: 0;
    }
  }

  #header {
    #photo {
      width: 100%;
      height: 15vh;
    }
  }

  #container {
    #details {
      padding: 8px 24px;
      min-height: 48px;
      border-bottom: solid lightgrey 1px;
      line-height: 40px;

      .v-select {
        margin-top: 2px;
        padding: 0;

        .v-select__selections {
          padding: 0;
          margin: 12px 0;

          .v-select__selection,
          input {
            height: 16px;
            margin: 0;
          }
        }

        .v-input__slot {
          // Remove the min-height set by Vuetify
          min-height: 0;

          .v-input__append-inner {
            // Position the 'dropdown arrow' inside the select box
            //  correctly
            margin-top: 8px;
          }
        }
      }

      #locations-count {
        padding: 4px;
      }
    }

    #filters-container {
      padding: 24px;
    }

    #restaurants {
      .container {
        padding: 8px 12px 32px 8px;
        margin: 4px;

        .flex {
          padding: 4px;
        }
      }

      .disabled {
        -webkit-filter: grayscale(100%);
        filter: grayscale(100%);
      }
    }
  }
}
</style>
