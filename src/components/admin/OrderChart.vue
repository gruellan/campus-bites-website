<template>
  <GChart
    type="Bar"
    :settings="{ packages: ['corechart', 'bar'] }"
    :data="chartData(i - 1)"
    :options="chartOptions"
    :createChart="(el, google) => new google.charts.Bar(el)"
  />
</template>

<script>
import { GChart } from "vue-google-charts";
import moment from "moment";
import { firestore } from "@/plugins/firebase";

export default {
  name: "OrderChart",
  props: ["weekCommencing", "type"],
  data: () => ({
    chartOptions: {
      chart: {
        title: "Orders"
      },
      width: 900
    },
    ordersData: []
  }),
  methods: {
    chartData() {
      console.log("weekCommencing:", this.weekCommencing);
      console.log("type:", this.type);

      const days = [];
      for (let i = 0; i < 7; i++) {
        const weekday = moment(this.weekCommencing).add(i, "days");
        const endOfDay = moment(weekday).endOf("day");

        const orders = this.ordersData.filter(order => {
          const time = moment(
            order.orderTime.seconds * 1000 + order.orderTime.nanoseconds / 1000
          );
          return time.isSameOrAfter(weekday) && time.isBefore(endOfDay);
        });

        let data;
        if (this.type === "orders") {
          data = orders.length;
        } else if (this.type === "revenue") {
          data =
            orders.reduce(
              (sum, order) =>
                sum +
                order.orderItems.reduce(
                  (total, item) => total + item.quantity * item.unitPrice,
                  0
                ),
              0
            ) / 100;
        }
        days.push([weekday.format("ddd Do MMM"), data]);
      }

      return [
        ["Weekday", this.type === "orders" ? "Orders" : "Food value"],
        ...days
      ];
    }
  },
  created() {
    this.$bind("ordersData", firestore.collection("orders"), {
      maxRefDepth: 0
    });
  }
};
</script>
