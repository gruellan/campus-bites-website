<template>
  <div>
    <template v-if="!_hideHeader">
      <h3
        class="display-1 pt-4"
        v-if="_header && !loading"
        :class="_headerColour && (isOpen() ? ['green--text'] : ['red--text'])"
      >{{getHeaderText()}}</h3>

      <h3 class="display-1 pt-4" v-else>Opening times</h3>
    </template>

    <v-list class="pa-3" v-show="!loading">
      <v-list-tile-content class="openingTimes">
        <v-list-tile-title
          v-for="day of sortedOpeningTimes()"
          :key="day.name"
          v-show="showDay(day.name, day.times)"
          :class="_highlight && isToday(day.name) ? [ 'font-weight-bold', _highlightColour && isOpen() && 'green--text' ] : []"
        >{{day.name}}: {{getFormattedTimes(day.times)}}</v-list-tile-title>
      </v-list-tile-content>
    </v-list>
    <LoadingSpinner class="pa-2" :loading="loading" />
  </div>
</template>

<script>
import moment from "moment";
import OpeningTimes from "moment-opening-times";
import { firestore } from "@/plugins/firebase";
import LoadingSpinner from "./LoadingSpinner";

export default {
  name: "CampusBitesOpeningTimes",
  components: { LoadingSpinner },
  props: {
    filter: {
      type: Object,
      default: () => ({
        hideClosed: false,
        alwaysShowToday: true
      })
    },
    highlight: {
      type: String,
      default: "colour",
      validator: value => ["colour", "bold", "none"].indexOf(value) !== -1
    },
    header: {
      type: Object,
      default: () => ({
        visible: true,
        colour: true,
        none: false
      }),
      validator: value =>
        Object.keys(value).every(
          key => ["visible", "colour", "none"].indexOf(key) !== -1
        )
    }
  },
  data: () => ({
    openingHours: [],
    formattedOpeningTimes: {},
    openingTimes: undefined,
    loading: true
  }),
  computed: {
    _hideClosed() {
      // default is false if undefined in prop
      return this.filter.hideClosed === undefined
        ? false
        : this.filter.hideClosed;
    },
    _alwaysShowToday() {
      // default is true if undefined in prop
      return this.filter.alwaysShowToday === undefined
        ? true
        : this.filter.alwaysShowToday;
    },
    _highlight() {
      return this.highlight !== "none";
    },
    _highlightColour() {
      return this.highlight === "colour";
    },
    _header() {
      // default is true if undefined in prop
      return this.header.visible === undefined ? true : this.header.visible;
    },
    _headerColour() {
      // default is true if undefined in prop
      return this.header.colour === undefined ? true : this.header.colour;
    },
    _hideHeader() {
      return this.header.none;
    }
  },
  methods: {
    /**
     * used for debugging
     */
    now() {
      return moment(/*'2019-05-05T19:00:00Z'*/);
    },
    sortedOpeningTimes() {
      // Convert the object to an array of type { name: string, times: { opens: string, closes: string }[] }
      return (
        Object.entries(this.formattedOpeningTimes)
          .map(([name, times]) => ({
            name: name[0].toUpperCase() + name.substring(1),
            times
          }))
          // Sort by day of week (this is more complicated than it needs to be because by default
          // Javascript begins the week on Sunday
          .sort((a, b) => {
            const index = day =>
              [
                "Monday",
                "Tuesday",
                "Wednesday",
                "Thursday",
                "Friday",
                "Saturday",
                "Sunday"
              ].indexOf(day);
            return index(a.name) - index(b.name);
          })
      );
    },
    /**
     * Convert times array to string
     */
    getFormattedTimes(times) {
      if (times.length === 0) return "Closed";
      return times
        .map(part => part.opens + " until " + part.closes)
        .join(", ")
        .trim(", ");
    },
    /**
     * Compare weekday to today
     */
    isToday(day) {
      return this.now().format("dddd") === day;
    },
    isOpen() {
      return (
        this.openingTimes && this.openingTimes.getStatus(this.now()).isOpen
      );
    },
    showDay(day, times) {
      return !(
        this._hideClosed &&
        (times.length === 0 && !(this._alwaysShowToday && this.isToday(day)))
      );
    },
    getHeaderText() {
      const status = this.openingTimes.getStatus(this.now(), { next: true });

      if (!status.isOpen) return "Opens " + status.nextOpen.calendar();

      return "Open until " + status.nextClosed.format("HH:mm");
    }
  },
  created() {
    const globalConfigRef = firestore.collection("config").doc("global");
    globalConfigRef.get().then(snapshot => {
      const config = snapshot.data();
      if (!config || !config.openingHours) return;

      this.openingHours = config.openingHours;
      this.openingTimes = new OpeningTimes(this.openingHours, "Europe/London");
      this.formattedOpeningTimes = this.openingTimes.getFormattedOpeningTimes(
        "HH:mm"
      );

      this.loading = false;
    });
  }
};
</script>

<style scoped>
</style>
