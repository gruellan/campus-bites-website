<template>
  <v-card class="food-item" flat :ripple="!foodItem.outOfStock" height="100%" @click="select">
    <v-layout row wrap fill-height align-space-around>
      <!-- image container -->
      <v-flex v-if="foodItem.photoURL" xs4 class="image-container">
        <div class="image" :style="{ backgroundImage: `url('${foodItem.photoURL}')` }"></div>
      </v-flex>
      <v-flex v-else xs4 align-self-center text-xs-center>
        <v-icon x-large color="#C0C0C0">fastfood</v-icon>
      </v-flex>

      <v-flex xs8>
        <v-layout justify-space-between column fill-height class="content">
          <v-flex style="flex-direction: column">
            <!-- Name and description of food item -->
            <v-card-title primary-title>
              <div class="food-item-container">
                <h3 class="headline mb-2">{{ foodItem.name }}</h3>
                <span class="body-1 grey--text text--darken-1">{{ foodItem.description }}</span>
              </div>
            </v-card-title>
          </v-flex>

          <v-flex style="flex-direction: column">
            <!-- Item tags -->
            <v-card-actions>
              <span
                class="food-item-tag title grey--text text--darken-1"
              >{{ foodItem.price | price(false, true) }}</span>

              <template v-if="foodItem.outOfStock">
                <v-spacer />
                <span class="food-item-tag font-weight-bold red--text">
                  <v-icon color="red">error</v-icon>No stock
                </span>
              </template>
              <template v-else>
                <span class="food-item-tag font-weight-bold primary--text" v-if="foodItem.popular">
                  <v-icon color="primary">flash_on</v-icon>Popular
                </span>
                <span class="food-item-tag font-weight-bold red--text" v-if="foodItem.hot">
                  <v-icon color="red">whatshot</v-icon>Hot
                </span>
                <span class="food-item-tag font-weight-bold" v-if="foodItem.vegetarian">
                  <v-avatar color="green" size="20">
                    <span class="white--text body-2">V</span>
                  </v-avatar>
                </span>
              </template>
            </v-card-actions>
          </v-flex>
        </v-layout>
      </v-flex>
    </v-layout>
  </v-card>
</template>

<script>
export default {
  name: "FoodItemCard",
  props: ["foodItem"],
  methods: {
    select() {
      if (!this.foodItem.outOfStock) {
        this.$emit("select");
      }
    }
  }
};
</script>

<style lang="scss">
.food-item {
  background: #ffffff;
  box-shadow: 0px 1px 4px #00000019;
  border-radius: 20px;
  padding: 8px;

  .content {
    height: calc(100% + 24px);
  }

  .v-card__title {
    padding-bottom: 0;
    padding-top: 8px;

    .food-item-container {
      padding: 8px 4px;
      width: 100%;

      .flex {
        padding: 0;
      }
    }
  }

  .image-container {
    height: calc(100% + 24px);
    padding: 4px 0 4px 4px !important;

    .image {
      background-repeat: no-repeat;
      background-size: contain;
      background-position-x: center;
      height: 100%;
      border-top-left-radius: 20px;
      border-bottom-left-radius: 20px;
      margin: 0;
    }
  }

  .v-card__actions {
    padding: 4px 20px 20px 20px;

    .food-item-tag {
      margin-right: 8px;

      .v-icon {
        margin-right: 2px;
        margin-bottom: -2px;
      }
    }

    .food-item-tag:first-of-type {
      margin-right: 12px;
    }
  }
}
</style>
