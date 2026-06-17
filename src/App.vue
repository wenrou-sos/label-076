<template>
  <n-message-provider>
    <n-dialog-provider>
      <n-loading-bar-provider>
        <router-view />
      </n-loading-bar-provider>
    </n-dialog-provider>
  </n-message-provider>
</template>

<script setup lang="ts">
import { NMessageProvider, NDialogProvider, NLoadingBarProvider } from 'naive-ui'
</script>