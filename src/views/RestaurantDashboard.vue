<template>
  <div id="restaurant-dashboard">
    <Flash style="display:none" />
    <v-container>
      <v-layout justify-center row wrap>
        <v-flex xs12 md8>
          <h1 class="display-1 ma-2">Restaurant Dashboard</h1>
          <p class="body-1">You are managing {{ restaurant.name }}.</p>

          <v-dialog v-model="dialog" max-width="500">
            <v-card>
              <v-card-title
                color="primary"
                class="headline grey lighten-2"
                primary-title
              >Restaurant Dashboard</v-card-title>
              <v-card-text>Your are now viewing orders for {{ restaurant.name || 'Loading' }}.</v-card-text>
              <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn color="primary" flat @click="dialog=false">Okay</v-btn>
              </v-card-actions>
            </v-card>
          </v-dialog>

          <v-subheader class="mt-4">Pending orders</v-subheader>

          <v-card v-if="pendingOrders.length === 0">
            <v-card-title>
              <v-icon large left>info</v-icon>
              <span class="title font-weight-light">There are no pending orders</span>
            </v-card-title>
          </v-card>

          <v-expansion-panel :value="pendingPanel" expand v-else>
            <v-expansion-panel-content v-for="order of pendingOrders" :key="order.id">
              <div slot="actions">
                <OrderStatusChip :order="order" />
                <v-icon style="vertical-align: middle">$vuetify.icons.expand</v-icon>
              </div>

              <div
                slot="header"
                class="subheading text-capitalize"
                v-text="generateOrderTitle(order)"
              />

              <OrderCard :order="order" />
            </v-expansion-panel-content>
          </v-expansion-panel>

          <v-subheader>Current orders</v-subheader>

          <v-card v-if="currentOrders.length === 0">
            <v-card-title>
              <v-icon large left>info</v-icon>
              <span class="title font-weight-light">No orders are in progress.</span>
            </v-card-title>
          </v-card>

          <v-expansion-panel v-else>
            <v-expansion-panel-content v-for="order of currentOrders" :key="order.id" lazy>
              <div slot="actions">
                <OrderStatusChip :order="order" :hide-photo="true" />
                <v-icon style="vertical-align: middle">$vuetify.icons.expand</v-icon>
              </div>

              <div
                slot="header"
                class="subheading text-capitalize"
                v-text="generateOrderTitle(order)"
              />

              <OrderCard :order="order" />
            </v-expansion-panel-content>
          </v-expansion-panel>

          <!--          <v-subheader class="mt-4">Historical orders</v-subheader>-->

          <!--          <v-card v-if="historicalOrders.length === 0">-->
          <!--            <v-card-title>-->
          <!--              <v-icon large left>sentiment_dissatisfied</v-icon>-->
          <!--              <span class="title font-weight-light">-->
          <!--                There are no completed orders to show just yet-->
          <!--              </span>-->
          <!--            </v-card-title>-->
          <!--          </v-card>-->

          <!--          <v-expansion-panel v-else>-->
          <!--            <v-expansion-panel-content v-for="order of historicalOrders" :key="order.id" lazy>-->
          <!--              <div slot="actions">-->
          <!--                <OrderStatusChip :order="order"/>-->
          <!--                <v-icon style="vertical-align: middle">$vuetify.icons.expand</v-icon>-->
          <!--              </div>-->

          <!--              <div-->
          <!--                slot="header"-->
          <!--                class="subheading text-capitalize"-->
          <!--                v-text="generateOrderTitle(order)"-->
          <!--              />-->

          <!--              <OrderCard :order="order"/>-->
          <!--            </v-expansion-panel-content>-->
          <!--          </v-expansion-panel>-->
        </v-flex>
      </v-layout>
    </v-container>
  </div>
</template>

<script>
import { mapGetters } from "vuex";
import { firestore } from "@/plugins";
import { formatPrice } from "@/filters";
import { requestNotificationPermission } from "@/plugins/firebase";
import OrderCard from "@/components/OrderCard";
import OrderStatusChip from "@/components/OrderStatusChip";
import Flash from "@/components/Flash";

export default {
  name: "Courier",
  components: {
    OrderCard,
    OrderStatusChip,
    Flash
  },
  data: () => ({
    // orders claimed by current user, if any
    currentOrdersData: [],
    // orders unclaimed (and if admin, in-progress orders by other couriers)
    pendingOrdersData: [],
    // // if admin, orders which have been completed
    // historicalOrdersData: [],

    restaurant: {},
    dialog: true
  }),
  created() {
    requestNotificationPermission();

    const ordersRef = firestore.collection("orders");

    // const twentyFourHoursAgo = new Date(Date.now() - 24 * 3600 * 1000);

    this.$bind("restaurant", this.managedRestaurantRef);

    const pendingOrdersRef = ordersRef
      .where("restaurant", "==", this.managedRestaurantRef)
      .where("completedTime", "==", null)
      .where("courier", "==", null)
      .orderBy("orderTime");
    this.$bind("pendingOrdersData", pendingOrdersRef);
    let length = 0;
    const audio = new Audio(
      "https://firebasestorage.googleapis.com/v0/b/campus-bites-production.appspot.com/o/sounds%2Fnotification.mp3?alt=media"
    );
    pendingOrdersRef.onSnapshot(snapshot => {
      if (snapshot.size > length) {
        audio.play();
        length = snapshot.size;
      }
    });

    this.$bind(
      "currentOrdersData",
      ordersRef
        .where("restaurant", "==", this.managedRestaurantRef)
        .where("courierClaimTime", ">", new Date(0))
        .where("completedTime", "==", null)
        .orderBy("courierClaimTime")
    );

    // this.$bind(
    //   'historicalOrdersData',
    //   ordersRef.where('completedTime', '>', twentyFourHoursAgo)
    //            .where('restaurant', '==', this.managedRestaurantRef)
    //            .orderBy('completedTime', 'desc'),
    // );
  },
  computed: {
    ...mapGetters(["isManager", "managedRestaurantRef"]),
    currentOrders() {
      return this.currentOrdersData.map(this.processOrder);
    },
    pendingOrders() {
      return this.pendingOrdersData.map(this.processOrder);
    },
    // historicalOrders() {
    //   return this.historicalOrdersData.map(this.processOrder);
    // },
    // prevents courier from claiming more than one order at once
    isBusy() {
      return this.currentOrdersData.length > 0;
    },
    pendingPanel() {
      return this.arrayOfTrues(this.pendingOrdersData.length);
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

      order.billItems.push({ name: "Total", price: grandTotal, bold: true });
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
    formatTime(date) {
      return new Date(date * 1000).toLocaleString(undefined, {
        day: "numeric",
        month: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    },
    generateOrderTitle(order) {
      return `${order.user.displayName} - ${formatPrice(
        order.grandTotal
      )} - ${this.formatTime(order.orderTime.seconds)}`;
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
#restaurant-dashboard {
  margin-top: 56px;

  .order-card {
    padding: 8px 16px;

    #title {
      padding-bottom: 0;
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
}
</style>
