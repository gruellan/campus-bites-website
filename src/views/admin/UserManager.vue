<template>
  <div id="admin-users">
    <v-card>
      <v-card-title>
        <h2>User Manager</h2>
        <v-spacer />
        <v-text-field
          v-model="search"
          append-icon="search"
          label="Search"
          single-line
          hide-details
        />
      </v-card-title>

      <v-data-table must-sort :headers="headers" :items="users" :search="search">
        <template slot="items" slot-scope="props">
          <tr @click="props.expanded = !props.expanded">
            <td>{{ props.item.displayName }}</td>
            <td class="text-xs-right">{{ props.item.email }}</td>
            <td class="text-xs-right">{{ props.item.phoneNumber }}</td>
            <td>
              <v-checkbox readonly v-model="props.item.confirmedTC" />
            </td>
          </tr>
        </template>

        <template slot="expand" slot-scope="props">
          <v-subheader :v-text="loadOrders(props.item)">Order history</v-subheader>

          <LoadingSpinner :loading="ordersLoading" />

          <template v-if="!ordersLoading">
            <v-card flat v-if="orders.length == 0">
              <v-card-title>
                <v-icon large left>info</v-icon>
                <span class="title font-weight-light">This user hasn't placed any orders</span>
              </v-card-title>
            </v-card>

            <v-expansion-panel v-else popout>
              <v-expansion-panel-content v-for="order of orders" :key="order.id">
                <div slot="actions">
                  <OrderStatusChip :order="order" />
                  <v-icon style="vertical-align: middle">$vuetify.icons.expand</v-icon>
                </div>

                <div
                  slot="header"
                  class="subheading text-capitalize"
                  v-text="generateOrderTitle(order)"
                />

                <OrderCard :claimed="true" :order="order" :hideActions="true" />
              </v-expansion-panel-content>
            </v-expansion-panel>
          </template>
        </template>
      </v-data-table>
    </v-card>
  </div>
</template>

<script>
import { firestore } from "@/plugins";
import { formatPrice } from "@/filters";
import LoadingSpinner from "@/components/LoadingSpinner";
import OrderCard from "@/components/OrderCard";
import OrderStatusChip from "@/components/OrderStatusChip";

export default {
  name: "AdminUsers",
  components: {
    LoadingSpinner,
    OrderCard,
    OrderStatusChip
  },
  data: () => ({
    search: "",
    headers: [
      {
        text: "Customer name",
        sortable: true,
        value: "displayName"
      },
      {
        text: "Email address",
        sortable: false,
        value: "email"
      },
      {
        text: "Phone number",
        sortable: false,
        value: "phoneNumber"
      },
      {
        text: "Terms and conditions",
        sortable: false,
        value: "confirmedTC"
      }
    ],
    users: [],
    userUid: undefined,
    ordersData: [],
    ordersLoading: false
  }),
  firestore: {
    users: firestore.collection("users")
  },
  computed: {
    orders() {
      return this.ordersData.map(this.processOrder);
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
          name: `Delivery Fee`,
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
    generateOrderTitle(order) {
      return `${order.restaurant.name} - ${formatPrice(order.grandTotal)}`;
    },
    loadOrders(user) {
      const userUid = user.id;

      if (this.userUid === userUid) {
        return;
      }
      this.ordersLoading = true;

      if (this.userUid) {
        this.$unbind("ordersData");
      }

      this.userUid = userUid;
      this.$bind(
        "ordersData",
        firestore
          .collection("orders")
          .where("user", "==", firestore.collection("users").doc(userUid))
          .orderBy("orderTime", "desc")
      ).then(() => (this.ordersLoading = false));

      return true;
    }
  }
};
</script>
