<script setup lang="ts">
import { ref } from 'vue'
import Sidebar from '@/components/layout/Sidebar.vue'
import TopBar from '@/components/layout/TopBar.vue'
import BackupDialog from '@/components/modules/backup/BackupDialog.vue'
import ToastHost from '@/components/ToastHost.vue'
import { BaseIcon } from '@/components/ui'
import { navigate, route, type RouteName } from '@/stores/ui.store'

const backupDialog = ref<InstanceType<typeof BackupDialog> | null>(null)
const mobileItems: Array<{ id: RouteName; label: string; icon: string }> = [
  { id: 'dashboard', label: '仪表盘', icon: 'dashboard' },
  { id: 'accounts', label: '账号', icon: 'account' },
  { id: 'mail', label: '邮件', icon: 'mail' },
  { id: 'providers', label: '供应商', icon: 'tool' },
  { id: 'settings', label: '设置', icon: 'settings' },
]

function openBackup() {
  backupDialog.value?.open()
}
</script>

<template>
  <div class="min-h-screen w-full pb-20 lg:pb-0">
    <div class="max-w-[1480px] mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-6 flex gap-6">
      <div class="hidden lg:block">
        <Sidebar />
      </div>

      <div class="flex-1 min-w-0 flex flex-col gap-6">
        <TopBar @open-backup="openBackup" />

        <main class="flex flex-col gap-6">
          <slot />
        </main>

        <footer class="text-center text-xs text-on-surface-variant/60 py-4 min-h-12">
          OpenMail · A Mail Manger Tools
        </footer>
      </div>
    </div>

    <nav class="fixed inset-x-3 bottom-3 z-50 grid grid-cols-5 gap-1 rounded-2xl border border-outline-variant/50 bg-surface-container-lowest/95 p-1 shadow-[0_18px_45px_rgba(15,23,42,0.2)] backdrop-blur lg:hidden">
      <button
        v-for="item in mobileItems"
        :key="item.id"
        type="button"
        @click="navigate(item.id)"
        :class="[
          'flex min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-1 py-2 text-[11px] font-medium transition-colors',
          route === item.id ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:bg-surface-container',
        ]"
      >
        <BaseIcon :name="item.icon" size="sm" />
        <span class="truncate">{{ item.label }}</span>
      </button>
    </nav>

    <BackupDialog ref="backupDialog" />
    <ToastHost />
  </div>
</template>
