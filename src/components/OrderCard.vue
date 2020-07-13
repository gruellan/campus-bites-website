<template>
  <v-card :flat="flat" class="order-card">
    <v-card-text>
      <v-card :style="countdownTimerStyle" class="white--text" v-if="!completed">
        <v-card-title primary-title>
          <div class="text-xs-center" style="width: 100%">
            <div class="title text-uppercase">Time remaining</div>
            <div
              class="display-3 font-weight-bold"
              :class="[ countdownTimerColour + '--text' ]"
            >{{ countdownTimer }}</div>
            <div class="body-1 text-uppercase">
              <v-icon color="white">timer</v-icon>ETA 45 minutes
            </div>
          </div>
        </v-card-title>
      </v-card>

      <v-card class="white--text" color="green" v-if="completed">
        <v-card-title primary-title>
          <div class="text-xs-center" style="width: 100%">
            <div class="title text-uppercase">Time taken</div>
            <div class="display-3 font-weight-bold">{{ timeTaken }}</div>
          </div>
        </v-card-title>
      </v-card>

      <v-data-table
        id="billing-table"
        :headers="billHeaders"
        :items="order.billItems"
        class="elevation-1"
        sortable="false"
        hide-actions
      >
        <template slot="headerCell" slot-scope="props">
          <span class="body-2">{{ props.header.text }}</span>
        </template>
        <template slot="items" slot-scope="props">
          <td class="text-xs-left">{{ props.item.quantity }}</td>
          <td
            class="text-xs-left"
            :class="props.item.bold ? ['font-weight-bold', 'text-uppercase'] : []"
          >
            {{ props.item.name }}
            <br />
            <div class="caption">{{ props.item.label }}</div>
          </td>
          <td class="text-xs-right">{{ props.item.price | price }}</td>
        </template>
      </v-data-table>

      <v-card id="delivery-information">
        <v-card-title>
          <h4>Delivery information</h4>
        </v-card-title>
        <v-divider />
        <v-list dense>
          <v-list-tile>
            <v-list-tile-content style="color:red;font-weight:700;">Allergy notes:</v-list-tile-content>
            <v-list-tile-content
              style="color:red;font-weight:700;"
              class="align-end"
            >{{ order.allergies }}</v-list-tile-content>
          </v-list-tile>
          <v-list-tile>
            <v-list-tile-content>Delivery notes:</v-list-tile-content>
            <v-list-tile-content class="align-end">{{ order.notes }}</v-list-tile-content>
          </v-list-tile>
          <v-list-tile>
            <v-list-tile-content>Customer name:</v-list-tile-content>
            <v-list-tile-content
              class="align-end"
            >{{ order.user ? order.user.displayName : 'Deleted user' }}</v-list-tile-content>
          </v-list-tile>
          <v-list-tile>
            <v-list-tile-content>Area:</v-list-tile-content>
            <v-list-tile-content class="align-end">{{ order.deliveryLocation.area.name }}</v-list-tile-content>
          </v-list-tile>
          <v-list-tile>
            <v-list-tile-content>Address:</v-list-tile-content>
            <v-list-tile-content class="align-end">{{ order.deliveryLocation.address }}</v-list-tile-content>
          </v-list-tile>
          <v-list-tile>
            <v-list-tile-content>Phone:</v-list-tile-content>
            <v-list-tile-content
              class="align-end"
            >{{ order.user ? order.user.phoneNumber : 'Deleted user' }}</v-list-tile-content>
          </v-list-tile>
          <v-list-tile>
            <v-list-tile-content>Order ID:</v-list-tile-content>
            <v-list-tile-content class="align-end">{{ order.orderId }}</v-list-tile-content>
          </v-list-tile>
          <v-list-tile>
            <v-list-tile-content>Payment method:</v-list-tile-content>
            <v-list-tile-content class="align-end">
              <span v-if="order.cash">Cash on delivery</span>
              <span v-else>Card payment online</span>
            </v-list-tile-content>
          </v-list-tile>
        </v-list>
      </v-card>
    </v-card-text>

    <v-card-actions v-if="showActions || isAdmin">
      <v-btn
        v-if="unclaimed"
        dark
        color="red"
        class="mx-2 mb-2"
        block
        large
        @click="claim()"
        :loading="claimLoading"
      >Change order status to Cooking</v-btn>

      <v-btn
        v-if="(inProgress && !isManager) || (inProgress && isAdmin)"
        dark
        color="green"
        class="mx-2 mb-2"
        block
        large
        @click="complete()"
        :loading="completeLoading"
      >Change order status to Completed</v-btn>
    </v-card-actions>
  </v-card>
