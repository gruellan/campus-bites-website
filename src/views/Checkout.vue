<template>
  <div id="checkout">
    <OrderStepper :step="4" :restaurant="restaurant" />
    <div id="content">
      <v-layout row wrap>
        <v-flex xs12 md8 lg7 xl5 offset-xl1>
          <!-- Header -->
          <div class="checkout-header">
            <v-card-title title primary-title>
              <v-flex>
                <h1 id="checkout-title">CHECKOUT</h1>
                <h2>
                  <v-icon class="restaurant-icon" color="white">timer</v-icon>30-40 minutes
                </h2>
                <h2>{{ restaurant.name }}</h2>
              </v-flex>
            </v-card-title>
          </div>

          <Basket v-if="$vuetify.breakpoint.smAndDown" class="ma-4" :checkout="true" />

          <!-- Content -->
          <v-card class="box pa-3 pt-4 ma-4">
            <div id="delivery-info">
              <v-container>
                <v-form ref="form" v-model="formValid">
                  <v-layout wrap row>
                    <v-flex xs12 sm9 class="mb-3">
                      <h2>Delivery Location</h2>
                      <h3>
                        Please note that you must meet your courier at the entrance to your building. Campus Bites
                        couriers will not enter the building.
                      </h3>
                    </v-flex>

                    <v-flex xs12 sm9 md7 lg9>
                      <v-select
                        outline
                        v-model="college"
                        :items="colleges"
                        item-value="id"
                        item-text="name"
                        :rules="required"
                        label="Select your college"
                        prepend-inner-icon="home"
                      />
                    </v-flex>

                    <v-flex xs12 sm9 lg12 class="mb-2">
                      <v-text-field
                        v-model="deliveryLocation.address"
                        label="Building name/number"
                        outline
                        persistent-hint
                        :rules="required"
                      />
                    </v-flex>

                    <v-flex xs12 sm9 lg12 class="mb-2">
                      <v-textarea
                        v-model="deliveryLocation.instructions"
                        label="Delivery instructions"
                        persistent-hint
                        hint="For example, you can say 'Press the Flat 12 buzzer when you arrive'"
                        outline
                      />
                    </v-flex>

                    <v-flex xs12 sm9 lg12 class="mb-2">
                      <v-textarea
                        v-model="deliveryLocation.allergies"
                        label="Allergy information"
                        persistent-hint
                        hint="Let us know if you have any allergies"
                        outline
                      />
                    </v-flex>

                    <v-flex xs12 sm9 lg12 class="mt-4 mb-3">
                      <h2>Personal Information</h2>
                    </v-flex>

                    <v-flex xs12 sm9 md7 lg9 class="mb-2">
                      <v-text-field
                        label="Name"
                        :value="user.displayName"
                        outline
                        flat
                        disabled
                        persistent-hint
                        hint="You can change your name in My Account."
                      />
                    </v-flex>

                    <v-flex xs12 sm9 md7 lg9 class="mb-2">
                      <v-text-field
                        :value="user.email"
                        prepend-inner-icon="email"
                        outline
                        label="Email address"
                        persistent-hint
                        disabled
                        hint="We will send you a receipt to this address. You can change it in My Account."
                      />
                    </v-flex>

                    <v-flex xs12 sm9 md7 lg9>
                      <v-text-field
                        v-model="phone"
                        prepend-inner-icon="phone"
                        outline
                        label="Phone number"
                        persistent-hint
                        hint="We may need this to contact you if there is a problem
                        with your order. This should be a UK or EU phone number."
                        :rules="phoneRules"
                      />
                    </v-flex>

                    <v-flex xs12 sm9 lg12 class="mt-4">
                      <h2>Payment Information</h2>
                    </v-flex>

                    <v-flex xs12>
                      <v-radio-group v-model="paymentInformation.cash" label="Payment Method">
                        <v-radio label="Card" :value="false" />
                        <v-radio label="Cash on delivery" :value="true" />
                      </v-radio-group>
                    </v-flex>

                    <template v-if="!paymentInformation.cash">
                      <v-flex xs12 sm9 lg12>
                        <v-select
                          v-if="checkForCards == false"
                          label="Payment method"
                          :placeholder="`No payment method linked to this account`"
                          solo
                          hide-details
                          v-model="paymentInformation.source"
                          clearable
                          disabled
                          required
                        ></v-select>
                        <v-select
                          v-else
                          label="Payment method"
                          :placeholder="`Use default ${sources[0] ? `(${sources[0].brand} ending in ${sources[0].last4})` : ''}`"
                          solo
                          hide-details
                          v-model="paymentInformation.source"
                          clearable
                          :items="sources"
                          item-value="id"
                          item-text="last4"
                          required
                        >
                          <template slot="selection" slot-scope="data">
                            <v-list-tile>{{data.item.brand}}</v-list-tile>
                            <v-list-tile-content>
                              <v-list-tile-title>
                                <b>Ending in</b>
                                {{data.item.last4}}
                              </v-list-tile-title>
                              <v-list-tile-sub-title>{{data.item.exp_month}}/{{data.item.exp_year}}</v-list-tile-sub-title>
                            </v-list-tile-content>
                          </template>

                          <template slot="item" slot-scope="data">
                            <v-list-tile>{{data.item.brand}}</v-list-tile>
                            <v-list-tile-content>
                              <v-list-tile-title>
                                <b>Ending in</b>
                                {{data.item.last4}}
                              </v-list-tile-title>
                              <v-list-tile-sub-title>{{data.item.exp_month}}/{{data.item.exp_year}}</v-list-tile-sub-title>
                            </v-list-tile-content>
                          </template>
                        </v-select>
                      </v-flex>

                      <v-flex xs12 sm9 lg12 class="mt-3">
                        <v-expansion-panel>
                          <v-expansion-panel-content solo class="pa-2">
                            <div slot="header">Add a new payment method</div>
                            <h2>Payment Details</h2>

                            <!-- TODO: We need to use Stripe Elements -->
                            <v-flex xs12 md12>
                              <v-text-field v-model="newCard.number" label="Card Number" />
                            </v-flex>
                            <v-layout wrap row>
                              <v-flex xs12 md12>
                                <h4 class="title">Expiry Date</h4>
                              </v-flex>
                              <v-flex xs6 md6>
                                <v-text-field v-model="newCard.exp_month" label="Month" />
                              </v-flex>
                              <v-flex xs6 md6>
                                <v-text-field v-model="newCard.exp_year" label="Year" />
                              </v-flex>
                              <v-flex xs12 md12 id="cvc">
                                <v-text-field v-model="newCard.cvc" label="CVC" />
                              </v-flex>
                            </v-layout>
                            <v-btn
                              color="primary"
                              v-on:click="submitNewCard"
                            >Add card to your account</v-btn>
                            {{ newCard.error }}
                          </v-expansion-panel-content>
                        </v-expansion-panel>
                      </v-flex>
                    </template>

                    <!--T&C checkbox-->
                    <v-flex xs12 sm9 md7 lg9>
                      <v-checkbox
                        v-model="confirmTC"
                        :rules="[v => !!v || 'You must agree to continue!']"
                      >
                        <div slot="label">
                          I agree to the
                          <a target="_blank" href="/terms">Terms and Conditions</a> of Campus Bites (last
                          updated 20th February 2019.)
                          <v-tooltip bottom>Opens in new window</v-tooltip>
                        </div>
                      </v-checkbox>
                    </v-flex>
                  </v-layout>
                </v-form>
              </v-container>
            </div>
            <div class="text-xs-center">
              <v-container>
                <v-btn
                  color="primary"
                  @click="submitCharge"
                  :disabled="((!formValid && !confirmTC ) || !college)"
                  :loading="checkoutLoading"
                  large
                >
                  <v-icon style="margin: 0 4px 0 -4px">lock</v-icon>
                  Confirm and Pay {{ basketTotal | price }}
                </v-btn>
              </v-container>
            </div>
          </v-card>
        </v-flex>

        <v-flex md4 lg3 offset-lg1 class="pa-2 pt-4" v-if="$vuetify.breakpoint.mdAndUp">
          <Basket :checkout="true" />
        </v-flex>
      </v-layout>
    </div>
    <div id="background-skew"></div>
    <div id="spacer"></div>
  </div>
