<template>
  <v-flex id="menu" xs12 lg10 offset-lg1>
    <OrderStepper :step="3" :restaurant="restaurant" />

    <!-- TODO: move to separate component. remember to move styles. -->
    <div id="header">
      <v-parallax :src="restaurant.headerImageURL" height="parallaxHeight" v-if="!loadingHeader">
        <v-container>
          <v-layout align-center justify-space-between row wrap fill-height>
            <v-flex xs12 sm6 md5 id="logo-container" class="mb-4">
              <v-img :src="restaurant.logoURL" :class="{ center: $vuetify.breakpoint.xs }" />
            </v-flex>
            <v-flex xs12 sm6 md7 style="text-align: left" class="mb-4">
              <h1
                class="display-2 font-weight-bold text-xs-center text-md-left"
              >{{ restaurant.name }}</h1>
              <div id="restaurant-tags">
                <v-chip
                  v-for="tag of restaurant.tags"
                  color="primary"
                  class="white--text"
                  :key="tag"
                >{{ tag }}</v-chip>
              </div>

              <v-layout row>
                <v-flex class="restaurant-detail" shrink>
                  <OpeningTimes :times="restaurant.openingHours" :chip="true" />
                </v-flex>
                <v-flex class="restaurant-detail" shrink style="text-align: center">
                  <v-icon class="restaurant-icon mb-1" color="white" style="display: block">check</v-icon>No Min Order
                </v-flex>
                <v-flex class="restaurant-detail" shrink style="text-align: center">
                  <v-icon class="restaurant-icon mb-1" color="white" style="display: block">timer</v-icon>30-40 min
                </v-flex>
              </v-layout>
            </v-flex>
          </v-layout>
        </v-container>
      </v-parallax>
      <LoadingSpinner :loading="loadingHeader" class="my-4" />
    </div>

    <ExtrasDialog ref="extras" @addToBasket="addToBasket" @cancel="showingExtrasDialog = false" />

    <div id="content">
      <!-- Tabs along the top of the page -->
      <affix
        ref="affix"
        relative-element-selector="#content"
        style="z-index: 50"
        :offset="{ top: 0, bottom: 0 }"
      >
        <div id="tabs-background" :style="tabsStyle" />
        <v-tabs id="tabs" show-arrows left slider-color="primary" :style="tabsStyle">
          <v-tab
            v-for="(c, id) in categories"
            :key="id"
            v-scroll-to="'#category-' + id"
          >{{ c.name }}</v-tab>
        </v-tabs>
      </affix>

      <v-layout row wrap>
        <v-flex xs12 md8 lg9>
          <div id="foodtypes" v-if="!loadingFoodItems" :style="foodtypesStyle">
            <!-- Section for each food type -->
            <div class="foodtype" v-for="(c, id) in categories" :key="id" :id="'category-' + id">
              <!-- Section title -->
              <h2 class="display-1 font-weight-bold">{{ c.name }}</h2>

              <h2 v-if="c.description" class="title">{{ c.description }}</h2>

              <!-- Cards for each food item -->
              <v-container grid-list-xl>
                <v-layout row wrap align-space-around fill-height>
                  <!-- fi short for foodItem -->
                  <v-flex v-for="fi in foodItemsByCategory[c.id]" :key="fi.id" xs12 sm6>
                    <FoodItemCard @select="selectItem(fi)" :foodItem="fi" />
                  </v-flex>
                </v-layout>
              </v-container>
            </div>
          </div>
          <div v-else style="width: 100%">
            <v-progress-circular
              indeterminate
              color="primary"
              size="64"
              style="display: block; margin: auto"
            />
          </div>
        </v-flex>

        <!-- Basket column -->
        <v-flex xs12 md4 lg3 v-if="$vuetify.breakpoint.mdAndUp">
          <affix relative-element-selector="#content" :offset="{ top: 0, bottom: 0 }">
            <Basket style="z-index: 100; position: absolute" :style="basketStyle" />
          </affix>
        </v-flex>

        <v-flex xs12 v-if="$vuetify.breakpoint.smAndDown">
          <v-bottom-sheet inset v-model="showBasketSheet">
            <v-card tile>
              <Basket :disableCheckoutButton="disableCheckoutButton" />
            </v-card>
          </v-bottom-sheet>
          <v-footer
            fixed
            height="48"
            style="background-color: transparent; z-index: 1000"
            v-show="showButtons"
          >
            <v-scale-transition origin="center center">
              <v-btn
                absolute
                dark
                fab
                top
                right
                color="accent"
                :small="$vuetify.breakpoint.smAndDown"
                :class="$vuetify.breakpoint.mdAndUp ? ['mr-3'] : []"
                :style="$vuetify.breakpoint.smAndDown ? { marginTop: showBasketButton ? '-64px' : '', marginRight: '12px' } : {}"
                @click="scrollToTop()"
                v-show="showScrollButton"
              >
                <v-icon>arrow_upward</v-icon>
              </v-btn>
            </v-scale-transition>

            <v-scale-transition origin="center center">
              <v-btn
                absolute
                dark
                fab
                top
                right
                color="primary"
                class="mr-1"
                v-if="$vuetify.breakpoint.smAndDown"
                v-show="showBasketButton"
                @click="showBasket()"
              >
                <v-badge color="accent" left>
                  <span slot="badge">{{ basketQuantity }}</span>
                  <v-icon>shopping_cart</v-icon>
                </v-badge>
              </v-btn>
            </v-scale-transition>
          </v-footer>
        </v-flex>
      </v-layout>
    </div>
  </v-flex>
