import { api } from '@/api'
import { accessToken, currentMail, currentMailbox, currentMailId, emails, prefs, tokenState } from '@/stores/mail.store'
import type { ToolInstance } from '@/tools'
import { getTool } from '@/tools'

function readMailCfg(inst: ToolInstance): Record<string, unknown> {
  return { ...(inst.config || {}) }
}

function requireMailInst(inst: ToolInstance | null) {
  if (!inst) return { ok: false as const, error: '请先在「供应商」中添加邮箱实例' }
  const tool = getTool(inst.toolId)
  if (!tool || tool.category !== 'mail') return { ok: false as const, error: '当前实例不是邮箱协议' }
  if (!tool.available) return { ok: false as const, error: '当前邮箱协议未启用' }
  return { ok: true as const, tool }
}

export const mailService = {
  async fetchToken(inst: ToolInstance | null) {
    const ready = requireMailInst(inst)
    if (!ready.ok) return ready
    const mailInst = inst as ToolInstance
    const cfg = readMailCfg(mailInst)
    if (!cfg) return { ok: false as const, error: '邮箱配置不完整' }

    tokenState.value = 'pending'
    const r = await api.mailToken({ tool: mailInst.toolId, ...cfg })
    if (r.ok && r.access_token) {
      accessToken.value = r.access_token
      currentMailbox.value = String(cfg.email || '')
      tokenState.value = 'ready'
      return { ok: true as const, access_token: r.access_token }
    }
    accessToken.value = ''
    tokenState.value = 'error'
    return { ok: false as const, error: r.error || '换取 Token 失败' }
  },

  async listEmails(inst: ToolInstance | null) {
    const ready = requireMailInst(inst)
    if (!ready.ok) return ready
    const mailInst = inst as ToolInstance
    if (!accessToken.value) return { ok: false as const, error: '请先获取 Access Token' }
    const cfg = readMailCfg(mailInst)

    const r = await api.mailEmails({
      tool: mailInst.toolId,
      access_token: accessToken.value,
      folder: prefs.value.folder,
      limit: prefs.value.limit,
      ...cfg,
    })
    if (r.ok) {
      emails.value = r.emails
      return { ok: true as const, emails: r.emails }
    }
    return { ok: false as const, error: r.error || '读取邮件失败' }
  },

  async openEmail(inst: ToolInstance | null, mailId: string) {
    const ready = requireMailInst(inst)
    if (!ready.ok) return ready
    const mailInst = inst as ToolInstance
    if (!accessToken.value) return { ok: false as const, error: '请先获取 Access Token' }
    const cfg = readMailCfg(mailInst)

    currentMailId.value = mailId
    const r = await api.mailBody({
      tool: mailInst.toolId,
      access_token: accessToken.value,
      mail_id: mailId,
      ...cfg,
    })
    if (r.ok) {
      currentMail.value = { subject: r.subject, from: r.from, date: r.date, body: r.body }
      return { ok: true as const, mail: r }
    }
    return { ok: false as const, error: r.error || '加载正文失败' }
  },
}
