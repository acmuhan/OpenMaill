<script setup lang="ts">
import { ref } from 'vue'
import { BaseCard, BaseButton, BaseInput, BaseSelect, BaseChip, BaseEmpty } from '@/components/ui'
import { activeAccount } from '@/stores/providers.store'
import { prefs } from '@/stores/mail.store'
import { accountService } from '@/services/account.service'
import { useToast } from '@/stores/toast.store'
import type { Account } from '@/api'

const toast = useToast()
const loading = ref(false)
const accounts = ref<Account[]>([])

const TYPES = [
  { value: 'hotmail', label: 'Hotmail' },
  { value: 'outlook', label: 'Outlook' },
  { value: 'hotmail_outlook', label: 'Hotmail + Outlook' },
]

async function fetchAccounts() {
  if (!activeAccount.value) {
    toast.error('请先选择一个账号源')
    return
  }
  loading.value = true
  const r = await accountService.accounts(activeAccount.value, prefs.value.account_type, prefs.value.quantity)
  loading.value = false
  if (r.ok) {
    accounts.value = r.accounts || []
    toast.success(`已获取 ${accounts.value.length} 个账号`)
  } else {
    accounts.value = []
    toast.error(r.error)
  }
}

async function copyAll() {
  if (!accounts.value.length) return
  const text = accounts.value.map((a) => `${a.email}----${a.password}`).join('\n')
  try {
    await navigator.clipboard.writeText(text)
    toast.success('已复制全部')
  } catch {
    toast.error('剪贴板不可用')
  }
}

async function copyOne(a: Account) {
  try {
    await navigator.clipboard.writeText(`${a.email}----${a.password}`)
    toast.success('已复制')
  } catch {
    toast.error('剪贴板不可用')
  }
}
</script>

<template>
  <BaseCard
    title="批量获取账号"
    :subtitle="activeAccount ? `通过「${activeAccount.name}」申请新账号` : '请先选择或添加一个账号源'"
    elevation="soft"
  >
    <template #actions>
      <BaseChip v-if="accounts.length" variant="success" size="sm">{{ accounts.length }} 条</BaseChip>
    </template>

    <div class="flex flex-col gap-5">
      <div class="grid grid-cols-2 gap-3">
        <BaseSelect v-model="prefs.account_type" :options="TYPES" label="账号类型" />
        <BaseInput v-model="prefs.quantity" type="number" label="数量" />
      </div>

      <div class="flex flex-wrap items-center gap-3">
        <BaseButton variant="primary" :loading="loading" :disabled="!activeAccount" @click="fetchAccounts">
          获取账号
        </BaseButton>
        <BaseButton variant="ghost" :disabled="!accounts.length" @click="copyAll">复制全部</BaseButton>
      </div>

      <BaseEmpty
        v-if="!accounts.length"
        title="尚未获取账号"
        description="选择类型与数量，点击「获取账号」开始"
        icon="inbox"
      />

      <ul v-else class="flex flex-col gap-2 max-h-[420px] overflow-y-auto pr-1">
        <li
          v-for="(a, idx) in accounts"
          :key="idx"
          class="group flex items-center justify-between gap-3 px-4 py-3 rounded-2xl bg-surface-container-low/60 hover:bg-primary-fixed/40 transition-colors"
        >
          <div class="flex flex-col gap-0.5 min-w-0">
            <span class="text-sm font-medium text-on-surface truncate">{{ a.email }}</span>
            <span class="text-xs font-mono text-on-surface-variant/80 truncate">{{ a.password }}</span>
          </div>
          <button
            class="opacity-0 group-hover:opacity-100 transition-opacity text-xs text-primary hover:underline shrink-0"
            @click="copyOne(a)"
          >复制</button>
        </li>
      </ul>
    </div>
  </BaseCard>
</template>
