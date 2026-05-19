<script setup lang="ts">
import { computed } from 'vue'
import { BaseChip, BaseButton, BaseIcon } from '@/components/ui'
import { route, type RouteName } from '@/stores/ui.store'
import { activeAccount } from '@/stores/providers.store'
import { tokenState, currentMailbox, emails } from '@/stores/mail.store'
import { accountService } from '@/services/account.service'
import { useToast } from '@/stores/toast.store'

const toast = useToast()
const emit = defineEmits<{ openBackup: [] }>()

const titles: Record<RouteName, string> = {
  dashboard: '仪表盘',
  accounts: '账号工具',
  mail: '邮件读取',
  providers: '供应商管理',
  settings: '设置 / 备份',
}

const subtitles: Record<RouteName, string> = {
  dashboard: '常用工具与最近活动',
  accounts: '从账号源批量获取账号 / 历史 / 余额',
  mail: '通过 Outlook / Gmail / IMAP 读取邮件',
  providers: '管理所有账号 API 与邮箱协议实例',
  settings: '配置备份、首选项与高级选项',
}

const balanceText = computed(() => activeAccount.value?.state?.balance ?? '--')
const tokenLabel = computed(() => {
  switch (tokenState.value) {
    case 'ready': return '已就绪'
    case 'pending': return '获取中…'
    case 'error': return '失败'
    default: return '未就绪'
  }
})
const tokenVariant = computed<'success' | 'warning' | 'error' | 'neutral'>(() => {
  switch (tokenState.value) {
    case 'ready': return 'success'
    case 'pending': return 'warning'
    case 'error': return 'error'
    default: return 'neutral'
  }
})

async function refreshBalance() {
  const inst = activeAccount.value
  if (!inst) {
    toast.error('当前没有激活的账号源')
    return
  }
  const r = await accountService.balance(inst)
  if (r.ok) toast.success(`${inst.name} 余额：${r.balance}`)
  else toast.error(r.error)
}
</script>

<template>
  <header class="rounded-md bg-surface-container-lowest/85 backdrop-blur-md shadow-[0_8px_32px_rgba(15,23,42,0.06)] px-5 py-4 sm:px-6 sm:py-5 min-h-[112px] sm:min-h-[96px]">
    <div class="flex items-start sm:items-center justify-between gap-4 flex-wrap">
      <div class="flex flex-col gap-1 min-w-0">
        <h1 class="text-xl sm:text-2xl font-bold tracking-tight text-on-surface leading-tight truncate">
          {{ titles[route] }}
        </h1>
        <p class="text-xs sm:text-sm text-on-surface-variant/80 truncate">{{ subtitles[route] }}</p>
      </div>

      <div class="flex items-center gap-2 flex-wrap min-h-9">
        <BaseChip variant="info" size="sm">
          余额 <strong class="ml-1 font-semibold">{{ balanceText }}</strong>
        </BaseChip>
        <BaseChip :variant="tokenVariant" size="sm">
          Token <strong class="ml-1 font-semibold">{{ tokenLabel }}</strong>
        </BaseChip>
        <BaseChip v-if="emails.length" variant="neutral" size="sm">
          {{ emails.length }} 封
        </BaseChip>
        <BaseChip v-if="currentMailbox" variant="success" size="sm">{{ currentMailbox }}</BaseChip>

        <div class="w-px h-6 bg-outline-variant/40 mx-1" />

        <BaseButton variant="ghost" size="sm" @click="refreshBalance" :disabled="!activeAccount">
          <BaseIcon name="settings" size="sm" />
          刷新余额
        </BaseButton>
        <BaseButton variant="secondary" size="sm" @click="emit('openBackup')">
          <BaseIcon name="tool" size="sm" />
          备份
        </BaseButton>
      </div>
    </div>
  </header>
</template>
