<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  BaseCard,
  BaseButton,
  BaseField,
  BaseTabs,
  BaseChip,
} from '@/components/ui'
import { activeMail, mailInstances, activeMailId, updateInstanceConfig } from '@/stores/providers.store'
import { accessToken, tokenState } from '@/stores/mail.store'
import { mailService } from '@/services/mail.service'
import { useToast } from '@/stores/toast.store'
import { getTool } from '@/tools'
import { maskToken } from '@/utils/parser'

const toast = useToast()
const tokenLoading = ref(false)
const mailLoading = ref(false)

const tabs = computed(() =>
  mailInstances.value.map((i) => {
    const tool = getTool(i.toolId)
    return {
      value: i.id,
      label: i.name,
      badge: tool?.available ? undefined : '未启用',
      disabled: false,
    }
  }),
)

const currentTool = computed(() => (activeMail.value ? getTool(activeMail.value.toolId) : null))
const fields = computed(() => currentTool.value?.fields || [])
const available = computed(() => currentTool.value?.available === true)

const tokenPreview = computed(() => (accessToken.value ? maskToken(accessToken.value, 20, 8) : ''))

function setField(key: string, value: unknown) {
  if (!activeMail.value) return
  updateInstanceConfig(activeMail.value.id, { [key]: value })
}

async function fetchToken() {
  if (!activeMail.value) {
    toast.warn('请先选择邮箱实例')
    return
  }
  tokenLoading.value = true
  const r = await mailService.fetchToken(activeMail.value)
  tokenLoading.value = false
  if (r.ok) toast.success('Access Token 获取成功')
  else toast.error(r.error)
}

async function fetchEmails() {
  if (!activeMail.value) return toast.warn('请先选择邮箱实例')
  if (!accessToken.value) return toast.error('请先获取 Access Token')
  mailLoading.value = true
  const r = await mailService.listEmails(activeMail.value)
  mailLoading.value = false
  if (r.ok) toast.success(`已加载 ${r.emails.length} 封邮件`)
  else toast.error(r.error)
}

async function fetchAll() {
  await fetchToken()
  if (accessToken.value) await fetchEmails()
}

async function copyToken() {
  if (!accessToken.value) return
  try {
    await navigator.clipboard.writeText(accessToken.value)
    toast.success('Access Token 已复制')
  } catch {
    toast.error('剪贴板不可用')
  }
}
</script>

<template>
  <BaseCard
    title="邮箱登录"
    subtitle="选择邮箱协议实例，使用 OAuth / Refresh Token 拉取邮件"
    elevation="soft"
  >
    <template #actions>
      <BaseChip v-if="tokenState === 'ready'" variant="success" size="sm">已就绪</BaseChip>
      <BaseChip v-else-if="tokenState === 'pending'" variant="warning" size="sm">获取中</BaseChip>
      <BaseChip v-else-if="tokenState === 'error'" variant="error" size="sm">失败</BaseChip>
    </template>

    <div class="flex flex-col gap-5">
      <BaseTabs
        v-if="tabs.length > 1"
        :model-value="activeMailId"
        :tabs="tabs"
        @update:model-value="(v: string) => (activeMailId = v)"
      />

      <div v-if="!activeMail" class="rounded-md bg-surface-container-low/60 border border-dashed border-outline-variant/40 p-8 text-center">
        <p class="text-sm text-on-surface-variant/70">尚未添加邮箱实例，请到「供应商」页面新增。</p>
      </div>

      <template v-else>
        <!-- 动态表单：从 Tool fields 自动渲染 -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div
            v-for="f in fields"
            :key="f.key"
            :class="f.cols === 2 ? 'sm:col-span-2' : ''"
          >
            <BaseField
              :field="f"
              :model-value="activeMail!.config[f.key]"
              :disabled="!available"
              @update:model-value="(v) => setField(f.key, v)"
            />
          </div>
        </div>

        <div class="flex flex-wrap items-center gap-3">
          <BaseButton variant="primary" :loading="tokenLoading" :disabled="!available" @click="fetchToken">
            获取 Access Token
          </BaseButton>
          <BaseButton variant="secondary" :loading="mailLoading" :disabled="!available" @click="fetchEmails">
            读取邮件
          </BaseButton>
          <BaseButton variant="ghost" :loading="tokenLoading || mailLoading" :disabled="!available" @click="fetchAll">
            Token + 邮件
          </BaseButton>
        </div>

        <div
          v-if="accessToken"
          class="rounded-2xl bg-secondary-fixed/60 border border-secondary/20 p-4 flex items-center justify-between gap-3"
        >
          <div class="flex flex-col gap-1 min-w-0">
            <span class="text-xs font-medium text-on-secondary-fixed tracking-wider">ACCESS TOKEN</span>
            <span class="text-xs font-mono text-on-secondary-fixed/90 truncate">{{ tokenPreview }}</span>
          </div>
          <BaseButton variant="ghost" size="sm" @click="copyToken">复制</BaseButton>
        </div>
      </template>
    </div>
  </BaseCard>
</template>
