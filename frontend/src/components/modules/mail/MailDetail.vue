<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { BaseCard, BaseButton, BaseChip, BaseSwitch, BaseEmpty, BaseTabs } from '@/components/ui'
import { currentMail, currentMailId, prefs } from '@/stores/mail.store'
import { extractOtp, extractLinks, looksLikeHtml, stripHtml, sanitizeHtml } from '@/services/mail-body.service'
import { useToast } from '@/stores/toast.store'

const toast = useToast()

type ViewMode = 'auto' | 'text' | 'html' | 'raw'
const viewMode = ref<ViewMode>('auto')

const viewTabs = computed(() => [
  { value: 'auto', label: '智能' },
  { value: 'text', label: '纯文本' },
  { value: 'html', label: 'HTML', badge: prefs.value.renderHtml ? undefined : '默认关' },
  { value: 'raw', label: '源码' },
])

const isHtml = computed(() => (currentMail.value ? looksLikeHtml(currentMail.value.body) : false))

const textBody = computed(() => {
  if (!currentMail.value) return ''
  return isHtml.value ? stripHtml(currentMail.value.body) : currentMail.value.body
})

const sandboxHtml = computed(() => {
  if (!currentMail.value) return ''
  return isHtml.value ? sanitizeHtml(currentMail.value.body) : sanitizeHtml(`<pre>${escapeHtml(currentMail.value.body)}</pre>`)
})

const otpHits = computed(() => (currentMail.value ? extractOtp(textBody.value, 3) : []))
const links = computed(() => (currentMail.value ? extractLinks(textBody.value, 6) : []))

const effectiveMode = computed<'text' | 'html' | 'raw'>(() => {
  if (viewMode.value === 'auto') {
    // 默认安全：纯文本；用户在 prefs 开启了渲染 HTML 才用 html
    if (isHtml.value && prefs.value.renderHtml) return 'html'
    return 'text'
  }
  return viewMode.value
})

// 切换邮件时，回到 auto 模式
watch(currentMailId, () => {
  viewMode.value = 'auto'
})

async function copyText(text: string, hint = '已复制') {
  try {
    await navigator.clipboard.writeText(text)
    toast.success(hint)
  } catch {
    toast.error('剪贴板不可用')
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
</script>

<template>
  <BaseCard
    title="邮件正文"
    :subtitle="currentMail ? '已识别验证码 / 链接见上方' : '从列表中选择一封邮件'"
    elevation="lifted"
  >
    <template #actions>
      <BaseSwitch
        v-model="prefs.renderHtml"
        label="允许渲染 HTML"
        hint="默认关闭以防御外链追踪"
        size="sm"
      />
    </template>

    <BaseEmpty
      v-if="!currentMail"
      title="未选择邮件"
      description="点击邮件列表中的任意一封查看内容"
      icon="inbox"
      variant="subtle"
    />

    <article v-else class="flex flex-col gap-5">
      <!-- 头部信息 -->
      <header class="flex flex-col gap-2 pb-4 border-b border-outline-variant/30">
        <h3 class="text-lg font-semibold text-on-surface leading-snug">{{ currentMail.subject || '(无主题)' }}</h3>
        <div class="flex flex-wrap gap-2 text-xs text-on-surface-variant/80">
          <span><strong class="text-on-surface">发件人：</strong>{{ currentMail.from }}</span>
          <span>·</span>
          <span><strong class="text-on-surface">时间：</strong>{{ currentMail.date }}</span>
          <BaseChip v-if="isHtml" variant="info" size="sm">HTML</BaseChip>
        </div>
      </header>

      <!-- 验证码高亮区 -->
      <div
        v-if="otpHits.length"
        class="rounded-md bg-gradient-to-br from-primary-fixed to-primary-fixed-dim border border-primary/15 p-4 sm:p-5 flex flex-col gap-3"
      >
        <div class="flex items-center gap-2 text-xs uppercase tracking-wider text-on-primary-fixed/80 font-bold">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.4" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="m9 12.75 3 3m0 0 3-3m-3 3v-7.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
          </svg>
          自动识别验证码
        </div>
        <div class="flex flex-wrap gap-3">
          <button
            v-for="hit in otpHits"
            :key="hit.code"
            @click="copyText(hit.code, `验证码 ${hit.code} 已复制`)"
            class="group flex flex-col gap-1 px-5 py-3 rounded-2xl bg-white shadow-[0_4px_16px_rgba(0,61,155,0.12)] hover:shadow-[0_8px_24px_rgba(0,61,155,0.2)] hover:-translate-y-0.5 transition-all"
          >
            <span class="text-2xl sm:text-3xl font-bold tracking-[0.2em] text-primary font-mono">{{ hit.code }}</span>
            <span class="text-[10px] uppercase tracking-wider text-on-surface-variant/70 group-hover:text-primary">
              点击复制 · {{ hit.source === 'keyword' ? '关键词匹配' : hit.source === 'pattern' ? '模式匹配' : '启发式' }}
            </span>
          </button>
        </div>
      </div>

      <!-- 视图切换 -->
      <div class="flex items-center justify-between flex-wrap gap-3">
        <BaseTabs v-model="viewMode" :tabs="viewTabs" size="sm" />
        <div class="flex items-center gap-2">
          <BaseButton variant="ghost" size="sm" @click="copyText(textBody, '正文已复制')">复制全文</BaseButton>
        </div>
      </div>

      <!-- 内容区 -->
      <div v-if="effectiveMode === 'html'" class="rounded-2xl overflow-hidden border border-outline-variant/30 bg-white">
        <iframe
          :srcdoc="sandboxHtml"
          sandbox="allow-popups"
          referrerpolicy="no-referrer"
          class="w-full h-[520px] bg-white"
        />
      </div>

      <pre
        v-else-if="effectiveMode === 'text'"
        class="text-sm font-mono whitespace-pre-wrap leading-relaxed text-on-surface bg-surface-container-low/40 rounded-2xl p-5 max-h-[520px] overflow-auto"
      >{{ textBody }}</pre>

      <pre
        v-else
        class="text-xs font-mono whitespace-pre-wrap leading-relaxed text-on-surface-variant bg-surface-container-low/60 rounded-2xl p-5 max-h-[520px] overflow-auto"
      >{{ currentMail.body }}</pre>

      <!-- 链接区 -->
      <div v-if="links.length" class="flex flex-col gap-2 pt-3 border-t border-outline-variant/30">
        <span class="text-xs uppercase tracking-wider text-on-surface-variant/70 font-semibold">正文链接</span>
        <ul class="flex flex-col gap-1">
          <li v-for="(u, i) in links" :key="i" class="flex items-center gap-2 group">
            <a :href="u" target="_blank" rel="noopener noreferrer" class="text-sm text-primary hover:underline truncate flex-1 font-mono">{{ u }}</a>
            <button
              @click="copyText(u, '链接已复制')"
              class="opacity-0 group-hover:opacity-100 transition-opacity text-xs text-on-surface-variant hover:text-primary"
            >复制</button>
          </li>
        </ul>
      </div>
    </article>
  </BaseCard>
</template>