</template>

<script>
import { mapGetters } from "vuex";
import { firestore } from "@/plugins";
import Basket from "@/components/Basket";
import OrderStepper from "@/components/OrderStepper";

Stripe.setPublishableKey("pk_test_rDQCfYZs4yALehnmLDeXBdWa");

export default {
  name: "Checkout",
  components: {
    Basket,
    OrderStepper
  },
  data: () => ({
    checkoutLoading: false,
    colleges: [],
    restaurant: [],
    sources: [],
    cards: [],
    deliveryLocation: {
      address: "",
      instructions: "",
      allergies: ""
    },
    paymentInformation: {
      cash: false,
      source: undefined
    },
    newCard: {
      number: "",
      cvc: "",
      exp_month: "",
      exp_year: ""
    },
    formValid: false,
    required: [v => !!v || "This field is required"],
    phoneRules: [
      v => !!v || "This field is required",
      v => !isNaN(v) || "Please enter a valid phone number"
    ],
    phone: "",
    dialog: false,
    newCollege: "",
    confirmTC: false
  }),
  firestore: {
    colleges: firestore.collection("colleges").orderBy("name")
  },
  computed: {
    ...mapGetters([
      "basket",
      "collegeFee",
      "collegeName",
      "restaurantRef",
      "user",
      "userRef"
    ]),
    basketTotal() {
      return this.basketSubTotal + this.collegeFee;
    },
    basketSubTotal() {
      return this.basket.map(i => i.price).reduce((x, y) => x + y, 0);
    },
    checkForCards() {
      console.log(this.sources);

      if (this.sources.length < 1) {
        return false;
      } else {
        return true;
      }
    },
    college: {
      get() {
        return this.$store.getters.college;
      },
      set(value) {
        this.dialog = true;
        this.newCollege = value;
      }
    }
  },
  created() {
    this.$bind("restaurant", this.restaurantRef);
    this.$bind("sources", this.userRef.collection("sources"));

    this.phone = this.$store.getters.user.phoneNumber;
  },
  methods: {
    acceptCollegeDialog: function() {
      this.dialog = false;
      const college = this.colleges.find(obj => obj.id === this.newCollege);
      this.$store.dispatch("SET_COLLEGE", college);
    },
    submitNewCard() {
      Stripe.card.createToken(
        {
          number: this.newCard.number,
          cvc: this.newCard.cvc,
          exp_month: this.newCard.exp_month,
          exp_year: this.newCard.exp_year
        },
        (status, response) => {
          if (response.error) {
            this.newCard.error = response.error.message;
          } else {
            this.userRef
              .collection("tokens")
              .add({
                token: response.id
              })
              .then(() => {
                this.newCard = {
                  number: "",
                  cvc: "",
                  exp_month: "",
                  exp_year: ""
                };
              })
              .catch(() =>
                console.log("Error with adding token to user object")
              );
          }
        }
      );
    },
    generateRandomNumber: function() {
      let randomNumber = new Date().getUTCMilliseconds();
      randomNumber =
        randomNumber * randomNumber +
        Math.round(Math.floor(Math.random() * (100 * 500) + 100));
      let stringRandomNumber = randomNumber.toString();
      if (stringRandomNumber.length < 10) {
        let toAppend = 10 - stringRandomNumber.length;
        for (var i = 0; i < toAppend; i++) {
          stringRandomNumber = "0" + stringRandomNumber;
        }
      }
      return stringRandomNumber;
    },
    async submitCharge() {
      if (!this.$refs.form.validate()) {
        return;
      }

      this.checkoutLoading = true;
      // Update the user's phone number and T&Cs agreement status before
      //  processing the order.

      // TODO: reject the order at this point if the T&Cs were not agreed to
      //  instead of waiting for the cloud function to process this
      await this.userRef.update({
        confirmedTC: this.confirmTC,
        phoneNumber: this.phone
      });

      // Create the charge document under the user's charges subcollection
      const chargesCollectionRef = this.userRef.collection("charges");
      const charge = {
        deliveryLocation: {
          college: this.college,
          address: this.deliveryLocation.address,
          instructions: this.deliveryLocation.instructions,
          allergies: this.deliveryLocation.allergies
        },
        paymentInformation: {
          orderId: this.generateRandomNumber(),
          source:
            this.sources.length === 0
              ? "default"
              : this.paymentInformation.source || "default",
          cash: this.paymentInformation.cash,
          basket: this.basket,
          restaurant: this.restaurantRef,
          clientAmount: this.basketTotal
        }
      };
      const chargeRef = await chargesCollectionRef.add(charge);

      const unsubscribe = chargeRef.onSnapshot(snapshot => {
        const data = snapshot.data();

        // Wait until the cloud function processes the charge and sets either
        //  the error or order fields on the document
        if (!data.hasOwnProperty("error") && !data.hasOwnProperty("order")) {
          return;
        }

        // Once the charge has been processed unsubscribe the snapshot listener
        unsubscribe();

        // If there was an error set, or the payment method was cash and has not
        //  been paid, then send the user to the error page.
        if (data.error || (!this.paymentInformation.cash && !data.paid)) {
          const error = data.error || "Charge not claimed";
          console.error("Order failed:", error);

          this.$router.push({
            name: "error",
            query: {
              message: error,
              caption:
                "You have not been charged. Please contact us for help in resolving this issue."
            }
          });
          return;
        }

        // The order was placed successfully
        this.$router.push({
          name: "success",
          query: {
            type: "order"
          }
        });
      });
    }
  }
};
</script>

<style lang="scss">
#checkout {
  margin-top: 56px;
  background-image: linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6)),
    url("/photos/app/checkout-header-min.jpg");
  background-attachment: fixed;
  background-position: center;
  background-repeat: no-repeat;
  background-size: cover;

  #content {
    position: relative;
    z-index: 2;
  }

  #background-skew {
    background-color: white;
    height: 100vh;
    margin-bottom: -8vh;
    margin-top: -90vh;
    transform: skewY(-3deg);
  }

  #spacer {
    height: 15vh;
    background-color: white;
  }

  .v-stepper {
    padding: 0;
    margin: 0;

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

  .box {
    box-shadow: 0 0 20px 0 rgba(0, 0, 0, 0.2), 0 5px 5px 0 rgba(0, 0, 0, 0.24);
    border-radius: 3px;
    margin-bottom: 32px;
  }

  .checkout-header {
    text-align: center;
    color: white;
  }

  #checkout-title {
    font-size: 60px;
  }

  h3 {
    font-weight: normal;
    padding-bottom: 15px;
  }
}
</style>
