<script setup lang="ts">
import { computed, ref } from 'vue'
import { BaseCard, BaseButton, BaseChip, BaseTextarea } from '@/components/ui'
import { parseAccountLine, parseBulkAccounts, maskToken } from '@/utils/parser'
import { mailInstances, activeMailId, updateInstanceConfig, activeAccount } from '@/stores/providers.store'
import { accessToken, tokenState } from '@/stores/mail.store'
import { mailService } from '@/services/mail.service'
import { useToast } from '@/stores/toast.store'
import type { ParsedAccount } from '@/api'

const toast = useToast()
const raw = ref('')
const busy = ref(false)

const parsedList = computed(() => parseBulkAccounts(raw.value))
const firstParsed = computed<ParsedAccount | null>(() => parsedList.value[0] ?? null)

function findOutlookInstance() {
  // 找到当前激活的邮箱实例；若不是 outlook，则寻找第一个可用的 outlook 实例
  const list = mailInstances.value
  const current = list.find((i) => i.id === activeMailId.value)
  if (current && current.toolId === 'outlook' && current.enabled) return current
  const fallback = list.find((i) => i.toolId === 'outlook' && i.enabled)
  if (fallback) {
    activeMailId.value = fallback.id
    return fallback
  }
  return null
}

function applyToOutlook(acc: ParsedAccount): boolean {
  const inst = findOutlookInstance()
  if (!inst) {
    toast.error('未配置可用的 Outlook 邮箱实例，请到「供应商」添加')
    return false
  }
  updateInstanceConfig(inst.id, {
    email: acc.email,
    client_id: acc.client_id,
    refresh_token: acc.refresh_token,
  })
  return true
}

function fillOnly() {
  if (!raw.value.trim()) {
    toast.error('请先粘贴账号串')
    return
  }
  const target = firstParsed.value || parseAccountLine(raw.value)
  if (!target) {
    toast.error('无法识别该账号串，请检查分隔符 (---- 或 :)')
    return
  }
  if (applyToOutlook(target)) {
    toast.success(`已填入 Outlook 实例：${target.email}`)
  }
}

async function fetchToken() {
  fillOnly()
  if (!accessToken.value && tokenState.value !== 'pending') {
    busy.value = true
    const r = await mailService.fetchToken(findOutlookInstance())
    busy.value = false
    if (r.ok) toast.success('Access Token 获取成功')
    else toast.error(r.error)
  }
}

async function fetchAll() {
  if (!raw.value.trim()) {
    toast.error('请先粘贴账号串')
    return
  }
  const target = firstParsed.value || parseAccountLine(raw.value)
  if (!target) {
    toast.error('无法识别该账号串')
    return
  }
  const inst = findOutlookInstance()
  if (!inst) {
    toast.error('未配置可用的 Outlook 邮箱实例')
    return
  }
  updateInstanceConfig(inst.id, {
    email: target.email,
    client_id: target.client_id,
    refresh_token: target.refresh_token,
  })
  busy.value = true
  const t = await mailService.fetchToken(inst)
  if (!t.ok) {
    busy.value = false
    toast.error(t.error)
    return
  }
  const m = await mailService.listEmails(inst)
  busy.value = false
  if (m.ok) toast.success(`已加载 ${m.emails.length} 封邮件`)
  else toast.error(m.error)
}

function clearInput() {
  raw.value = ''
}
</script>

<template>
  <BaseCard
    title="账号鸭 / 通用 Token 工具栏"
    subtitle="粘贴账号鸭等服务的账号串，一键解析并填入当前 Outlook 实例"
    padding="lg"
    elevation="lifted"
  >
    <template #actions>
      <BaseChip variant="info" size="md">
        <template #icon>
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.4" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
          </svg>
        </template>
        识别 {{ parsedList.length }} 条
      </BaseChip>
    </template>

    <div class="flex flex-col gap-5">
      <BaseTextarea
        v-model="raw"
        :rows="4"
        placeholder="邮箱----密码----ClientID----RefreshToken
也支持以 ':' 为分隔符；可一次粘贴多行。"
        hint="自动识别账号鸭 / 通用导出格式，忽略空行与 <br> 等多余符号"
      />

      <div v-if="firstParsed" class="rounded-md bg-surface-container-low/70 border border-outline-variant/30 p-4">
        <div class="flex items-start justify-between gap-4 flex-wrap">
          <div class="flex flex-col gap-1.5 min-w-0">
            <div class="flex items-center gap-2 flex-wrap">
              <span class="text-sm font-semibold text-on-surface truncate">{{ firstParsed.email }}</span>
              <BaseChip variant="success" size="sm">已识别</BaseChip>
            </div>
            <p class="text-xs text-on-surface-variant/80 font-mono break-all">
              ClientID：{{ maskToken(firstParsed.client_id, 8, 6) }} · RFTK：{{ maskToken(firstParsed.refresh_token, 14, 8) }}
            </p>
          </div>
          <BaseChip v-if="parsedList.length > 1" variant="warning" size="sm">
            另 {{ parsedList.length - 1 }} 条已忽略
          </BaseChip>
        </div>
      </div>

      <div class="flex flex-wrap items-center gap-3">
        <BaseButton variant="primary" :loading="busy" @click="fetchAll">
          一键提取 + 拉取邮件
        </BaseButton>
        <BaseButton variant="secondary" :loading="busy" @click="fetchToken">
          仅获取 Access Token
        </BaseButton>
        <BaseButton variant="ghost" @click="fillOnly">
          仅填入 Outlook 面板
        </BaseButton>
        <BaseButton v-if="raw" variant="ghost" size="sm" @click="clearInput">清空</BaseButton>

        <div class="ml-auto text-xs text-on-surface-variant/70" v-if="activeAccount?.name">
          账号源：<span class="font-mono">{{ activeAccount.name }}</span>
        </div>
      </div>
    </div>
  </BaseCard>
</template>
