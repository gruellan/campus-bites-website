<template>
  <div id="restaurant-filters">
    <h3>Show restaurants with tags</h3>
    <v-radio-group v-model="filterData.tag">
      <v-radio v-for="t in filterData.tags" :key="t" :label="t" :value="t" color="primary" />
    </v-radio-group>

    <v-divider />

    <h3>Opening hours</h3>
    <div id="opening-hours">
      <v-checkbox label="Show closed restaurants" v-model="filterData.showClosed" color="primary" />
    </div>
  </div>
</template>

<script>
export default {
  name: "RestaurantFilters",
  props: ["filterData"]
};
</script>

<style lang="scss">
#restaurant-filters {
  .v-divider {
    margin-bottom: 24px;
  }

  // Make text bold when selected
  .v-radio.theme--light.primary--text {
    font-weight: 600;
    color: black;
  }

  // Make text bold when selected
  #opening-hours {
    .v-input--is-label-active {
      font-weight: 600;
    }
  }
}
</style>
