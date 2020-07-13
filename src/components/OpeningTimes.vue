<template>
  <div id="opening-times" v-if="available">
    <v-chip v-if="chip" :color="state.colour" text-color="white">
      <v-icon left>access_time</v-icon>
      {{ state.message }}
    </v-chip>
    <span v-else class="body-2" :class="state.text || []">{{ state.message }}</span>
  </div>
</template>

<script>
import moment from "moment";
import OpeningTimes from "moment-opening-times";
import { firestore } from "@/plugins";

let campusBitesOpeningHours;
firestore
  .collection("config")
  .doc("global")
  .get()
  .then(doc => {
    campusBitesOpeningHours = doc.get("openingHours");
  });

export const isCampusBitesOpen = () => {
  if (!campusBitesOpeningHours) {
    return false;
  }

  const openingTimes = new OpeningTimes(
    campusBitesOpeningHours,
    "Europe/London"
  );
  return openingTimes.getStatus(moment()).isOpen;
};

export const isRestaurantOpen = restaurant => {
  // If Campus Bites is closed return false
  if (!isCampusBitesOpen()) {
    return false;
  }

  // If there are no opening hours known return false
  if (!restaurant || !restaurant.openingHours) {
    return false;
  }

  const openingTimes = new OpeningTimes(
    restaurant.openingHours,
    "Europe/London"
  );
  return openingTimes.getStatus(moment()).isOpen;
};

export const getCampusBitesOpeningHours = () => {
  return campusBitesOpeningHours;
};

const State = {
  UNAVAILABLE: { message: "Unavailable", colour: "grey" },
  OPEN: {
    message: "Open now",
    colour: "green",
    text: ["green--text", "text--accent-4"]
  },
  CLOSED: {
    message: "Closed",
    colour: "red",
    text: ["red--text", "text--accent-4"]
  },
  CLOSED_SOON: {
    message: "Closing soon",
    colour: "orange",
    text: ["orange--text", "text--accent-4"]
  }
};

export default {
  name: "OpeningTimes",
  props: ["times", "chip"],
  computed: {
    available() {
      return !!this.times;
    },
    openingTimes() {
      return this.available
        ? new OpeningTimes(this.times, "Europe/London")
        : undefined;
    },
    state() {
      if (!this.available) {
        return State.UNAVAILABLE;
      }

      if (!isCampusBitesOpen()) {
        return State.CLOSED;
      }

      const now = moment();
      const status = this.openingTimes.getStatus(now, { next: true });
      if (status.isOpen) {
        const nextClosed = status.nextClosed;
        if (nextClosed) {
          const duration = moment.duration(nextClosed.diff(now));
          if (duration.asMinutes() <= 30) {
            const state = State.CLOSED_SOON;
            state.message = "Open until " + nextClosed.format("HH:mm");
            return state;
          }
        }
        return State.OPEN;
      } else {
        const nextOpen = status.nextOpen;
        const state = State.CLOSED;
        if (nextOpen) {
          state.message = "Closed until " + nextOpen.format("HH:mm");
        }
        return state;
      }
    }
  }
};
</script>
