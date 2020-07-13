<template>
  <div id="admin-notifications">
    <h1>Notification Manager</h1>
    <SendNotification />
  </div>
</template>

<script>
import SendNotification from "@/components/admin/SendNotification";

export default {
  name: "AdminNotifications",
  components: { SendNotification }
};
</script>
