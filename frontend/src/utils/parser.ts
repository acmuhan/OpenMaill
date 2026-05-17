import type { ParsedAccount } from '@/api'

const SEP_PRIMARY = /----/g
const SEP_SECONDARY = /\s*:\s*/g

/**
 * 解析单行账号数据（兼容"张号呀"等多种格式）：
 * - email----password----client_id----refresh_token[----access_token]
 * - email:password:client_id:refresh_token[:access_token]
 * - 自动处理头尾空白、含 BOM、HTML <br> 换行
 */
export function parseAccountLine(line: string): ParsedAccount | null {
  if (!line) return null
  const trimmed = line.replace(/^[\s﻿]+|[\s﻿]+$/g, '')
  if (!trimmed) return null

  let parts: string[]
  if (trimmed.includes('----')) {
    parts = trimmed.split(SEP_PRIMARY).map((p) => p.trim())
  } else {
    const segs = trimmed.split(SEP_SECONDARY)
    if (segs.length < 4) return null
    parts = [segs[0], segs[1], segs[2], segs.slice(3).join(':')].map((p) => p.trim())
  }

  if (parts.length < 4) return null
  if (!parts[0].includes('@')) return null

  return {
    email: parts[0],
    password: parts[1] || '',
    client_id: parts[2] || '',
    refresh_token: parts[3] || '',
    access_token: parts[4] ? parts[4].trim() : '',
  }
}

/**
 * 解析多行账号数据：忽略空行、HTML 标签、注释行；
 * 自动提取每个能识别 @ 与分隔符的有效账号。
 */
export function parseBulkAccounts(raw: string): ParsedAccount[] {
  if (!raw) return []
  const cleaned = raw.replace(/<br\s*\/?>/gi, '\n').replace(/\r/g, '')
  return cleaned
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && l.includes('@') && (l.includes('----') || l.includes(':')))
    .map(parseAccountLine)
    .filter((acc): acc is ParsedAccount => acc !== null)
}

/**
 * 简单脱敏：用于在 UI 中预览长 token 但不暴露完整内容。
 */
export function maskToken(value: string, head = 12, tail = 6): string {
  if (!value) return ''
  if (value.length <= head + tail + 3) return value
  return `${value.slice(0, head)}…${value.slice(-tail)}`
}
