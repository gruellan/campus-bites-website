<template>
  <v-card v-if="restaurant" class="restaurant-item" :ripple="ripple" @click="$emit('click')">
    <v-img height="200px" :class="{ disabled }" :src="restaurant.photoURL" />
    <v-card-title>
      <div>
        <h3 class="headline mb-0">{{ restaurant.name }}</h3>
        <span v-if="disabled" class="body-2">Coming soon</span>
        <OpeningTimes v-else-if="restaurant.openingHours" :times="restaurant.openingHours" />
      </div>
    </v-card-title>
    <v-card-text class="pt-0">{{ restaurant.description }}</v-card-text>
  </v-card>
</template>

<script>
import OpeningTimes from "@/components/OpeningTimes";

export default {
  name: "RestaurantCard",
  components: { OpeningTimes },
  props: ["restaurant", "ripple", "disabled"]
};
</script>
