<template>
  <div id="success">
    <v-layout row>
      <v-flex xs12 md6 offset-md3>
        <v-card v-if="!loading">
          <v-card-title primary-title class="text-xs-center">
            <div style="width: 100%">
              <v-icon id="icon" size="56" color="green accent-3" outline>check</v-icon>
              <div class="display-1 text-uppercase font-weight-black mb-3" v-html="title"></div>
              <div class="body-2" v-html="message"></div>
              <div class="caption" v-html="caption"></div>
              <div class="caption mt-3" v-if="timeout">Redirecting in {{ timeout }} seconds...</div>
            </div>
          </v-card-title>
          <v-card-actions v-if="!timeout">
            <v-btn block color="primary" dark :to="{ name: 'home' }">Return to Home Page</v-btn>
          </v-card-actions>
        </v-card>
        <v-card v-else>
          <v-card-title primary-title class="text-xs-center">
            <LoadingSpinner :loading="true" />
          </v-card-title>
        </v-card>
      </v-flex>
    </v-layout>
  </div>
</template>

<script>
import { mapGetters } from "vuex";
import LoadingSpinner from "@/components/LoadingSpinner";

export default {
  name: "Success",
  components: {
    LoadingSpinner
  },
  data: () => ({
    loading: false,
    loadFunction: undefined,

    title: undefined,
    message: undefined,
    caption: undefined,
    timeout: undefined,
    redirect: undefined
  }),
  computed: {
    type() {
      return this.$route.query.type;
    },
    ...mapGetters(["user", "signInRedirect"])
  },
  watch: {
    user(value) {
      if (this.loading && value) {
        this.loading = false;
        this.loadFunction(value);

        setTimeout(() => {
          this.$router.push({ name: this.redirect });
        }, this.timeout * 1000);
      }
    }
  },
  created() {
    if (this.type === "login") {
      this.loadFunction = user => {
        this.caption = `Logged in as <i>${user.displayName} (${user.email})</i>`;
      };

      this.title = "Success!";
      this.message = "You are now logged in to Campus Bites";
      this.timeout = 2;
      this.redirect = this.signInRedirect || "home";
    } else if (this.type === "order") {
      this.loadFunction = user => {
        this.caption = `A confirmation email has been sent to <i>${user.email}</i>`;
        this.message = `
          <p>Please check your Spam folder.</p>
          <p>
            Your order will be with you in 30-40 minutes.
          </p>
          <p>Thank you for placing an order! Here's what happens next:</p>
          <p style="font-weight: 300">1. Your order will be sent to the restaurant.</p>
          <p style="font-weight: 300">2.They will prepare the order and hand it over the the courier for delivery.</p>
          <p style="font-weight: 300">3. Your courier will deliver your order to your accomodation entrance.</p>
          <p>If you have any questions about your order please visit our <a href="faq">FAQ Page</a></p>
        `;
      };

      this.title = "Thank you!";
      this.message = "Your order has been placed";
    } else if (this.type === "delete") {
      this.title = "Success!";
      this.message = "You have successfully deleted your account.";
      this.timeout = 2;
      this.redirect = this.signInRedirect || "home";
    } else {
      this.title = this.$route.query.title || "Success!";
      this.message = this.$route.query.message || "";
      this.caption = this.$route.query.caption || "";
      this.timeout = this.$route.query.timeout || 5;
      this.redirect = this.$route.query.redirect || "home";
    }

    if (this.loadFunction) {
      if (this.user) {
        this.loadFunction(this.user);
      } else {
        this.loading = true;
      }
    }

    if (this.timeout > 0 && this.redirect && !this.loading) {
      setTimeout(() => {
        this.$router.push({ name: this.redirect });
      }, this.timeout * 1000);
    }
  }
};
</script>

<style lang="scss">
#success {
  padding-top: 128px;
  height: 100%;
  background-image: linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6)),
    url("/photos/app/success-background.jpg");
  background-size: cover;

  .v-card {
    border-radius: 4px;
    padding: 16px;

    #icon {
      border: 6px solid #00e676;
      border-radius: 64px;
      font-weight: 1000;
      height: 96px;
      margin-bottom: 16px;
      padding: 16px;
      width: 96px;
    }
  }
}
</style>
