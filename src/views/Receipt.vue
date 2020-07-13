<template>
  <div
    style="width:100%; height:100vh; background-color:white; padding:25px; border-radius:5px; margin: 0 auto;"
    v-if="charge"
  >
    <v-flex xs12 style="margin: 0 auto; width:500px" v-if="charge.paymentInformation != null">
      <table style="margin-left:auto; margin-right:auto;">
        <tr>
          <td>
            <img
              style="width:70px; height:70px; border-radius:50%; box-shadow: 0 0 20px 0 rgba(0, 0, 0, 0.2), 0 5px 5px 0 rgba(0, 0, 0, 0.24);"
              src="https://puu.sh/CVqIQ.png"
            />
          </td>
        </tr>
      </table>
      <h2
        style="font-size:30px; color:#32325d; font-weight:100; margin:0; padding:10px 10px 0 10px; text-align:center;"
        v-if="charge.paid"
      >Receipt from Campus Bites Ltd.</h2>
      <h2
        style="font-size:30px; color:#32325d; font-weight:100; margin:0; padding:10px 10px 0 10px; text-align:center;"
        v-else
      >Invoice from Campus Bites Ltd.</h2>
      <h4
        style="text-align:center; margin:0; padding:10px 0 20px 0; font-weight:200"
        v-if="charge.paid && charge.paymentInformation"
      >Receipt for order: {{charge.paymentInformation.orderId}}</h4>
      <h4
        style="text-align:center; margin:0; padding:10px 0 20px 0; font-weight:200"
        v-else-if="charge.paymentInformation"
      >Invoice for order: {{charge.paymentInformation.orderId}}</h4>
      <table style="text-align:center; margin-left:auto; margin-right:auto;">
        <tr>
          <td
            style="padding:0 20px 0 20px; font-weight:600; font-size:14px; color:#494D4D;"
            v-if="charge.paid"
          >Amount Paid</td>
          <td
            style="padding:0 20px 0 20px; font-weight:600; font-size:14px; color:#494D4D;"
            v-else-if="!charge.paid"
          >Amount to pay</td>
          <td style="padding:0 20px 0 20px; font-weight:600; font-size:14px; color:#494D4D;">Date</td>
          <td
            style="padding:0 20px 0 20px; font-weight:600; font-size:14px; color:#494D4D;"
          >Payment Method</td>
        </tr>
        <tr v-if="charge.paymentInformation">
          <td
            style=" font-weight:100; font-size:14px; color:#494D4D;"
            v-if="charge.order"
          >{{formatPrice(calculateAmount(charge.order))}}</td>
          <td style=" font-weight:100; font-size:14px; color:#494D4D;" v-if="!charge.order">None</td>
          <td
            style=" font-weight:100; font-size:14px; color:#494D4D;"
            v-if="charge.paid && charge.order.completedTime"
          >{{formatDate(charge.order.completedTime.seconds)}}</td>
          <td
            style=" font-weight:100; font-size:14px; color:#494D4D;"
            v-else
          >{{formatDate(charge.created)}}</td>
          <td
            style=" font-weight:100; font-size:14px; color:#494D4D;"
            v-if="charge.paid && !charge.paymentInformation.cash"
          >
            Paid online with card
            <p
              v-if="charge.paymentInformation.source != 'default'"
            >: {{charge.paymentInformation.source}}</p>
          </td>
          <td
            style=" font-weight:100; font-size:14px; color:#494D4D;"
            v-else-if="!charge.paid && charge.paymentInformation.cash && charge.order"
          >Paying on delivery with cash</td>
          <td
            style=" font-weight:100; font-size:14px; color:#494D4D;"
            v-else-if="charge.paid && charge.paymentInformation.cash"
          >Paid with cash</td>
          <td
            style=" font-weight:100; font-size:14px; color:#494D4D;"
            v-else-if="!charge.order"
          >Not paying</td>
        </tr>
      </table>
      <h4 style="font-weight:600; color:#494D4D; margin:0; padding-bottom:5px;">Summary</h4>
      <table
        style="font-size:14px; padding:15px; width:100%; background-color:#F0F5F5; border-radius:5px;"
        v-if="charge.order"
      >
        <tr v-for="(item, index) in charge.order.orderItems">
          <td :key="index">{{item.quantity}} {{item.name}} - {{formatPrice(item.unitPrice)}}</td>
        </tr>
        <tr>
          <td
            v-if="charge.order.deliveryLocation"
          >Delivery Fee ({{charge.order.deliveryLocation.area.name}}) - {{formatPrice(charge.order.deliveryLocation.area.fee)}}</td>
        </tr>
        <tr>
          <hr
            style="border: 0;
            height: 0;
            border-top: 1px solid rgba(0, 0, 0, 0.1);
            border-bottom: 1px solid rgba(255, 255, 255, 0.3);"
          />
        </tr>
        <tr style="font-weight:500;">
          <td>Amount Paid</td>
          <td>{{formatPrice(calculateAmount(charge.order))}}</td>
        </tr>
      </table>
      <table
        style="font-size:14px; padding:15px; width:100%; background-color:#F0F5F5; border-radius:5px;"
        v-else
      >
        <tr>
          <td v-if="charge.error">{{charge.error}}</td>
          <td v-else>Unknown Error</td>
        </tr>
      </table>
      <hr
        style="border: 0;
        height: 0;
        border-top: 1px solid rgba(0, 0, 0, 0.1);
        border-bottom: 1px solid rgba(255, 255, 255, 0.3);"
      />
      <p style="font-size:12px;">
        If you have any questions, please contact us at
        <br />
        <a href="https://campusbites.co.uk/contact">https://campusbites.co.uk/contact</a>,
        <br />or reach us directly at
        <br />admin@campusbites.co.uk
      </p>
      <hr
        style="border: 0;
        height: 0;
        border-top: 1px solid rgba(0, 0, 0, 0.1);
        border-bottom: 1px solid rgba(255, 255, 255, 0.3);"
      />
      <p style="font-size:10px;">
        You're receiving this email because you made a purchase at Campus Bites Ltd. Campus Bites Ltd.
        Campus Bites, Enterprise & Innovation Services, Bowland Main, Lancaster University, Lancaster, United Kingdom, LA1 4YT
      </p>
    </v-flex>
  </div>
