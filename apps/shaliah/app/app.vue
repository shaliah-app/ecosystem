<template>
  <div>
    <NuxtRouteAnnouncer />
    <NuxtWelcome />
  </div>
</template>

<script setup lang="ts">
// Example of using the logger composable in a Vue component
import { useLogger } from '../composables/useLogger'

const logger = useLogger()

// Log component mount
onMounted(() => {
  logger.info('Shaliah app mounted', {
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
  })
})

// Example error handling
const handleError = () => {
  try {
    throw new Error('Test error from client-side')
  } catch (error) {
    logger.captureException(error as Error, {
      component: 'App',
      action: 'handleError',
    })
  }
}
</script>
