<template>
  <div id="courier">
    <v-container>
      <v-layout justify-center row wrap>
        <v-flex xs12 md8>
          <h1 class="display-1 ma-2">Courier Dashboard</h1>

          <v-subheader class="mt-4">Pending orders</v-subheader>

          <v-card v-if="pendingOrders.length == 0">
            <v-card-title>
              <v-icon large left>info</v-icon>
              <span class="title font-weight-light">There are no pending orders</span>
            </v-card-title>
          </v-card>

          <v-expansion-panel v-else>
            <v-expansion-panel-content v-for="order of pendingOrders" :key="order.id" lazy>
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

          <v-card v-if="currentOrders.length == 0">
            <v-card-title>
              <v-icon large left>info</v-icon>
              <span class="title font-weight-light">You haven't claimed any orders</span>
            </v-card-title>
          </v-card>

          <v-expansion-panel v-else>
            <v-expansion-panel-content v-for="order of currentOrders" :key="order.id" lazy>
              <div slot="actions">
                <OrderStatusChip :order="order" />
                <v-icon style="vertical-align: middle">$vuetify.icons.expand</v-icon>
              </div>

              <div
                slot="header"
                class="subheading text-capitalize"
                v-text="generateOrderTitle(order)"
              />

              <OrderCard :claimed="true" :order="order" />
            </v-expansion-panel-content>
          </v-expansion-panel>

          <v-subheader class="mt-4">
            Historical orders
            <span v-if="!isAdmin" class="ml-1">(last hour)</span>
          </v-subheader>

          <v-card v-if="historicalOrders.length == 0">
            <v-card-title>
              <v-icon large left>sentiment_dissatisfied</v-icon>
              <span class="title font-weight-light">
                <template v-if="isAdmin">There are no completed orders to show just yet</template>
                <template v-else>You haven't completed any orders in the last hour</template>
              </span>
            </v-card-title>
          </v-card>

          <v-expansion-panel v-else>
            <v-expansion-panel-content v-for="order of historicalOrders" :key="order.id" lazy>
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
        </v-flex>
      </v-layout>
    </v-container>
  </div>
</template>

<script>
import { mapGetters } from "vuex";
import { firestore } from "@/plugins";
import { requestNotificationPermission } from "@/plugins/firebase";
import { formatPrice } from "@/filters";
import OrderCard from "@/components/OrderCard";
import OrderStatusChip from "@/components/OrderStatusChip";

export default {
  name: "Courier",
  components: {
    OrderCard,
    OrderStatusChip
  },
  data: () => ({
    // orders claimed by current user, if any
    currentOrdersData: [],
    // orders unclaimed (and if admin, in-progress orders by other couriers)
    pendingOrdersData: [],
    // if admin, orders which have been completed
    historicalOrdersData: []
  }),
  created() {
    requestNotificationPermission();

    const ordersRef = firestore.collection("orders");
    let currentOrdersRef;
    if (this.isAdmin) {
      currentOrdersRef = ordersRef
        .where("completedTime", "==", null)
        .orderBy("orderTime");
    } else {
      currentOrdersRef = ordersRef
        .where("courier", "==", this.userRef)
        .where("completedTime", "==", null)
        .orderBy("orderTime");
    }
    this.$bind("currentOrdersData", currentOrdersRef);

    let pendingOrdersRef = ordersRef
      .where("courier", "==", null)
      .orderBy("orderTime");
    if (!this.isAdmin) {
      pendingOrdersRef = pendingOrdersRef.where("courier", "==", null);
    }
    this.$bind("pendingOrdersData", pendingOrdersRef);

    let historicalOrdersRef;
    if (this.isAdmin) {
      historicalOrdersRef = ordersRef
        .where("completedTime", ">", new Date(0))
        .orderBy("completedTime", "desc");
    } else {
      historicalOrdersRef = ordersRef
        .where("completedTime", ">", new Date(Date.now() - 3600 * 1000))
        .where("courier", "==", this.userRef)
        .orderBy("completedTime", "desc");
    }
    this.$bind("historicalOrdersData", historicalOrdersRef);
  },
  computed: {
    ...mapGetters(["isAdmin", "userRef"]),
    currentOrders() {
      return this.currentOrdersData.map(this.processOrder);
    },
    pendingOrders() {
      return this.pendingOrdersData.map(this.processOrder);
    },
    historicalOrders() {
      return this.historicalOrdersData.map(this.processOrder);
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
      order.billItems.push(
        {
          name: `Delivery Fee (${order.deliveryLocation.area.name})`,
          price: deliveryFee
        },
        { name: "Grand Total", price: grandTotal, bold: true }
      );
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
      let formattedDate = new Date(date * 1000).toLocaleString(undefined, {
        day: "numeric",
        month: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
      return formattedDate;
    },
    generateOrderTitle(order) {
      return `${order.restaurant.name} - ${formatPrice(
        order.grandTotal
      )} - ${this.formatTime(order.orderTime.seconds)}`;
    },
    checkIfOpen() {
      if (isCampusBitesOpen() == false) {
        this.dialog = true;
      }
    }
  }
};
</script>

<style lang="scss">
#courier {
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
