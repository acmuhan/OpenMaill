import type { ToolDefinition } from '../types'

export interface GmailConfig extends Record<string, unknown> {
  email: string
  client_id: string
  client_secret: string
  refresh_token: string
}

export const gmailTool: ToolDefinition<GmailConfig> = {
  id: 'gmail',
  name: 'Gmail',
  vendor: 'Google',
  homepage: 'https://developers.google.com/gmail/api',
  description: '按 Google OAuth2 + Gmail REST API 协议读取邮件，支持 Refresh Token 换取 Access Token。',
  category: 'mail',
  available: true,
  badge: 'stable',
  icon: 'gmail',
  primaryColor: '#ea4335',
  fields: [
    { key: 'email', label: '邮箱地址', type: 'email', required: true, placeholder: 'user@gmail.com', cols: 1 },
    { key: 'client_id', label: 'OAuth Client ID', type: 'text', required: true, cols: 1 },
    { key: 'client_secret', label: 'OAuth Client Secret', type: 'password', required: true, mask: true, cols: 1 },
    { key: 'refresh_token', label: 'Refresh Token', type: 'textarea', required: true, mask: true, rows: 3, cols: 2 },
  ],
  defaults: { email: '', client_id: '', client_secret: '', refresh_token: '' },
  actions: {
    token: { id: 'token', name: '换取 Access Token', endpoint: '/api/gmail/token' },
    emails: { id: 'emails', name: '读取邮件', endpoint: '/api/gmail/emails' },
    body: { id: 'body', name: '读取正文', endpoint: '/api/gmail/body' },
  },
}
