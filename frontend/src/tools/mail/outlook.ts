import type { ToolDefinition } from '../types'

export interface OutlookConfig extends Record<string, unknown> {
  email: string
  client_id: string
  refresh_token: string
}

export const outlookTool: ToolDefinition<OutlookConfig> = {
  id: 'outlook',
  name: 'Outlook / Hotmail',
  vendor: 'Microsoft Graph',
  homepage: 'https://learn.microsoft.com/graph',
  description: '通过 Microsoft Graph API 使用 Refresh Token 换取 Access Token 并读取邮件。',
  category: 'mail',
  available: true,
  badge: 'stable',
  icon: 'mail',
  primaryColor: '#0078d4',
  fields: [
    { key: 'email', label: '邮箱地址', type: 'email', required: true, placeholder: 'user@hotmail.com', cols: 1 },
    { key: 'client_id', label: 'Client ID', type: 'text', required: true, placeholder: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', cols: 1 },
    { key: 'refresh_token', label: 'Refresh Token', type: 'textarea', required: true, mask: true, rows: 3, cols: 2 },
  ],
  defaults: { email: '', client_id: '', refresh_token: '' },
  validate(c) {
    if (!c.email || !c.email.includes('@')) return '请输入合法的邮箱地址'
    if (!c.client_id) return '请填写 Client ID'
    if (!c.refresh_token) return '请填写 Refresh Token'
    return null
  },
  actions: {
    token: { id: 'token', name: '换取 Access Token', endpoint: '/api/token' },
    emails: { id: 'emails', name: '读取邮件', endpoint: '/api/emails' },
    body: { id: 'body', name: '读取正文', endpoint: '/api/email/body' },
  },
}