</template>

<script>
import { mapGetters } from "vuex";
import config from "@/config";
import Basket from "@/components/Basket";
import ExtrasDialog from "@/components/menu/ExtrasDialog";
import FoodItemCard from "@/components/menu/FoodItemCard";
import LoadingSpinner from "@/components/LoadingSpinner";
import OpeningTimes from "@/components/OpeningTimes";
import OrderStepper from "@/components/OrderStepper";

export default {
  name: "Menu",
  components: {
    Basket,
    ExtrasDialog,
    FoodItemCard,
    LoadingSpinner,
    OpeningTimes,
    OrderStepper
  },
  data: () => ({
    restaurant: {},
    categories: [],
    foodItems: [],
    dialog: false,

    categoryList: [],
    foodItemsByCategory: {},

    loadingHeader: true,
    loadingFoodItems: true,

    parallaxHeight: document.documentElement.clientHeight * 0.4,
    showBasketSheet: false,
    showingExtrasDialog: false,
    disableCheckoutButton: false,
    scrolling: false,
    showScrollButton: false,
    scrollInterval: undefined,
    hideFooter: false
  }),
  computed: {
    ...mapGetters(["basket", "restaurantRef"]),
    showBasketButton() {
      return this.basket.length > 0;
    },
    showButtons() {
      return !this.showBasketSheet && !this.showingExtrasDialog;
    },
    basketQuantity() {
      return this.basket
        ? this.basket.map(item => item.quantity).reduce((x, y) => x + y, 0)
        : 0;
    },
    foodtypesStyle() {
      const affix = this.$refs.affix;
      const currentState = affix ? affix.currentState : undefined;
      return currentState === "affix" ? { paddingTop: "64px" } : {};
    },
    /**
     * The width of the tab bar has to be specified exactly since
     *  the affix class causes the element to lose its relative
     *  width (see: https://github.com/eddiemf/vue-affix#usage).
     *
     * FIXME: This is complicated and and alternative should be found.
     */
    tabsStyle() {
      let width;
      switch (this.$vuetify.breakpoint.name) {
        default:
        case "xs":
        case "sm":
          width = "100vw";
          break;
        case "md":
          width = "calc(66.66vw - 8px)";
          break;
        case "lg":
        case "xl":
          // This value is weird, but it's because on lg and xl
          //  devices the page is inset by 1 on both sides
          //  so it is (10/12)ths the normal width (so instead
          //  75vw the tabs iare (10/12) * 75vw = 62.5vw
          width = "calc(62.5vw - 8px)";
          break;
      }
      return { width };
    },
    /**
     * The width of the basket has to be specified exactly since
     *  the affix class causes the element to lose its relative
     *  width (see: https://github.com/eddiemf/vue-affix#usage).
     *
     * The normal basket is hidden on xs and sm devices.
     *
     * FIXME: This is complicated and and alternative should be found.
     */
    basketStyle() {
      let width;
      switch (this.$vuetify.breakpoint.name) {
        default:
        case "md":
          width = "33.33vw";
          break;
        case "lg":
        case "xl":
          // This value is weird, but it's because on lg and xl
          //  devices the page is inset by 1 on both sides
          //  so it is (10/12)ths the normal width (so instead
          //  25vw the basket is (10/12) * 25vw = 20.6vw
          width = "20.6vw";
          break;
      }
      return { width };
    }
  },
  methods: {
    /**
     * When a food item is clicked either open the extras dialog
     *  for this item or add it to the basket.
     */
    selectItem(item) {
      if (item.deals.length > 0 || Object.keys(item.properties).length > 0) {
        this.showingExtrasDialog = true;
        this.$refs.extras.openDialog(item);
      } else {
        this.addToBasket(item);
      }
    },
    addToBasket(item) {
      this.$store.dispatch("ADD_BASKET_ITEM", item);
      this.showingExtrasDialog = false;
    },
    scrollToTop() {
      this.scrolling = true;
      this.$vuetify.goTo(0);
      setTimeout(() => {
        this.scrolling = false;
      }, 1000);
    },
    /**
     * Update the state of the 'scroll to top' button. If the user
     *  has scrolled down by more than their device's height / 2
     *  then it should be visible. Hide the button if the user
     *  already clicked the scroll button (until this.scrolling
     *  returns to false).
     */
    updateScrollButton() {
      if (this.scrolling) return;

      const scroll = document.documentElement.scrollTop;
      const height = window.screen.height;

      this.showScrollButton = scroll > height / 2 && !this.scrolling;
    },
    showBasket() {
      this.showBasketSheet = true;

      // Disable checkout button temporary to prevent double-tap
      //  from checking out (on xs devices)
      if (this.$vuetify.breakpoint.xsOnly) {
        this.disableCheckoutButton = true;
        const vm = this;
        setTimeout(function() {
          vm.disableCheckoutButton = false;
        }, 400);
      }
    }
  },
  created() {
    this.$bind("restaurant", this.restaurantRef);
    this.$bind("categories", this.restaurantRef.collection("categories"));
    this.$bind("foodItems", this.restaurantRef.collection("food-items")).then(
      foodItems => {
        const foodItemsByCategory = {};
        const categories = {};

        if (!foodItems || foodItems.length === 0) {
          // TODO: Show UI which explains that there are no food items

          this.categoryList = [];
          this.foodItemsByCategory = {};
          this.loadingHeader = false;
          this.loadingFoodItems = false;

          console.debug("No food items for this restaurant");
          return;
        }

        foodItems.forEach(item => {
          // Add category name to list
          const category = item.category;

          // If this category is hidden do not process the item,
          //  unless the user is on the development site
          if (
            category.hidden &&
            config.environment !== "development" &&
            config.environment !== "local"
          ) {
            return;
          }

          categories[category.id] = category;

          // Add food item to category map
          const list = foodItemsByCategory[category.id] || [];
          const foodItem = Object.assign({ id: item.id }, item);

          /**
           * Merge all item specific properties into the category's
           *  deals array, adding them to the end of the array.
           */
          foodItem.deals = item.deals || category.deals || [];

          /**
           * Merge all item specific properties into the category's
           *  properties object, overwriting properties which already
           *  exists with the data from the food item.
           */
          let properties = category.properties || {};
          if (item.properties) {
            Object.keys(item.properties).forEach(property => {
              properties[property] = item.properties[property];
            });
          }
          foodItem.properties = properties;

          /**
           * If the item has a custom property order, overwrite the
           *  category property order.
           */
          let order = category.order || [];
          if (item.order) {
            order = item.order;
          }
          foodItem.order = order;

          foodItem.label = "";

          list.push(foodItem);
          foodItemsByCategory[category.id] = list;
        });

        this.categories = categories;
        this.foodItemsByCategory = foodItemsByCategory;
        this.loadingHeader = false;
        this.loadingFoodItems = false;
      }
    );

    this.scrollInterval = setInterval(this.updateScrollButton, 250);
  },
  beforeDestroy() {
    clearInterval(this.scrollInterval);
  }
};
</script>

