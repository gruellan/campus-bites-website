<template lang="html">
  <div class="create-food-item">
    <h1>Create a food item</h1>
    <CreateFoodItem/>
  </div>
</template>

<script>
import CreateFoodItem from "@/components/admin/CreateFoodItem.vue";

export default {
  name: "food-items",
  components: { CreateFoodItem }
};
</script>

<style lang="css">
</style>