</template>

<script>
import { mapGetters } from "vuex";
import { firestore } from "@/plugins/firebase";

export default {
  name: "OrderCard",
  props: ["order", "hideActions", "flat"],
  data: () => ({
    billHeaders: [
      { text: "Quantity", align: "left", sortable: false, value: "quantity" },
      { text: "Item", sortable: false, value: "name" },
      { text: "Price", align: "right", sortable: false, value: "price" }
    ],
    countdownTimer: "",
    countdownTimerStyle: {
      "background-color": "#ff6d1d !important",
      "border-color": "#ff6d1d !important"
    },
    interval: undefined,
    countdownTime: undefined,
    countdownTimerColour: "white",
    claimLoading: false,
    completeLoading: false
  }),
  created() {
    if (this.completed) {
      return;
    }

    const orderTime = new Date(this.order.orderTime.seconds * 1000);
    const finalTime = new Date(orderTime.getTime() + 45 * 60 * 1000);

    if (this.interval) clearInterval(this.interval);

    const calculate = () => {
      const seconds = Math.floor((finalTime.getTime() - Date.now()) / 1000);
      const duration = Math.max(seconds, 0);
      const progress = duration / (45 * 60);

      // Calculate the colour for the countdown timer
      const a = 0xff6d1d;
      const b = 0xd50000;
      const colour = lerpColor(b, a, progress);
      const hex = "#" + colour.toString(16).padStart(6, "0");
      this.countdownTimerStyle = {
        "background-color": `${hex} !important`,
        "border-color": `${hex} !important`
      };

      if (duration <= 0) {
        this.countdownTimerColour = duration % 2 ? "white" : "black";
        this.countdownTimer = this.formatDuration(0);
      } else {
        this.countdownTimer = this.formatDuration(duration);
      }
    };
    calculate();

    this.interval = setInterval(() => {
      if (this.completed) {
        clearInterval(this.interval);
        return;
      }

      calculate();
    }, 1000);
  },
  computed: {
    ...mapGetters(["userUid", "isManager", "isAdmin"]),
    unclaimed() {
      return !this.order.courier;
    },
    inProgress() {
      return !this.unclaimed && !this.completed;
    },
    completed() {
      return !!this.order.completedTime;
    },
    showActions() {
      return (
        !this.hideActions &&
        (this.unclaimed ||
          this.order.courier.uid === this.userUid ||
          this.isAdmin)
      );
    },
    timeTaken() {
      if (!this.completed) {
        return this.formatDuration(0);
      }

      const seconds = Math.floor(this.order.duration / 1000);
      return this.formatDuration(seconds);
    }
  },
  methods: {
    claim() {
      this.claimLoading = true;
      this.updateOrder("claim");
    },
    complete() {
      this.completeLoading = true;
      this.updateOrder("complete");
    },
    updateOrder(type) {
      const orderRef = firestore.collection("orders").doc(this.order.id);
      const eventsCollectionRef = orderRef.collection("events");
      eventsCollectionRef.add({
        type,
        courierUid: this.$store.getters.user.uid
      });
    },
    formatDuration(duration) {
      const seconds = duration % 60;
      const minutes = (duration - seconds) / 60;
      return ("0" + minutes).slice(-2) + " : " + ("0" + seconds).slice(-2);
    }
  }
};

const lerpColor = function(a, b, amount) {
  const ar = a >> 16,
    ag = (a >> 8) & 0xff,
    ab = a & 0xff,
    br = b >> 16,
    bg = (b >> 8) & 0xff,
    bb = b & 0xff,
    rr = ar + amount * (br - ar),
    rg = ag + amount * (bg - ag),
    rb = ab + amount * (bb - ab);

  return (rr << 16) + (rg << 8) + (rb | 0);
};
</script>
