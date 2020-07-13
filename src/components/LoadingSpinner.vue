<template>
  <div v-if="loading" class="loading-spinner">
    <v-progress-circular indeterminate color="primary" size="64" style />
  </div>
</template>

<script>
export default {
  name: "LoadingSpinner",
  props: ["loading"]
};
</script>


<style lang="scss">
.loading-spinner {
  width: 100%;

  .v-progress-circular {
    display: block;
    margin: auto;
  }
}
</style>
