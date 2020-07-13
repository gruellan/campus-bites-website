<template lang="html">
  <div id="content">
    <h1 style="text-align:center;font-size: 40px;">Frequently Asked Questions</h1>
    <br>
    <v-expansion-panel>
      <v-expansion-panel-content>
        <div slot="header"><b>Will Campus Bites close for the Summer break?</b></div>
        <v-card>
          <v-card-text>
            Yes, Campus Bites will cease operation on Saturday 29th June 2019 and will open again next Academic Year. An exact date will be confirmed closer to the time.
          </v-card-text>
        </v-card>
      </v-expansion-panel-content>
      <v-expansion-panel-content>
        <div slot="header"><b>What are your opening times?</b></div>
        <v-card>
          <v-card-text>
            Our opening times <!--as of the last time this article was updated-->are as follows:

            <CampusBitesOpeningTimes :filter="{ hideClosed: false }" :header="{ none: true }" highlight="none"/>

            <!--
            <ul>
              <li>Friday 6pm-12am</li>
              <li>Saturday 6pm-12am</li>
              <li>Sunday 6pm-12am</li>
            </ul>
            -->

            <br>
            When you see a restaurant marked as open on our site you will be able to place an order for food from that
            restaurant. These opening times may not be the same as the opening times listed on the restaurant's website.
            Please note that some restaurants may be closed for all or part of Campus Bites’ operating hours. You will
            not be able to place an order with a restaurant if it is marked as closed.
          </v-card-text>
        </v-card>
      </v-expansion-panel-content>
      <v-expansion-panel-content>
        <div slot="header"><b>How much do you charge for delivery?</b></div>
        <v-card>
          <v-card-text>
            Our delivery fee for Summer Term 2018/2019 is £1.50 for all accommodation.<!-- for accommodation in South West campus (Cartmel, Lonsdale, LUGrad and 'Posh' Pendle) and £1.50 for all other accommodation.-->
          </v-card-text>
        </v-card>
      </v-expansion-panel-content>
      <v-expansion-panel-content>
        <div slot="header"><b>Which payment methods do you accept?</b></div>
        <v-card>
          <v-card-text>
            The majority of the restaurants we partner with only accept credit or debit card online payments. A few of
            our providers accept cash on arrival - this will be made clear at checkout when you place the order.
          </v-card-text>
        </v-card>
      </v-expansion-panel-content>
      <v-expansion-panel-content>
        <div slot="header"><b>Can I cancel my order after its been placed?</b></div>
        <v-card>
          <v-card-text>
            Once your order has been placed and the payment has been authorized you won’t be able to cancel your order.
            There are however some exceptions to this for example if there has been a technical fault. If you believe
            you may be entitled to an order cancellation please contact us at admin@campusbites.co.uk
          </v-card-text>
        </v-card>
      </v-expansion-panel-content>
      <v-expansion-panel-content>
        <div slot="header"><b>My order never arrived. What should I do?</b></div>
        <v-card>
          <v-card-text>
            In the very unusual circumstance that your courier does not turn up please contact us either through our
            facebook page or email us at admin@campusbites.co.uk and we will take care of the issue for you.
          </v-card-text>
        </v-card>
      </v-expansion-panel-content>
      <v-expansion-panel-content>
        <div slot="header"><b>There is something wrong with my order. What should I do?</b></div>
        <v-card>
          <v-card-text>
            We’d first recommend speaking to the courier who delivered your order if you notice something isn’t right
            when taking delivery and they will resolve the situation. If for any reason you’d like to still contact us
            regarding your order please send an email to admin@campusbites.co.uk or message us on our facebook page.
          </v-card-text>
        </v-card>
      </v-expansion-panel-content>
      <v-expansion-panel-content>
        <div slot="header"><b>How do I get a refund?</b></div>
        <v-card>
          <v-card-text>
            Once an order has been placed and payment has been authorized you generally won’t be entitled to a refund.
            There are however a few exceptions to this - if you believe you are entitled to a refund please contact us
            at admin@campusbites.co.uk
          </v-card-text>
        </v-card>
      </v-expansion-panel-content>
      <v-expansion-panel-content>
        <div slot="header"><b>How long do you take to deliver the order?</b></div>
        <v-card>
          <v-card-text>
            We currently aim to deliver all orders within 30-40 minutes. This is however only a guideline and it is
            possible that your order could arrive faster or slower than the quoted times. If you believe that you’ve
            waited an unreasonably long time for your order please contact us at admin@campusbites.co.uk and we’ll look
            into this for you.
          </v-card-text>
        </v-card>
      </v-expansion-panel-content>
    </v-expansion-panel>
  </div>
</template>

<script>
import CampusBitesOpeningTimes from "../components/CampusBitesOpeningTimes";
export default {
  components: { CampusBitesOpeningTimes }
};
</script>

<style lang="scss">
#content {
  width: 60%;
  font-weight: 400;
  margin-left: auto;
  margin-right: auto;
  margin-top: 90px;
  margin-bottom: 90px;
}

h1,
h2,
h3,
h4,
h5,
h6 {
  font-weight: 300;
}
</style>
