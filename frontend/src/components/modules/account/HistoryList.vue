<script setup lang="ts">
import { computed, ref } from 'vue'
import { BaseCard, BaseButton, BaseSelect, BaseChip, BaseEmpty } from '@/components/ui'
import { activeAccount, mailInstances, activeMailId, updateInstanceConfig } from '@/stores/providers.store'
import { prefs } from '@/stores/mail.store'
import { accountService } from '@/services/account.service'
import { mailService } from '@/services/mail.service'
import { parseBulkAccounts, maskToken } from '@/utils/parser'
import { useToast } from '@/stores/toast.store'
import type { ParsedAccount } from '@/api'

const toast = useToast()
const loading = ref(false)
const parsed = ref<ParsedAccount[]>([])
const errorMsg = ref('')

const TYPES = [
  { value: 'hotmail', label: 'Hotmail' },
  { value: 'outlook', label: 'Outlook' },
  { value: 'hotmail_outlook', label: 'Hotmail + Outlook' },
]

const empty = computed(() => !parsed.value.length && !loading.value && !errorMsg.value)

async function refresh() {
  if (!activeAccount.value) {
    toast.error('请先选择一个账号源')
    return
  }
  loading.value = true
  errorMsg.value = ''
  const r = await accountService.history(activeAccount.value, prefs.value.history_type)
  loading.value = false
  if (r.ok) {
    parsed.value = parseBulkAccounts(r.raw || '')
    if (!parsed.value.length) errorMsg.value = '历史为空，或当前类型无可识别的账号'
    else toast.success(`已解析 ${parsed.value.length} 条历史`)
  } else {
    parsed.value = []
    errorMsg.value = r.error || '查询失败'
    toast.error(errorMsg.value)
  }
}

function ensureOutlook() {
  const list = mailInstances.value
  const cur = list.find((i) => i.id === activeMailId.value)
  if (cur && cur.toolId === 'outlook' && cur.enabled) return cur
  const fallback = list.find((i) => i.toolId === 'outlook' && i.enabled)
  if (fallback) {
    activeMailId.value = fallback.id
    return fallback
  }
  return null
}

function fill(acc: ParsedAccount) {
  const inst = ensureOutlook()
  if (!inst) {
    toast.error('未配置可用的 Outlook 邮箱实例')
    return
  }
  updateInstanceConfig(inst.id, {
    email: acc.email,
    client_id: acc.client_id,
    refresh_token: acc.refresh_token,
  })
  toast.success(`已填入：${acc.email}`)
}

async function quickToken(acc: ParsedAccount) {
  fill(acc)
  const inst = ensureOutlook()
  if (!inst) return
  const r = await mailService.fetchToken(inst)
  if (r.ok) toast.success('Token 已获取')
  else toast.error(r.error)
}

async function quickAll(acc: ParsedAccount) {
  fill(acc)
  const inst = ensureOutlook()
  if (!inst) return
  const t = await mailService.fetchToken(inst)
  if (!t.ok) return toast.error(t.error)
  const m = await mailService.listEmails(inst)
  if (m.ok) toast.success(`已加载 ${m.emails.length} 封邮件`)
  else toast.error(m.error)
}
</script>

<template>
  <BaseCard
    title="历史账号"
    :subtitle="activeAccount ? `从「${activeAccount.name}」拉取最近账号 / Token` : '请先选择一个账号源'"
    elevation="soft"
  >
    <template #actions>
      <BaseChip v-if="parsed.length" variant="info" size="sm">{{ parsed.length }} 条</BaseChip>
    </template>

    <div class="flex flex-col gap-4">
      <div class="grid grid-cols-2 gap-3">
        <BaseSelect v-model="prefs.history_type" :options="TYPES" label="历史类型" />
        <div class="flex items-end">
          <BaseButton variant="primary" :loading="loading" :disabled="!activeAccount" full-width @click="refresh">
            刷新历史
          </BaseButton>
        </div>
      </div>

      <BaseEmpty
        v-if="empty"
        title="尚无历史"
        description="点击「刷新历史」加载最近账号"
        icon="folder"
      />

      <BaseEmpty
        v-else-if="errorMsg"
        :title="'查询失败'"
        :description="errorMsg"
        icon="alert"
        variant="error"
      />

      <ul v-else class="flex flex-col gap-2 max-h-[480px] overflow-y-auto pr-1">
        <li
          v-for="acc in parsed"
          :key="acc.email + acc.client_id"
          class="rounded-2xl bg-surface-container-low/60 hover:bg-primary-fixed/40 p-4 transition-colors flex flex-col gap-3"
        >
          <div class="flex items-start justify-between gap-2">
            <div class="flex flex-col gap-1 min-w-0">
              <span class="text-sm font-semibold text-on-surface truncate">{{ acc.email }}</span>
              <span class="text-[11px] font-mono text-on-surface-variant/80 truncate">
                CID {{ maskToken(acc.client_id, 8, 4) }} · RFTK {{ maskToken(acc.refresh_token, 10, 6) }}
              </span>
            </div>
          </div>
          <div class="flex flex-wrap gap-2">
            <BaseButton variant="ghost" size="sm" @click="fill(acc)">填入</BaseButton>
            <BaseButton variant="secondary" size="sm" @click="quickToken(acc)">获取 Token</BaseButton>
            <BaseButton variant="primary" size="sm" @click="quickAll(acc)">Token + 邮件</BaseButton>
          </div>
        </li>
      </ul>
    </div>
  </BaseCard>
</template>
