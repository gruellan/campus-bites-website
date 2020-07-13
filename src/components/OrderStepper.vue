<template>
  <div id="order-stepper">
    <v-stepper :value="step" alt-labels v-if="$vuetify.breakpoint.mdAndUp">
      <v-stepper-header>
        <v-stepper-step
          step="1"
          complete
          complete-icon="home"
          :editable="step > 1"
          edit-icon="home"
          @click="click(1)"
          :class="classList(1)"
          :color="color(1)"
        >{{ step > 1 ? $store.getters.collegeName : 'Choose college' }}</v-stepper-step>

        <v-divider></v-divider>

        <v-stepper-step
          step="2"
          complete
          complete-icon="location_on"
          :editable="step > 2"
          edit-icon="location_on"
          @click="click(2)"
          :class="classList(2)"
          :color="color(2)"
        >{{ step > 2 ? (restaurant ? restaurant.name : '') : 'Select location' }}</v-stepper-step>

        <v-divider></v-divider>

        <v-stepper-step
          step="3"
          complete
          complete-icon="fastfood"
          :editable="step > 3"
          edit-icon="fastfood"
          @click="click(3)"
          :class="classList(3)"
          :color="color(3)"
        >{{ step > 3 ? this.calculateItems() + ' items' : 'Select food' }}</v-stepper-step>

        <v-divider></v-divider>

        <v-stepper-step
          step="4"
          complete
          complete-icon="shopping_cart"
          :class="classList(4)"
          :color="color(4)"
        >Checkout</v-stepper-step>
      </v-stepper-header>
    </v-stepper>
  </div>
</template>

<script>
export default {
  name: "OrderStepper",
  props: ["step", "restaurant"],
  methods: {
    calculateItems() {
      return this.$store.getters.basket
        .map(item => item.quantity)
        .reduce((x, y) => x + y, 0);
    },
    // If this step is currently open make the text bold
    classList(step) {
      return this.step == step ? ["font-weight-medium"] : [];
    },
    // If this step is in the future make it grey
    color(step) {
      return this.step >= step ? "primary" : "grey";
    },
    click(step) {
      if (this.step > step) {
        let route;
        switch (step) {
          default:
          case 1:
            route = "home";
            break;
          case 2:
            route = "locations";
            break;
          case 3:
            route = "menu";
            break;
        }
        this.$router.push({ name: route });
      }
    }
  }
};
</script>

<style lang="scss">
#order-stepper {
  .v-stepper {
    padding: 0;
    margin: 0;

    .v-stepper__header {
      padding: 2vh 10vw;
      margin: 0;

      .v-stepper__step {
        padding: 12px;
      }
    }

    .v-stepper__content {
      padding: 0;
    }
  }
}
</style>
