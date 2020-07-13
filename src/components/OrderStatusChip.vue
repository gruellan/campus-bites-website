<template>
  <span id="order-status">
    <v-tooltip bottom v-if="!hidePhoto && (inProgress || completed)">
      <v-avatar v-if="photoURL" size="48" :color="colour" border="4" slot="activator">
        <v-img max-width="42" max-height="42" :src="photoURL" :lazySrc="lazyPhotoURL" />
      </v-avatar>
      <span v-if="order.courier" v-text="order.courier.displayName" />
    </v-tooltip>
    <v-chip :color="colour" text-color="white">{{ text }}</v-chip>
  </span>
</template>

<script>
export default {
  name: "OrderStatusChip",
  props: ["order", "hidePhoto"],
  computed: {
    unclaimed() {
      return !this.order.courier && !this.order.completedTime;
    },
    inProgress() {
      return !!this.order.courier && !this.order.completedTime;
    },
    completed() {
      return !!this.order.completedTime;
    },
    colour() {
      if (this.unclaimed) {
        return "red";
      } else if (this.inProgress) {
        return "primary";
      } else {
        return "green";
      }
    },
    text() {
      if (this.unclaimed) {
        return "Unclaimed";
      } else if (this.inProgress) {
        return "In progress";
      } else {
        return "Completed";
      }
    },
    photoURL() {
      return this.order.courier ? this.order.courier.photoURL : undefined;
    },
    lazyPhotoURL() {
      return this.photoURL ? this.photoURL + "?size=16" : undefined;
    }
  }
};
</script>
