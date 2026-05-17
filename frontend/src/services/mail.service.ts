import { api } from '@/api'
import { accessToken, currentMail, currentMailbox, currentMailId, emails, prefs, tokenState } from '@/stores/mail.store'
import type { ToolInstance } from '@/tools'
import { getTool } from '@/tools'

interface OutlookCfg {
  email: string
  client_id: string
  refresh_token: string
}

function readOutlookCfg(inst: ToolInstance): OutlookCfg | null {
  const c = inst.config as Partial<OutlookCfg>
  if (!c.email || !c.client_id || !c.refresh_token) return null
  return { email: c.email, client_id: c.client_id, refresh_token: c.refresh_token }
}

function isOutlook(inst: ToolInstance | null): inst is ToolInstance {
  if (!inst) return false
  const tool = getTool(inst.toolId)
  return tool?.id === 'outlook' && tool.available === true
}

export const mailService = {
  /**
   * 用当前 mail Tool 的 config 换取 access_token。
   * 目前仅 Outlook 可用，Gmail / IMAP 为预留。
   */
  async fetchToken(inst: ToolInstance | null) {
    if (!inst) return { ok: false as const, error: '请先在「供应商」中添加邮箱实例' }
    if (!getTool(inst.toolId)?.available) {
      return { ok: false as const, error: '当前邮箱协议尚未上线（预留）' }
    }
    if (!isOutlook(inst)) {
      return { ok: false as const, error: '该协议的 Token 流程尚未实现' }
    }
    const cfg = readOutlookCfg(inst)
    if (!cfg) return { ok: false as const, error: '请填写邮箱、Client ID、Refresh Token' }

    tokenState.value = 'pending'
    const r = await api.token(cfg.refresh_token, cfg.client_id)
    if (r.ok && r.access_token) {
      accessToken.value = r.access_token
      currentMailbox.value = cfg.email
      tokenState.value = 'ready'
      return { ok: true as const, access_token: r.access_token }
    }
    accessToken.value = ''
    tokenState.value = 'error'
    return { ok: false as const, error: r.error || '换取 Token 失败' }
  },

  async listEmails(inst: ToolInstance | null) {
    if (!isOutlook(inst)) return { ok: false as const, error: '当前邮箱协议尚未上线' }
    if (!accessToken.value) return { ok: false as const, error: '请先获取 Access Token' }
    const cfg = readOutlookCfg(inst)
    if (!cfg) return { ok: false as const, error: '邮箱配置不完整' }

    const r = await api.emails(cfg.email, accessToken.value, prefs.value.folder, prefs.value.limit)
    if (r.ok) {
      emails.value = r.emails
      return { ok: true as const, emails: r.emails }
    }
    return { ok: false as const, error: r.error || '读取邮件失败' }
  },

  async openEmail(inst: ToolInstance | null, mailId: string) {
    if (!isOutlook(inst)) return { ok: false as const, error: '当前邮箱协议尚未上线' }
    if (!accessToken.value) return { ok: false as const, error: '请先获取 Access Token' }
    const cfg = readOutlookCfg(inst)
    if (!cfg) return { ok: false as const, error: '邮箱配置不完整' }

    currentMailId.value = mailId
    const r = await api.emailBody(cfg.email, accessToken.value, mailId)
    if (r.ok) {
      currentMail.value = { subject: r.subject, from: r.from, date: r.date, body: r.body }
      return { ok: true as const, mail: r }
    }
    return { ok: false as const, error: r.error || '加载正文失败' }
  },
}
