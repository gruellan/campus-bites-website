<template>
  <v-card>
    <v-card-title primary-title>
      <div>
        <h3 class="headline mb-0">Add a food item</h3>
        <div>Add a new food item to the selected restaurant</div>
        <v-checkbox :label="'Remember form data after submission'" v-model="isPersistent"></v-checkbox>
      </div>
    </v-card-title>

    <v-card-text>
      <v-form ref="form" v-model="formValid">
        <v-select
          label="Select restaurant"
          box
          v-model="restaurantUid"
          :items="restaurants"
          item-value="uid"
          item-text="name"
        ></v-select>
        <v-select
          label="Select categories document"
          box
          v-model="data.category"
          :items="extras"
          item-value="path"
          item-text="name"
          v-bind:disabled="isExtrasDisabled"
          no-data-text="This restaurant has no categories documents"
        ></v-select>
        <v-text-field label="Name" box v-model="data.name" />
        <p>
          <i>Must be lowercase and seperated by hyphens</i>
        </p>
        <v-text-field label="Id" box v-model="id" />
        <v-text-field label="Description" box v-model="data.description" />
        <v-text-field label="Category" box v-model="data.category" />
        <v-text-field label="Photo URL" box v-model="data.photoURL" />
        <v-text-field label="Price (in pence)" box v-model="data.price" />
      </v-form>
      <v-checkbox label="hot" v-model="data.hot"></v-checkbox>
      <v-checkbox label="vegetarian" v-model="data.vegetarian"></v-checkbox>
      <v-checkbox label="popular" v-model="data.popular"></v-checkbox>
      <h3 class="title mb-3">JSON preview</h3>
      <code style="font-size: 14px; width: 100%">{{ json }}</code>
    </v-card-text>

    <v-card-actions>
      <v-btn block color="success" @click="saveItem()" :disabled="!formValid">Add</v-btn>
    </v-card-actions>
  </v-card>
</template>

<script>
import { firestore } from "@/plugins";

export default {
  name: "CreateFoodItem",
  data: () => ({
    restaurants: [],
    restaurantUid: undefined,
    extras: [],
    data: {
      name: null,
      category: undefined,
      description: undefined,
      photoURL: undefined,
      price: 0,
      hot: undefined,
      vegetarian: undefined,
      popular: undefined
    },
    id: null,
    formValid: false,
    isPersistent: false,
    isExtrasDisabled: true
  }),
  firestore: {
    restaurants: firestore.collection("restaurants").orderBy("name")
  },
  computed: {
    json() {
      return JSON.stringify(this.data, null, 2);
    }
  },
  watch: {
    // Listens for changes to the selected restaurant
    restaurantUid: function() {
      this.extras = [];
      this.updateExtrasList();
    }
  },
  methods: {
    saveItem: function() {
      if (!this.restaurantUid) {
        return;
      }

      this.data.category = firestore.doc("/" + this.data.category);

      const category = this.data.category;
      delete this.data.category;
      let final = JSON.parse(JSON.stringify(this.data));
      final.category = category;

      const restaurantUid = this.restaurantUid
        .split(" ")
        .join("-")
        .toLowerCase();

      final.price = parseInt(final.price);
      delete final.id;

      firestore
        .collection("restaurants/" + restaurantUid + "/food-items")
        // Remove undefined properties by stringifying and parsing again
        .doc(this.id)
        .set(final)
        .then(() => {
          //Only reset form data if persistent checkbox unticked
          if (!this.isPersistent) {
            this.data = {
              name: null,
              category: undefined,
              description: undefined,
              photoURL: undefined,
              price: 0,
              hot: undefined,
              vegetarian: undefined,
              popular: undefined
            };
          }
        })
        .catch(error => {
          console.error("Error adding new food item:", error);
        });
    },
    // Updates the select extra category dropdown when a new restaurant is selected
    updateExtrasList() {
      let extra = this.extras;
      //only update extra categories if a restaurant has been chosen
      if (this.restaurantUid != undefined) {
        //enable the select extra category dropdown
        this.isExtrasDisabled = false;
        firestore
          .collection(
            "restaurants/" +
              this.restaurantUid
                .split(" ")
                .join("-")
                .toLowerCase() +
              "/categories"
          )
          .get()
          .then(function(querySnapshot) {
            let count = 0;
            querySnapshot.forEach(function(doc) {
              extra.push({ ...doc.data(), path: doc.ref.path.toString() });
            });
          });
      }
    },
    sendNotification() {
      firestore.collection("notifications").add({
        notification: this.notification,
        topic: "couriers"
      });
    }
  }
};
</script>
