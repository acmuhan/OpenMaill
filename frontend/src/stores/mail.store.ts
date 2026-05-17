import { ref, watch } from 'vue'
import type { EmailItem, EmailBody } from '@/api'
import { loadJson, saveJson } from './storage'

const KEY_PREFS = 'mail.prefs'

interface MailPrefs {
  folder: string
  limit: number
  account_type: string
  quantity: number
  history_type: string
  /** 默认显示纯文本，true 时渲染 HTML */
  renderHtml: boolean
}

const DEFAULT_PREFS: MailPrefs = {
  folder: 'INBOX',
  limit: 20,
  account_type: 'hotmail',
  quantity: 1,
  history_type: 'hotmail',
  renderHtml: false,
}

export const prefs = ref<MailPrefs>({ ...DEFAULT_PREFS, ...loadJson(KEY_PREFS, {}) })
watch(prefs, (v) => saveJson(KEY_PREFS, v), { deep: true })

// 运行时邮箱状态
export const accessToken = ref<string>('')
export const currentMailbox = ref<string>('')
export const tokenState = ref<'idle' | 'pending' | 'ready' | 'error'>('idle')
export const emails = ref<EmailItem[]>([])
export const currentMail = ref<EmailBody | null>(null)
export const currentMailId = ref<string>('')

export function resetMailRuntime(): void {
  accessToken.value = ''
  currentMailbox.value = ''
  tokenState.value = 'idle'
  emails.value = []
  currentMail.value = null
  currentMailId.value = ''
}
