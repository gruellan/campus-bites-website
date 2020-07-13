<template>
  <div id="basket">
    <v-card :class="checkout ? ['pa-4', 'rounded'] : []">
      <!-- Position checkout button at the top on larger devices -->
      <v-btn
        class="checkout-button"
        v-if="!checkout && $vuetify.breakpoint.mdAndUp"
        color="primary"
        @click="checkAuth()"
        :disabled="basket.length == 0 || closed() == true"
        large
        block
        tile
        depressed
      >Go to Checkout</v-btn>
      <h2 v-else id="title">Basket</h2>

      <v-list class="no-select">
        <v-list-tile v-if="basket.length == 0">Your basket is empty</v-list-tile>

        <v-list-tile v-else v-for="item of basket" :key="item.id + item.label" :tall="item.label">
          <v-list-tile-avatar :class="checkout ? ['checkout'] : []">
            <v-icon
              v-if="!checkout"
              class="basket-quantity"
              color="primary"
              size="16"
              @click="decrementQuantity(item)"
            >remove</v-icon>
            <span
              class="basket-count font-weight-bold"
              :class="checkout ? ['checkout'] : []"
            >{{ (checkout ? 'x' : '') + item.quantity }}</span>
            <v-icon
              v-if="!checkout"
              class="basket-quantity"
              color="primary"
              size="16"
              @click="incrementQuantity(item)"
            >add</v-icon>
          </v-list-tile-avatar>

          <div class="basket-item">
            <table>
              <tr>
                <td>
                  {{ item.name }}
                  <div class="grey--text" v-if="item.label">{{ item.label }}</div>
                </td>
                <td class="price">{{ item.price | price(false, true) }}</td>
              </tr>
            </table>
          </div>
        </v-list-tile>

        <v-list-tile v-if="basket.length > 0 && !checkout">
          <div style="text-align: center; width: 100%">
            <v-btn block color="grey darken-1" outline @click="clearBasket()">
              Clear basket
              <v-icon class="ml-2">delete_sweep</v-icon>
            </v-btn>
          </div>
        </v-list-tile>

        <v-divider />

        <v-list-tile class="small">
          <div style="text-align: left; width: 100%">
            Subtotal
            <span style="float: right; margin-right: 4px">{{ basketSubTotal | price }}</span>
          </div>
        </v-list-tile>
        <v-list-tile class="small">
          <div style="text-align: left; width: 100%">
            Delivery fee
            <span
              style="float: right; margin-right: 4px"
            >{{ collegeFee | price }}</span>
          </div>
        </v-list-tile>
        <div v-if="!checkout && alert" class="mb-3">
          <v-alert
            v-model="alert"
            type="warning"
            color="primary"
            outline
          >Delivery fees may vary from term to term</v-alert>
        </div>

        <v-divider />

        <v-list-tile id="total">
          <div class="font-weight-black" style="text-align: left; width: 100%">
            Total
            <span style="float: right; margin-right: 4px">{{ basketTotal | price }}</span>
          </div>
        </v-list-tile>

        <v-list-tile>
          <v-btn
            class="red--text"
            style="margin: auto"
            flat
            @click="allergensDialog = true"
          >Allergen Information</v-btn>
        </v-list-tile>
      </v-list>

      <!-- Position checkout button at the bottom on smaller devices -->

      <v-dialog v-model="allergensDialog" width="500">
        <v-card>
          <v-card-title class="headline grey lighten-2" primary-title>Allergens Notice</v-card-title>
          <v-card-title>
            <v-img :src="allergyImageUrl" />
            <p class="mt-2">
              If you have any allergies please let us know in the 'Allergy information' field on the
              checkout page
            </p>
          </v-card-title>
          <v-divider />
          <v-card-actions>
            <v-spacer />
            <v-btn color="primary" @click="allergensDialog = false">Close</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <v-dialog v-model="dialog" width="500">
        <v-card>
          <v-card-title class="headline grey lighten-2" primary-title>Sorry, we're closed!</v-card-title>
          <v-card-text>
            We are not delivering right now and no orders can be placed. Come back another time!
            <a style="text-decoration:none;" href="/faq">Click here to view our opening times</a>.
          </v-card-text>
          <v-divider></v-divider>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn color="primary" @click="dialog=false">Okay</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <v-btn
        class="checkout-button mt-4"
        v-if="!checkout && $vuetify.breakpoint.smAndDown"
        color="primary"
        @click="checkAuth()"
        :disabled="basket.length === 0 || disableCheckoutButton"
        large
        block
        tile
        depressed
      >Go to Checkout</v-btn>
    </v-card>
  </div>
