<template>
  <div id="my-account">
    <v-container>
      <h1>My Account</h1>
      <v-flex xs6 id="account-info">
        <v-card color="primary lighten-1" class="account white--text">
          <v-card-title class="account" primary-title>
            <div style="width:100%">
              <div class="headline">Welcome back, {{ user.displayName }}</div>
              <h4>Your email: {{ user.email }}</h4>
              <h4>Your telephone number: {{ user.phoneNumber }}</h4>
            </div>
          </v-card-title>
          <v-card-actions style="width:100%">
            <v-dialog style="width:100%" v-model="dialog" persistent max-width="290" id="delete">
              <v-btn slot="activator" color="white" dark outline>Delete Account</v-btn>
              <v-card>
                <v-card-title class="headline">Are you sure you want to delete your account?</v-card-title>
                <v-card-text>
                  Deleting your account will remove all of your personal data from our site and our database.
                  <br />For more information on what happens to your information, read our Terms and Conditions.
                </v-card-text>
                <v-card-actions>
                  <v-spacer></v-spacer>
                  <v-btn color="primary darken-1" flat @click="dialog = false">No, don't delete</v-btn>
                  <v-btn color="primary darken-1" flat @click="deleteUser()">Yes, I'm sure</v-btn>
                </v-card-actions>
              </v-card>
            </v-dialog>
          </v-card-actions>
        </v-card>
      </v-flex>

      <div id="charges">
        <h2>Previous Orders</h2>
        <v-data-table :headers="headers" :items="charges">
          <template slot="items" slot-scope="props">
            <td>
              <span
                v-if="props.item.paymentInformation.orderId"
              >{{ props.item.paymentInformation.orderId }}</span>
              <span v-else>No order ID for this order.</span>
            </td>
            <td>
              <span v-if="props.item.amount">{{ props.item.amount | price}}</span>
              <span v-else>No price for this order</span>
            </td>
            <td class="text-xs-left">{{ formatDate(props.item.created) }}</td>
            <td class="text-xs-left">
              <span v-if="props.item.error">{{ props.item.error }}</span>
              <span v-else-if="props.item.outcome">
                {{ props.item.outcome.seller_message }}
                <br />
                {{ props.item.source.brand }} &hellip;{{props.item.last4}}(exp. {{ props.item.source.exp_month }}/{{ props.item.source.exp_year }})
              </span>
              <span v-else>Cash</span>
            </td>
            <td class="text-xs-left">
              {{ props.item.deliveryLocation.address }} in {{ props.item.deliveryLocation.college.name }}
              <br />
              <div
                v-if="props.item.deliveryLocation.instructions"
              >Instructions: {{ props.item.deliveryLocation.instructions }}</div>
            </td>
            <td class="text-xs-left">
              <ul>
                <li
                  v-for="(item, id) in props.item.paymentInformation.basket"
                  :key="id"
                >{{ item.name }}: {{ item.price | price }}</li>
                <li v-if="props.item.deliveryLocation">
                  Delivery fee ({{ props.item.deliveryLocation.college.name }}): {{
                  props.item.deliveryLocation.college.fee | price }}
                </li>
              </ul>
            </td>
            <td class="text-xs-center">
              <a v-if="props.item.receipt_url" :href="props.item.receipt_url">Receipt</a>
              <span v-else-if="props.item.paymentInformation.cash && props.item.paid">
                <router-link
                  :to="{path: '/receipt', query:{charge: props.item.paymentInformation.orderId}}"
                  target="_blank"
                >Receipt</router-link>
              </span>
              <span v-else-if="props.item.paymentInformation.cash && !props.item.paid">
                <router-link
                  :to="{path: '/receipt', query:{charge: props.item.paymentInformation.orderId}}"
                  target="_blank"
                >Invoice</router-link>
              </span>
              <span v-else>No receipt for this order</span>
            </td>
          </template>
        </v-data-table>
      </div>
    </v-container>
  </div>
</template>

<script>
import { mapGetters } from "vuex";
import { firestore } from "@/plugins/firebase";

export default {
  name: "MyAccount",
  data: () => ({
    sources: {},
    orders: {},
    charges: [],
    startedFirebaseUi: false,
    dialog: false,
    headers: [
      { text: "Order Number", value: "orderId" },
      {
        text: "Payment Amount",
        align: "left",
        sortable: false,
        value: "name"
      },
      { text: "Date", value: "date" },
      { text: "Payment Method", value: "card" },
      { text: "Delivery Address", value: "address" },
      { text: "Basket", value: "basket" },
      { text: "Receipt", value: "receipt" }
    ]
  }),
  computed: {
    ...mapGetters([
      "collegeFee",
      "collegeName",
      "restaurantUid",
      "user",
      "hasAuth",
      "displayName",
      "isAdmin",
      "isCourier"
    ])
  },
  created() {
    this.$bind(
      "charges",
      firestore
        .collection("users")
        .doc(this.user.uid)
        .collection("charges")
        .orderBy("created", "desc")
    );
    this.$bind("colleges", firestore.collection("colleges").orderBy("name"));
    this.$bind(
      "restaurant",
      firestore.collection("restaurants").doc(this.restaurantUid)
    );
    this.$bind(
      "sources",
      firestore
        .collection("users")
        .doc(this.user.uid)
        .collection("sources")
    );
  },
  methods: {
    formatDate: function(date) {
      let formattedDate = new Date(date * 1000).toLocaleString(undefined, {
        day: "numeric",
        month: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
      return formattedDate;
    },
    submitNewCreditCard: function() {
      Stripe.card.createToken(
        {
          number: this.newCreditCard.number,
          cvc: this.newCreditCard.cvc,
          exp_month: this.newCreditCard.exp_month,
          exp_year: this.newCreditCard.exp_year
          // address_zip: this.newCreditCard.address_zip
        },
        (status, response) => {
          if (response.error) {
            this.newCreditCard.error = response.error.message;
          } else {
            const userDocumentRef = firestore.doc(`users/${this.user.uid}`);
            userDocumentRef
              .collection("tokens")
              .add({ token: response.id })
              .then(() => {
                this.newCreditCard = {
                  number: "",
                  cvc: "",
                  exp_month: 1,
                  exp_year: 2017
                  // address_zip: ''
                };
              });
          }
        }
      );
    },
    deleteUser() {
      // TODO: reauthenticate user
      this.$auth.currentUser.delete().then(() => {
        // refresh the page after logout so that state is updated
        this.$router.push({
          name: "success",
          query: {
            type: "delete"
          }
        });
        window.location.reload();
      });
    }
  }
};
</script>

<style lang="scss">
#my-account {
  padding-top: 56px;

  h4,
  h5 {
    font-weight: normal;
  }

  table {
    font-family: arial, sans-serif;
    border-collapse: collapse;
    width: 100%;
  }

  td,
  th {
    border: 1px solid #dddddd;
    text-align: left;
    padding: 8px;
  }

  tr:nth-child(even) {
    background-color: #d8d8d8;
  }

  #charges {
    margin-top: 56px;
  }

  .account {
    border-radius: 10px;
    text-align: center;
    margin-left: auto;
    margin-right: auto;
  }

  #account-info {
    text-align: center;
    margin-left: auto;
    margin-right: auto;
  }

  h1 {
    text-align: center;
  }
}
</style>
