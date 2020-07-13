<template>
  <v-card class="order-card">
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
              <v-icon color="white">timer</v-icon>Estimated Cooking Time 20 minutes
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
        </template>
      </v-data-table>
    </v-card-text>

    <v-card-actions v-if="showActions">
      <v-btn
        v-if="unclaimed"
        dark
        color="red"
        class="mx-2 mb-2"
        block
        large
        @click="claim()"
        :loading="claimLoading"
      >Claim order</v-btn>

      <v-btn
        v-if="inProgress"
        dark
        color="green"
        class="mx-2 mb-2"
        block
        large
        @click="complete()"
        :loading="completeLoading"
      >Complete order</v-btn>
    </v-card-actions>
  </v-card>
</template>

<script>
import { mapGetters } from "vuex";
import { firestore } from "@/plugins/firebase";

export default {
  name: "OrderCard",
  props: ["order"],
  data: () => ({
    billHeaders: [
      { text: "Quantity", align: "left", sortable: false, value: "quantity" },
      { text: "Item", sortable: false, value: "name" }
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
    const finalTime = new Date(orderTime.getTime() + 20 * 60 * 1000);

    if (this.interval) clearInterval(this.interval);

    this.interval = setInterval(() => {
      if (this.completed) {
        clearInterval(this.interval);
        return;
      }

      const seconds = Math.floor((finalTime.getTime() - Date.now()) / 1000);
      const duration = Math.max(seconds, 0);
      const progress = duration / (20 * 60);

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
    }, 1000);
  },
  computed: {
    ...mapGetters(["userUid"]),
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
      return this.unclaimed || this.order.courier.uid === this.userUid;
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
