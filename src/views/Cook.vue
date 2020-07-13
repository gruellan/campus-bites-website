<template>
  <div id="cook-dashboard">
    <v-layout justify-center row wrap>
      <v-flex xs12 md12>
        <h1 class="display-1 ma-2" style="text-align:center;">Cook Dashboard</h1>
        <h3 class="body-1" style="text-align:center;">You are managing {{ restaurant.name }}</h3>

        <v-layout row id="columns">
          <!-- Pending orders -->
          <v-flex xs4 lg4>
            <v-card tile flat color="grey lighten-1 white--text">
              <v-card-text>New</v-card-text>

              <v-card v-if="newOrders.length == 0">
                <v-card-title>
                  <v-icon large left>info</v-icon>
                  <span class="title font-weight-light">There are no pending orders</span>
                </v-card-title>
              </v-card>

              <v-expansion-panel :value="newPanel" expand v-else>
                <v-expansion-panel-content v-for="order of newOrders" :key="order.id">
                  <div slot="actions">
                    <CookOrderStatusChip :order="order" />
                    <v-icon style="vertical-align: middle">$vuetify.icons.expand</v-icon>
                  </div>

                  <div
                    slot="header"
                    class="subheading text-capitalize"
                    v-text="generateOrderTitle(order)"
                  />

                  <CookOrderCard :order="order" />
                </v-expansion-panel-content>
              </v-expansion-panel>
            </v-card>
          </v-flex>

          <!-- In Progress orders -->
          <v-flex xs4 lg4>
            <v-card tile flat color="primary white--text">
              <v-card-text>In Progress</v-card-text>

              <v-card light v-if="currentOrders.length == 0">
                <v-card-title>
                  <v-icon large left>info</v-icon>
                  <span class="title font-weight-light">No orders are in progress</span>
                </v-card-title>
              </v-card>

              <v-expansion-panel :value="currentPanel" expand v-else>
                <v-expansion-panel-content v-for="order of currentOrders" :key="order.id">
                  <div slot="actions">
                    <CookOrderStatusChip :order="order" />
                    <v-icon style="vertical-align: middle">$vuetify.icons.expand</v-icon>
                  </div>

                  <div
                    slot="header"
                    class="subheading text-capitalize"
                    v-text="generateOrderTitle(order)"
                  />

                  <CookOrderCard :order="order" />
                </v-expansion-panel-content>
              </v-expansion-panel>
            </v-card>
          </v-flex>

          <!-- Historical orders -->
          <v-flex xs4 lg4>
            <v-card tile flat color="green white--text">
              <v-card-text>Done</v-card-text>

              <v-card v-if="historicalOrders.length == 0">
                <v-card-title>
                  <v-icon large left>sentiment_dissatisfied</v-icon>
                  <span
                    class="title font-weight-light"
                  >There are no completed orders to show just yet</span>
                </v-card-title>
              </v-card>

              <v-expansion-panel v-else>
                <v-expansion-panel-content v-for="order of historicalOrders" :key="order.id" lazy>
                  <div slot="actions">
                    <v-icon style="vertical-align: middle">$vuetify.icons.expand</v-icon>
                  </div>

                  <div
                    slot="header"
                    class="subheading text-capitalize"
                    v-text="generateOrderTitle(order)"
                  />

                  <CookOrderCard :order="order" />
                </v-expansion-panel-content>
              </v-expansion-panel>
            </v-card>
          </v-flex>
        </v-layout>
      </v-flex>
    </v-layout>
  </div>
</template>

<script>
import { mapGetters } from "vuex";
import { firestore } from "@/plugins";
import CookOrderCard from "@/components/CookOrderCard";
import CookOrderStatusChip from "@/components/CookOrderStatusChip";

export default {
  name: "Cook",
  components: {
    CookOrderCard,
    CookOrderStatusChip
  },
  data: () => ({
    // orders claimed by current user, if any
    currentOrdersData: [],
    // orders unclaimed (and if admin, in-progress orders by other couriers)
    newOrdersData: [],
    // if admin, orders which have been completed
    historicalOrdersData: [],

    restaurant: {}
  }),
  created() {
    const ordersRef = firestore.collection("orders");
    const twoHoursAgo = new Date(Date.now() - 2 * 3600 * 1000);

    this.$bind("restaurant", this.managedRestaurantRef);

    this.$bind(
      "newOrdersData",
      ordersRef
        .where("restaurant", "==", this.managedRestaurantRef)
        .where("completedTime", "==", null)
        .where("courier", "==", null)
        .orderBy("orderTime", "desc")
    );

    this.$bind(
      "currentOrdersData",
      ordersRef
        .where("restaurant", "==", this.managedRestaurantRef)
        .where("courierClaimTime", ">", new Date(0))
        .where("completedTime", "==", null)
        .orderBy("courierClaimTime", "asc")
    );

    this.$bind(
      "historicalOrdersData",
      ordersRef
        .where("restaurant", "==", this.managedRestaurantRef)
        .where("completedTime", "<", new Date(Date.now()))
        .orderBy("completedTime", "desc")
    );
  },
  computed: {
    ...mapGetters(["isManager", "managedRestaurantRef"]),
    newOrders() {
      return this.newOrdersData.map(this.processOrder);
    },
    currentOrders() {
      return this.currentOrdersData.map(this.processOrder);
    },
    historicalOrders() {
      return this.historicalOrdersData.map(this.processOrder);
    },
    newPanel() {
      return this.arrayOfTrues(this.newOrdersData.length);
    },
    currentPanel() {
      return this.arrayOfTrues(this.currentOrdersData.length);
    },
    // prevents courier from claiming more than one order at once
    isBusy() {
      return this.currentOrdersData.length > 0;
    }
  },
  methods: {
    processOrder(order) {
      let grandTotal = 0;
      order.billItems = order.orderItems.map(item => {
        const price = item.quantity * item.unitPrice;
        grandTotal += price;
        return {
          name: item.name,
          quantity: item.quantity,
          label: item.label,
          price
        };
      });
      const deliveryFee = 150;
      grandTotal += deliveryFee;
      //   order.billItems.push(
      //     { name: `Delivery Fee (${order.deliveryLocation.area.name})`, price: deliveryFee },
      //     { name: 'Grand Total', price: grandTotal, bold: true },
      //   );
      order.grandTotal = grandTotal;

      let colour;
      if (!order.courier) {
        colour = "red";
      } else if (!order.deliveryTime) {
        colour = "primary";
      } else {
        colour = "green";
      }
      order.colour = colour;

      return order;
    },
    generateOrderTitle(order) {
      return `${order.user.displayName} - ${order.deliveryLocation.area.name}`;
    },
    arrayOfTrues(length) {
      // https://vuetifyjs.com/en/components/expansion-panels#examples

      const arr = new Array(length);
      for (let i = 0; i < length; i++) {
        arr[i] = true;
      }
      return arr;
    }
  }
};
</script>

<style lang="scss">
#cook-dashboard {
  margin-top: 56px;
  width: 100%;

  .body-1 {
    margin-bottom: 20px;
  }

  .order-card {
    padding: 8px 16px;

    #title {
      padding-bottom: 0;
      text-align: center;
    }

    #billing-table {
      margin-top: 16px;
    }

    #delivery-information {
      margin-top: 16px;

      table {
        border-spacing: 12px;
        width: 100%;

        th {
          text-align: left;
          width: 40%;
        }

        td {
          text-align: right;
        }
      }
    }
  }

  #columns {
    width: 95%;
    margin-left: auto;
    margin-right: auto;
  }
}
</style>
