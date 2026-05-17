/**
 * 邮件正文识别助手：
 *  - extractOtp：提取验证码 / 一次性密码
 *  - extractLinks：识别正文中的链接
 *  - stripHtml：把 HTML 转为可读纯文本
 *  - sanitizeHtml：构建可在 sandbox iframe 渲染的安全 HTML
 */

export interface OtpHit {
  code: string
  /** 命中上下文片段（首次出现的位置 ±40 字） */
  context: string
  /** 命中来源：text / html / heuristic */
  source: 'keyword' | 'pattern' | 'heuristic'
  confidence: number // 0-1
}

const KEYWORDS = [
  '验证码', '动态码', '校验码', '驗證碼', '验证代码',
  'verification code', 'verify code', 'security code',
  'one[- ]?time password', 'one[- ]?time code',
  'otp', 'auth code', 'access code', 'confirmation code',
  'pin', 'code is', 'your code',
]

const KEYWORD_RE = new RegExp(`(?:${KEYWORDS.join('|')})[^A-Za-z0-9]{0,32}([A-Za-z0-9]{4,10})`, 'gi')
const ENG_DIGIT_RE = /\b(\d{4,8})\b/g
const ALPHA_DIGIT_RE = /\b([A-Z0-9]{5,8})\b/g

/**
 * 从邮件正文中尝试提取验证码。返回置信度最高的若干候选。
 */
export function extractOtp(rawText: string, max = 3): OtpHit[] {
  if (!rawText) return []
  const text = rawText.replace(/\s+/g, ' ').trim()
  const hits: OtpHit[] = []
  const seen = new Set<string>()

  function pushHit(code: string, idx: number, source: OtpHit['source'], confidence: number) {
    if (!code || seen.has(code)) return
    if (!/[A-Za-z0-9]/.test(code)) return
    seen.add(code)
    const start = Math.max(0, idx - 40)
    const end = Math.min(text.length, idx + code.length + 40)
    hits.push({
      code,
      source,
      confidence,
      context: text.slice(start, end).trim(),
    })
  }

  // 1) 关键词附近的优先级最高
  for (const match of text.matchAll(KEYWORD_RE)) {
    pushHit(match[1], match.index ?? 0, 'keyword', 0.95)
  }

  // 2) 大写字母+数字的 5-8 位组合（典型 OTP 形式：XK9F4Q）
  if (hits.length < max) {
    for (const match of text.matchAll(ALPHA_DIGIT_RE)) {
      const code = match[1]
      if (!/\d/.test(code) || !/[A-Z]/.test(code)) continue // 必须含字母+数字
      pushHit(code, match.index ?? 0, 'pattern', 0.7)
      if (hits.length >= max) break
    }
  }

  // 3) 纯数字 4-8 位（最后才考虑，且需要"独立"于上下文）
  if (hits.length < max) {
    for (const match of text.matchAll(ENG_DIGIT_RE)) {
      const code = match[1]
      // 排除明显是年份 / 邮编 / 价格
      if (/^(19|20)\d{2}$/.test(code)) continue
      pushHit(code, match.index ?? 0, 'heuristic', 0.55)
      if (hits.length >= max) break
    }
  }

  return hits.sort((a, b) => b.confidence - a.confidence).slice(0, max)
}

const URL_RE = /https?:\/\/[^\s<>"']{4,}/g

export function extractLinks(rawText: string, max = 6): string[] {
  if (!rawText) return []
  const out = new Set<string>()
  for (const m of rawText.matchAll(URL_RE)) {
    out.add(m[0].replace(/[.,;:)\]}>]+$/, ''))
    if (out.size >= max) break
  }
  return Array.from(out)
}

const HTML_TAG_RE = /<\/?[^>]+>/g
const HTML_ENTITY = /&(amp|lt|gt|quot|#39|nbsp);/g

export function stripHtml(html: string): string {
  if (!html) return ''
  // 先把 <br>, </p>, </div> 替换为换行
  const withBreaks = html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|li|tr|h[1-6])>/gi, '\n')
  return withBreaks
    .replace(HTML_TAG_RE, '')
    .replace(HTML_ENTITY, (_m, e) => {
      switch (e) {
        case 'amp': return '&'
        case 'lt': return '<'
        case 'gt': return '>'
        case 'quot': return '"'
        case '#39': return "'"
        case 'nbsp': return ' '
        default: return ''
      }
    })
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

/**
 * 构建可在 sandbox iframe 渲染的最小安全 HTML：
 *  - 去掉 <script> / event handlers
 *  - 强制所有 a target="_blank" + rel="noopener"
 *  - 包一层 base style 防止字体过小
 */
export function sanitizeHtml(html: string): string {
  if (!html) return ''
  const noScript = html.replace(/<script[\s\S]*?<\/script>/gi, '')
  const noEvents = noScript.replace(/\son[a-z]+="[^"]*"/gi, '').replace(/\son[a-z]+='[^']*'/gi, '')
  const safeLinks = noEvents.replace(/<a\s/gi, '<a target="_blank" rel="noopener noreferrer" ')

  return `<!doctype html><html><head><meta charset="utf-8">
<style>
  body { font: 14px/1.6 -apple-system, "Segoe UI", "Inter", sans-serif; color:#191c1e; padding:16px; background:#fff; }
  a { color:#003d9b; }
  img { max-width:100%; height:auto; }
  table { max-width:100%; }
  pre { white-space:pre-wrap; word-break:break-word; }
</style></head><body>${safeLinks}</body></html>`
}

/**
 * 简易检测原文是否疑似 HTML 内容。
 */
export function looksLikeHtml(raw: string): boolean {
  if (!raw) return false
  return /<\/?(html|body|div|p|table|span|a|img|br|h[1-6])\b/i.test(raw)
}
