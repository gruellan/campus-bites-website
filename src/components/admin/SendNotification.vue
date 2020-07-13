<template>
  <v-card>
    <v-card-title primary-title>
      <div>
        <h3 class="headline mb-0">Send notification to a topic</h3>
        <div>Send test notifications to all registered devices registered to a particular topic.</div>
      </div>
    </v-card-title>

    <v-card-text>
      <v-form>
        <v-select label="Topic" box v-model="topic" :items="['courier', 'admin']" />
        <v-text-field label="Title" box v-model="notification.title" />
        <v-text-field label="Body" box v-model="notification.body" />
        <v-text-field label="Icon" box v-model="notification.icon" />
        <v-text-field label="Badge" box v-model="notification.badge" />
      </v-form>
    </v-card-text>

    <v-card-actions>
      <v-btn block color="success" @click="sendNotification()">Send notification</v-btn>
    </v-card-actions>
  </v-card>
</template>

<script>
import { firestore } from "@/plugins";

export default {
  name: "SendNotification",
  data: () => ({
    topic: "courier",
    notification: {
      title: null,
      body: null,
      icon: "icons/icon-512x512.png",
      badge: "icons/badge-128x128.png"
    }
  }),
  methods: {
    sendNotification() {
      firestore.collection("notifications").add({
        webpush: {
          notification: this.notification
        },
        topic: this.topic
      });
    }
  }
};
</script>
