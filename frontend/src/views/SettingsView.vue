<script setup lang="ts">
import { ref } from 'vue'
import {
  BaseCard,
  BaseButton,
  BaseSwitch,
  BaseChip,
  BaseRadioGroup,
  BaseFileUpload,
  BaseDivider,
  BaseTextarea,
  BaseInput,
} from '@/components/ui'
import { prefs } from '@/stores/mail.store'
import { backupService } from '@/services/backup.service'
import { useToast } from '@/stores/toast.store'
import { theme, accent } from '@/stores/ui.store'

const toast = useToast()
const importing = ref(false)
const pasteText = ref('')

function download() {
  backupService.download()
  toast.success('已开始下载')
}

async function copyJson() {
  try {
    await navigator.clipboard.writeText(backupService.toJson())
    toast.success('已复制')
  } catch {
    toast.error('剪贴板不可用')
  }
}

function onFileChange(files: FileList | null) {
  const file = files?.[0]
  if (!file) return
  importing.value = true
  const reader = new FileReader()
  reader.onload = () => {
    importing.value = false
    try {
      const data = JSON.parse(String(reader.result || ''))
      const count = backupService.apply(data, 'merge')
      toast.success(`已合并 ${count} 个实例`)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '导入失败'
      toast.error(msg)
    }
  }
  reader.readAsText(file)
}

function applyPasted() {
  if (!pasteText.value.trim()) return toast.error('请粘贴备份 JSON')
  try {
    const data = JSON.parse(pasteText.value)
    const count = backupService.apply(data, 'merge')
    pasteText.value = ''
    toast.success(`已合并 ${count} 个实例`)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : '解析失败'
    toast.error(msg)
  }
}

function clearLocal() {
  if (!confirm('确定清除浏览器中保存的全部 OpenMail 数据？此操作不可撤销。')) return
  for (const key of Object.keys(localStorage)) {
    if (key.startsWith('openmail.')) localStorage.removeItem(key)
  }
  toast.warn('已清除本地数据，请刷新页面重新初始化')
}
</script>

<template>
  <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
    <!-- 邮件首选项 -->
    <BaseCard title="邮件首选项" subtitle="影响邮件正文展示行为" elevation="soft">
      <div class="flex flex-col gap-5">
        <BaseSwitch
          v-model="prefs.renderHtml"
          label="允许渲染 HTML 邮件"
          hint="默认关闭以防止外链追踪；开启后将在 sandbox iframe 中渲染"
        />
        <div class="rounded-md bg-surface-container-low/60 p-4 text-xs text-on-surface-variant/80 leading-relaxed">
          <strong class="text-on-surface">关于安全：</strong>
          即使开启 HTML 渲染，OpenMail 仍会自动 <em>移除 &lt;script&gt;、所有 on* 事件</em>，并把链接强制设为 <code>target="_blank"</code> + <code>rel="noopener noreferrer"</code>。
        </div>
      </div>
    </BaseCard>

    <BaseCard title="外观" subtitle="主题、暗色模式与品牌色" elevation="soft">
      <div class="flex flex-col gap-5">
        <BaseRadioGroup
          v-model="theme"
          label="主题模式"
          name="theme-mode"
          :options="[
            { label: '浅色', value: 'light', description: '固定浅色外观' },
            { label: '深色', value: 'dark', description: '固定深色外观' },
            { label: '跟随系统', value: 'auto', description: '随系统明暗变化' },
          ]"
        />
        <BaseInput
          v-model="accent"
          type="color"
          label="主题色"
          hint="影响按钮、选中态和高亮色"
        />
        <div class="rounded-md bg-surface-container-low/60 p-4 text-xs text-on-surface-variant/80 leading-relaxed">
          颜色、深色和浅色会同步写入本地设置，刷新后保留。
        </div>
      </div>
    </BaseCard>

    <!-- 备份 -->
    <BaseCard title="配置备份" subtitle="导出 / 导入 / 清除本地数据" elevation="soft">
      <div class="flex flex-col gap-5">
        <div class="flex flex-wrap gap-3">
          <BaseButton variant="primary" @click="download">下载备份 JSON</BaseButton>
          <BaseButton variant="secondary" @click="copyJson">复制到剪贴板</BaseButton>
        </div>

        <div class="flex flex-col gap-3 pt-3 border-t border-outline-variant/30">
          <BaseFileUpload
            label="导入备份文件"
            accept=".json,application/json"
            button-label="上传备份文件"
            :disabled="importing"
            hint="选择本地 JSON 备份文件"
            @change="onFileChange"
          />
          <BaseChip variant="info" size="sm">合并模式</BaseChip>
        </div>

        <div class="flex flex-col gap-2">
          <BaseTextarea
            v-model="pasteText"
            :rows="4"
            label="或粘贴 JSON"
            placeholder='{"__openmail__": true, ...}'
            hint="支持直接粘贴完整备份 JSON"
          />
          <BaseButton variant="primary" size="sm" @click="applyPasted">从粘贴恢复</BaseButton>
        </div>

        <BaseDivider />
        <div>
          <BaseButton variant="danger" size="sm" @click="clearLocal">清除本地全部数据</BaseButton>
          <p class="text-xs text-on-surface-variant/70 mt-2">仅清除浏览器中的本地缓存；服务端配置不受影响。</p>
        </div>
      </div>
    </BaseCard>
  </div>
</template>