<style lang="scss">
#menu {
  margin-top: 56px;

  #content {
    background-color: #f5f5f5;

    #tabs-background {
      background-color: #ffffff;
      box-shadow: 0 4px 8px -8px #000000;
      height: 64px;
      position: absolute;
    }

    .v-tabs__bar {
      padding-left: 12px;
      padding-right: 32px;

      .v-tabs__container {
        height: 64px;

        .v-tabs__slider {
          height: 3px;
        }
      }

      .v-tabs__icon--prev {
        padding-left: 12px;
      }

      .v-tabs__icon--next {
        padding-right: 40px;
      }
    }

    #basket {
      margin-top: -64px;

      .v-card {
        box-shadow: 0 3px 1px -2px rgba(0, 0, 0, 0.2),
          2px 2px 2px 0px rgba(0, 0, 0, 0.14) !important;
      }
    }

    #foodtypes {
      .foodtype {
        padding: 16px;
        margin: 16px;

        h2 {
          margin-bottom: 12px;
        }

        .container {
          padding: 8px 0;

          .flex {
            padding: 6px;
          }
        }
      }
    }
  }

  #header {
    .v-parallax__image-container {
      img {
        filter: brightness(58%);
        z-index: 10;
      }
    }

    .v-parallax {
      padding: 0 0;
      height: auto !important;
    }

    .restaurant-detail {
      margin: auto 16px auto 0;
      font-weight: 500;

      .v-icon {
        line-height: 20px;
      }
    }

    .restaurant-icon {
      margin: 0 6px;
    }

    #logo-container {
      float: left;
      overflow: hidden;
      padding: 16px;

      .v-image {
        border-radius: 3px;
        box-shadow: 0px 4px 4px #00000040;
        display: block;
        filter: none;
        max-height: 24vh;
        max-width: 384px;
        width: 100%;
      }

      .center {
        margin-left: auto;
        margin-right: auto;
      }
    }

    #restaurant-tags {
      margin: 12px 0;

      .v-chip {
        padding: 0 4px;
      }
    }
  }

  .v-badge {
    height: 40px;
  }
}
</style>
