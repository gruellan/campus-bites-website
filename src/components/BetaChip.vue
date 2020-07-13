<template>
  <div id="beta-chip">
    <v-tooltip bottom v-if="visible && $vuetify.breakpoint.smAndUp">
      <v-chip slot="activator" outline :text-color="colour" small>
        <span id="label" v-html="text" @click="openURL()"></span>
      </v-chip>
      <span id="description" v-text="description"></span>
    </v-tooltip>
  </div>
</template>

<script>
import { mapGetters } from "vuex";
import Config from "@/config";

export default {
  name: "BetaChip",
  computed: {
    ...mapGetters(["isAdmin"]),
    sha1() {
      return Config.commitSHA1;
    },
    url() {
      return `https://sentry.io/campus-bites/campus-bites-vue/releases/${this.sha1}/`;
    },
    local() {
      return Config.environment === "local";
    },
    dev() {
      return Config.environment === "development";
    },
    staging() {
      return Config.environment === "staging";
    },
    production() {
      return Config.environment === "production";
    },
    visible() {
      return (
        this.local ||
        this.dev ||
        this.staging ||
        (this.production && this.isAdmin)
      );
    },
    text() {
      if (this.local) {
        return "LOCAL";
      } else if (this.dev) {
        return "DEV";
      } else if (this.staging) {
        return "STAGING";
      } else if (this.production) {
        return "PROD";
      } else {
        return "";
      }
    },
    colour() {
      if (this.local) {
        return "cyan";
      } else if (this.dev) {
        return "red";
      } else if (this.staging) {
        return "yellow darken-2";
      } else if (this.production) {
        return "green darken-1";
      } else {
        return "white";
      }
    },
    description() {
      return `${this.sha1 || "local"}@${Config.branch || "local"}`;
    }
  },
  methods: {
    openURL: function() {
      if (this.sha1 && !this.local) {
        window.open(this.url, "_blank");
      }
    }
  }
};
</script>

<style lang="scss">
#beta-chip {
  display: inline;

  .v-chip {
    margin-bottom: 6px;
    margin-left: 12px;
  }

  #description {
    font-size: 11px;
  }

  #label {
    font-family: "Bison Bold";
  }
}
</style>