</template>

<script>
import { mapGetters } from "vuex";
import { storage } from "@/plugins/firebase";
import { isCampusBitesOpen } from "@/components/OpeningTimes";

export default {
  props: ["checkout", "disableCheckoutButton"],
  data: () => ({
    alert: true,
    dialog: false,
    allergensDialog: false,
    allergyImageUrl: ""
  }),
  computed: {
    ...mapGetters([
      "basket",
      "collegeName",
      "collegeFee",
      "isAdmin",
      "hasAuth"
    ]),
    basketTotal() {
      return this.basketSubTotal + this.collegeFee;
    },
    basketSubTotal() {
      return this.basket.map(item => item.price).reduce((x, y) => x + y, 0);
    }
  },
  methods: {
    checkAuth() {
      if (!isCampusBitesOpen() && !this.isAdmin) {
        this.dialog = true;
      } else if (!this.hasAuth) {
        this.$root.$emit("openDialog", "checkout");
      } else {
        this.$router.push("checkout");
      }
    },
    incrementQuantity(item) {
      this.$store.dispatch(
        "ADD_BASKET_ITEM",
        Object.assign({}, item, { quantity: 1 })
      );
    },
    decrementQuantity(item) {
      this.$store.dispatch(
        "REMOVE_BASKET_ITEM",
        Object.assign({}, item, { quantity: 1 })
      );
    },
    clearBasket() {
      this.$store.dispatch("CLEAR_BASKET");
    },
    closed() {
      if (isCampusBitesOpen() == false) {
        return true;
      }
    }
  },
  created() {
    // Get allergy image URL from Firebase Storage
    storage
      .ref("IMG_20190306_210214.jpg")
      .getDownloadURL()
      .then(url => (this.allergyImageUrl = url));
  }
};
</script>

<style lang="scss">
#basket {
  .no-select {
    -webkit-touch-callout: none; /* iOS Safari */
    -webkit-user-select: none; /* Safari */
    -khtml-user-select: none; /* Konqueror HTML */
    -moz-user-select: none; /* Firefox */
    -ms-user-select: none; /* Internet Explorer/Edge */
    user-select: none;
    /* Non-prefixed version, currently
                                         supported by Chrome and Opera */
  }

  .v-card {
    padding: 16px;

    .v-list {
      padding: 0;

      .small {
        .v-list__tile {
          height: 24px;
        }

        .v-list__tile:first-of-type {
          margin-top: 16px;
        }

        .v-list__tile:last-of-type {
          margin-bottom: 16px;
        }
      }

      #total {
        height: 24px;
        margin-top: 12px;
        color: black;
      }

      .v-list__tile.theme--light {
        padding-left: 0;
        padding-right: 0;
      }

      .v-list__tile[tall] {
        height: auto;
      }
    }

    #title {
      margin-bottom: 12px;
    }

    .v-avatar {
      margin-left: 4px;
      min-width: 64px;
      text-align: center;

      .basket-count {
        margin: 0 3px;
        min-width: 20px;
      }

      .basket-count.checkout {
        min-width: 8px;
      }

      .basket-quantity {
        border: 1px solid #ff6d1d;
        border-radius: 10px;
        height: 18px;
        width: 18px;
      }
    }

    .basket-item {
      font-size: 15px;
      padding-left: 20px;
      text-align: left;
      vertical-align: middle;
      width: 100%;

      table {
        width: 100%;

        td {
          padding: 4px;
        }

        .price {
          text-align: right;
          font-weight: 500;
        }
      }
    }

    .checkout {
      min-width: 20px;

      .v-avatar {
        min-width: 20px;
      }
    }

    .checkout-button {
      margin-top: 0;
    }
  }

  .v-card.rounded {
    border-radius: 4px;
  }
}
</style>
