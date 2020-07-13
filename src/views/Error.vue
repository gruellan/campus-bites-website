<template>
  <div id="error">
    <v-layout row>
      <v-flex xs12 md6 offset-md3>
        <v-card>
          <v-card-title primary-title class="text-xs-center">
            <div style="width: 100%">
              <v-icon id="icon" size="56" color="red accent-3" outline>close</v-icon>
              <div class="display-1 text-uppercase font-weight-black mb-3">{{ title }}</div>
              <div class="body-2">{{ message }}</div>
              <div class="caption" v-html="caption"></div>
            </div>
          </v-card-title>
          <v-card-actions>
            <v-btn block color="primary" dark :to="{ name: 'home' }">Return to Home Page</v-btn>
          </v-card-actions>
        </v-card>
      </v-flex>
    </v-layout>
  </div>
</template>

<script>
export default {
  name: "Error",
  data: () => ({
    title: "Oops!",
    message: "",
    caption: ""
  }),
  computed: {
    type() {
      return this.$route.query.type;
    }
  },
  created() {
    if (this.type === "unauthorised") {
      this.message =
        "You do not have the required permissions to access this page.";
      this.caption = "If you think this is an error please contact us.";
    } else if (this.type === "login") {
      this.message = "You need to login first!";
    } else {
      this.title = this.$route.query.title || "Oops!";
      this.message = this.$route.query.message || "";
      this.caption = this.$route.query.caption || "";
    }
  }
};
</script>

<style lang="scss">
#error {
  padding-top: 128px;
  height: 100%;
  background-image: linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6)),
    url("/photos/app/success-background.jpg");
  background-size: cover;

  .v-card {
    border-radius: 4px;
    padding: 16px;

    #icon {
      border: 6px solid #ff1744;
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
