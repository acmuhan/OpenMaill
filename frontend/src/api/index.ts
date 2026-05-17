export interface ApiResult<T = Record<string, unknown>> {
  ok: boolean
  error?: string
  data?: T
}

export interface Account {
  email: string
  password: string
}

export interface ParsedAccount {
  email: string
  password: string
  client_id: string
  refresh_token: string
  access_token?: string
}

export interface EmailItem {
  id: string
  subject: string
  from: string
  date: string
}

export interface EmailBody {
  subject: string
  from: string
  date: string
  body: string
}

export interface Config {
  base_url: string
  key: string
}

async function postJson<T>(url: string, body: Record<string, unknown>): Promise<T & { ok: boolean; error?: string }> {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return (await response.json()) as T & { ok: boolean; error?: string }
}

export const api = {
  balance(cfg: Config) {
    return postJson<{ balance: string }>('/api/balance', { ...cfg })
  },

  accounts(cfg: Config, type: string, quantity: number) {
    return postJson<{ accounts: Account[] }>('/api/accounts', { ...cfg, type, quantity })
  },

  history(cfg: Config, type: string) {
    return postJson<{ data: string }>('/api/history', { ...cfg, type })
  },

  token(refresh_token: string, client_id: string) {
    return postJson<{ access_token: string; expires_in?: number }>('/api/token', {
      refresh_token,
      client_id,
    })
  },

  emails(email: string, access_token: string, folder: string, limit: number) {
    return postJson<{ emails: EmailItem[] }>('/api/emails', {
      email,
      access_token,
      folder,
      limit,
    })
  },

  emailBody(email: string, access_token: string, mail_id: string) {
    return postJson<EmailBody>('/api/email/body', {
      email,
      access_token,
      mail_id,
    })
  },
}
