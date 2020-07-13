<template>
  <div id="admin-restaurants">
    <h1>Restaurant Manager</h1>
    <EditRestaurant />
  </div>
</template>

<script>
import EditRestaurant from "@/components/admin/EditRestaurant";

export default {
  name: "AdminRestaurants",
  components: { EditRestaurant }
};
</script>
