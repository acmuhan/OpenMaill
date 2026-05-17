import type { ToolDefinition } from '../types'

export interface ImapConfig extends Record<string, unknown> {
  email: string
  password: string
  host: string
  port: number
  ssl: boolean
}

export const imapTool: ToolDefinition<ImapConfig> = {
  id: 'imap',
  name: 'IMAP / SMTP',
  description: '通用邮箱协议适配，可接入自建邮箱、企业邮箱、QQ / 163 等。后端 /api/imap/* 预留。',
  category: 'mail',
  available: false,
  badge: 'preview',
  icon: 'server',
  fields: [
    { key: 'email', label: '邮箱地址', type: 'email', required: true, cols: 1 },
    { key: 'password', label: '密码 / App Password', type: 'password', required: true, mask: true, cols: 1 },
    { key: 'host', label: 'IMAP 服务器', type: 'text', required: true, placeholder: 'imap.example.com', cols: 1 },
    { key: 'port', label: '端口', type: 'number', default: 993, cols: 1 },
    { key: 'ssl', label: '启用 SSL/TLS', type: 'switch', default: true, cols: 2 },
  ],
  defaults: { email: '', password: '', host: '', port: 993, ssl: true },
  actions: {
    emails: { id: 'emails', name: '读取邮件', endpoint: '/api/imap/emails' },
    body: { id: 'body', name: '读取正文', endpoint: '/api/imap/body' },
  },
}
