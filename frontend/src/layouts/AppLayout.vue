<script setup lang="ts">
import { ref } from 'vue'
import Sidebar from '@/components/layout/Sidebar.vue'
import TopBar from '@/components/layout/TopBar.vue'
import BackupDialog from '@/components/modules/backup/BackupDialog.vue'
import ToastHost from '@/components/ToastHost.vue'

const backupDialog = ref<InstanceType<typeof BackupDialog> | null>(null)

function openBackup() {
  backupDialog.value?.open()
}
</script>

<template>
  <div class="min-h-screen w-full">
    <div class="max-w-[1480px] mx-auto px-4 sm:px-6 lg:px-8 py-6 flex gap-6">
      <Sidebar />

      <div class="flex-1 min-w-0 flex flex-col gap-6">
        <TopBar @open-backup="openBackup" />

        <main class="flex flex-col gap-6">
          <slot />
        </main>

        <footer class="text-center text-xs text-on-surface-variant/60 py-4">
          OpenMail · 模块化邮箱工具套件 · 配置保存在本地浏览器
        </footer>
      </div>
    </div>

    <BackupDialog ref="backupDialog" />
    <ToastHost />
  </div>
</template>
