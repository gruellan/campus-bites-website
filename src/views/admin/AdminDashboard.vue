<template>
  <div id="admin-dashboard">
    <h1>Admin Dashboard</h1>
    <OrderChart v-for="i in 10" :key="i" :weekCommencing="weekCommencing(i)" type="orders" />
  </div>
</template>

<script>
import moment from "moment";
import OrderChart from "@/components/admin/OrderChart";

export default {
  name: "AdminDashboard",
  components: {
    OrderChart
  },
  methods: {
    weekCommencing(weeks) {
      return moment()
        .startOf("isoweek")
        .subtract(weeks, "weeks");
    }
  }
};
</script>
