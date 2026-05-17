<script setup lang="ts">
import { computed, defineAsyncComponent, onMounted } from 'vue'
import AppLayout from './layouts/AppLayout.vue'
import { route, initRouter } from './stores/ui.store'

const Dashboard = defineAsyncComponent(() => import('./views/DashboardView.vue'))
const Accounts = defineAsyncComponent(() => import('./views/AccountsView.vue'))
const Mail = defineAsyncComponent(() => import('./views/MailView.vue'))
const Providers = defineAsyncComponent(() => import('./views/ProvidersView.vue'))
const Settings = defineAsyncComponent(() => import('./views/SettingsView.vue'))

const currentView = computed(() => {
  switch (route.value) {
    case 'accounts': return Accounts
    case 'mail': return Mail
    case 'providers': return Providers
    case 'settings': return Settings
    case 'dashboard':
    default: return Dashboard
  }
})

onMounted(() => initRouter())
</script>

<template>
  <AppLayout>
    <Transition name="page" mode="out-in">
      <div :key="route" class="flex flex-col gap-6">
        <component :is="currentView" />
      </div>
    </Transition>
  </AppLayout>
</template>

<style>
.page-enter-active, .page-leave-active {
  transition: opacity 200ms ease, transform 200ms ease;
}
.page-enter-from, .page-leave-to {
  opacity: 0;
  transform: translateY(8px);
}
</style>
