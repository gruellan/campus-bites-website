<template>
  <v-card>
    <v-card-title primary-title>
      <div>
        <h3 class="headline mb-0">Edit restaurant properties</h3>
        <div>Configure details about a restaurant or manage its status.</div>
      </div>
    </v-card-title>

    <v-card-text>
      <v-select
        box
        :value="restaurantId"
        @input="selectRestaurant"
        clearable
        label="Select a restaurant"
        :items="restaurants"
        item-text="name"
        item-value="id"
      />

      <template v-if="restaurantData">
        <v-text-field box v-model="restaurantData.name" @input="updateRestaurant" label="Name" />

        <v-textarea
          box
          v-model="restaurantData.description"
          @input="updateRestaurant"
          label="Description"
        />

        <v-switch
          v-model="restaurantData.comingSoon"
          @change="updateRestaurant"
          label="Coming soon"
          persistent-hint
          hint="Should this restaurant be shown in grayscale and not selectable?"
        />
      </template>
    </v-card-text>
  </v-card>
</template>

<script>
import debounce from "lodash/debounce";
import { firestore } from "@/plugins";

export default {
  name: "EditRestaurant",
  data: () => ({
    restaurantId: null,
    restaurantData: undefined,
    restaurants: []
  }),
  methods: {
    // called when a new restaurant is selected in the v-select
    selectRestaurant(restaurantId) {
      // if undefined value, unbind restaurant data
      if (!restaurantId) {
        if (!!this.restaurantData) {
          this.$unbind("restaurantData");
        }
        return;
      }

      // else bind ref to restaurant data
      this.$bind(
        "restaurantData",
        firestore.collection("restaurants").doc(restaurantId)
      );
      this.restaurantId = restaurantId;
    },

    // called when a restaurant property is changed
    updateRestaurant: debounce(function() {
      if (!this.restaurantId) return;
      firestore
        .collection("restaurants")
        .doc(this.restaurantId)
        .update(this.restaurantData);
    }, 300)
  },
  created() {
    // get restaurants collection snapshot
    firestore
      .collection("restaurants")
      .get()
      .then(snap => {
        // iterate documents
        snap.forEach(doc => {
          // create element for each restaurant (name, id)
          const restaurant = {
            name: doc.get("name"),
            id: doc.ref.id
          };
          this.restaurants.push(restaurant);
        });
      });
  }
};
</script>