</template>
<style>
</style>
<script>
import { mapGetters } from "vuex";
import { firestore } from "@/plugins/firebase";
export default {
  name: "Receipt",
  data: () => ({
    reference: null,
    charge: {}
  }),
  computed: {
    ...mapGetters(["user"])
  },
  methods: {
    log(charge) {
      console.log(charge);
    },
    formatPrice(value) {
      const price = value || 0;
      const pounds = Math.floor(price / 100);
      const pence = price % 100;
      return "£" + pounds + "." + ("0" + pence).slice(-2);
    },
    formatDate(date) {
      return new Date(date * 1000).toLocaleString(undefined, {
        day: "numeric",
        month: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    },
    //TODO: Something is broken with price calculation? Not sure https://i.imgur.com/png6eKm.png 16 when should be 13
    calculateAmount(order) {
      if (order.deliveryLocation) {
        const deliveryFee = 150;
        return order.orderItems.reduce(
          (accumulator, item) =>
            accumulator + deliveryFee + item.unitPrice * item.quantity,
          0
        );
      }
      return "Unknown Error";
    }
  },
  created() {
    if (this.user == null) {
      this.$router.push({
        name: "error",
        query: {
          message: "Unauthorised",
          caption: "Please login to view your receipts."
        }
      });
    } else {
      this.reference = this.$route.query.charge;
      this.$bind(
        "charge",
        firestore
          .collection("users")
          .doc(this.user.uid)
          .collection("charges")
      ).then(() => {
        this.charge = this.charge.filter(
          charge => charge.paymentInformation.orderId == this.reference
        )[0];
        if (this.charge == null) {
          this.$router.push({
            name: "error",
            query: {
              message: "Not found",
              caption: "No Receipt found with that order ID"
            }
          });
        }
      });
    }
  }
};
</script>
