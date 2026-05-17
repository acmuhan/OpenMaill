<script setup lang="ts">
import { ref } from 'vue'
import { BaseCard, BaseButton, BaseChip, BaseInput, BaseEmpty } from '@/components/ui'
import { activeMail } from '@/stores/providers.store'
import { currentMailbox, currentMailId, emails, prefs } from '@/stores/mail.store'
import { mailService } from '@/services/mail.service'
import { useToast } from '@/stores/toast.store'
import type { EmailItem } from '@/api'

const toast = useToast()
const loading = ref(false)

async function refresh() {
  loading.value = true
  const r = await mailService.listEmails(activeMail.value)
  loading.value = false
  if (r.ok) toast.success(`已加载 ${r.emails.length} 封邮件`)
  else toast.error(r.error)
}

async function open(m: EmailItem) {
  const r = await mailService.openEmail(activeMail.value, m.id)
  if (!r.ok) toast.error(r.error)
}
</script>

<template>
  <BaseCard
    title="邮件列表"
    :subtitle="currentMailbox ? `当前邮箱：${currentMailbox}` : '点击「读取邮件」开始'"
    elevation="soft"
  >
    <template #actions>
      <BaseChip v-if="emails.length" variant="info" size="sm">{{ emails.length }} 封</BaseChip>
      <BaseButton variant="ghost" size="sm" :loading="loading" @click="refresh">刷新</BaseButton>
    </template>

    <div class="flex flex-col gap-4">
      <div class="grid grid-cols-2 gap-3">
        <BaseInput v-model="prefs.folder" label="文件夹" placeholder="INBOX" />
        <BaseInput v-model="prefs.limit" type="number" label="数量" />
      </div>

      <BaseEmpty
        v-if="!emails.length"
        title="收件箱为空"
        description="获取 Token 后点击「读取邮件」即可加载"
        icon="inbox"
      />

      <ul v-else class="flex flex-col gap-1 max-h-[520px] overflow-y-auto pr-1">
        <li
          v-for="m in emails"
          :key="m.id"
          @click="open(m)"
          :class="[
            'cursor-pointer px-4 py-3 rounded-2xl transition-colors flex flex-col gap-1',
            currentMailId === m.id
              ? 'bg-primary-fixed text-on-primary-fixed shadow-[0_4px_16px_rgba(0,61,155,0.08)]'
              : 'bg-surface-container-low/60 hover:bg-surface-container',
          ]"
        >
          <span class="text-sm font-semibold truncate">{{ m.subject || '(无主题)' }}</span>
          <span class="text-[11px] font-mono opacity-80 truncate">{{ m.from }} · {{ m.date }}</span>
        </li>
      </ul>
    </div>
  </BaseCard>
</template>
