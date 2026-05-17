<script setup lang="ts">
import { ref } from 'vue'
import { BaseModal, BaseTabs, BaseButton, BaseTextarea, BaseRadioGroup, BaseFileUpload } from '@/components/ui'
import { backupService } from '@/services/backup.service'
import { useToast } from '@/stores/toast.store'

const toast = useToast()
const visible = ref(false)
const tab = ref<'export' | 'import'>('export')
const importText = ref('')
const importMode = ref<'merge' | 'replace'>('merge')

function open(which: 'export' | 'import' = 'export') {
  tab.value = which
  visible.value = true
  if (which === 'export') importText.value = ''
}

defineExpose({ open })

function exportText() {
  return backupService.toJson()
}

async function copyExport() {
  try {
    await navigator.clipboard.writeText(exportText())
    toast.success('已复制到剪贴板')
  } catch {
    toast.error('剪贴板不可用')
  }
}

function download() {
  backupService.download()
  toast.success('已开始下载')
}

function onFileChange(files: FileList | null) {
  const file = files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => {
    importText.value = String(reader.result || '')
  }
  reader.readAsText(file)
}

function performImport() {
  if (!importText.value.trim()) {
    toast.error('请粘贴或上传备份内容')
    return
  }
  try {
    const data = JSON.parse(importText.value)
    const count = backupService.apply(data, importMode.value)
    toast.success(`已恢复 ${count} 个实例`)
    visible.value = false
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : '解析失败'
    toast.error(`导入失败：${msg}`)
  }
}
</script>

<template>
  <BaseModal v-model="visible" title="配置备份" size="lg">
    <BaseTabs
      v-model="tab"
      :tabs="[
        { value: 'export', label: '导出' },
        { value: 'import', label: '导入' },
      ]"
    />

    <section v-if="tab === 'export'" class="flex flex-col gap-4">
      <p class="text-sm text-on-surface-variant/80 leading-relaxed">
        将当前所有 <strong class="text-on-surface">Tool 实例</strong> 与<strong class="text-on-surface">邮件首选项</strong>打包成 JSON。
        可保存到磁盘或粘贴到另一台浏览器。<br>不包含 Access Token；敏感字段请妥善保管。
      </p>
      <BaseTextarea
        :model-value="exportText()"
        :rows="10"
        readonly
        label="备份内容"
        hint="可复制此 JSON 或下载文件"
      />
      <div class="flex flex-wrap gap-3">
        <BaseButton variant="primary" @click="download">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
          </svg>
          下载 .json
        </BaseButton>
        <BaseButton variant="secondary" @click="copyExport">复制到剪贴板</BaseButton>
        <BaseButton variant="ghost" @click="visible = false">关闭</BaseButton>
      </div>
    </section>

    <section v-else class="flex flex-col gap-4">
      <p class="text-sm text-on-surface-variant/80 leading-relaxed">粘贴备份 JSON 或上传文件。</p>
      <BaseTextarea v-model="importText" :rows="10" label="备份内容" placeholder='{"__openmail__": true, ...}' />
      <BaseRadioGroup
        v-model="importMode"
        label="导入方式"
        name="backup-import-mode"
        :options="[
          { label: '合并', description: '保留现有并更新', value: 'merge' },
          { label: '完全替换', description: '使用备份覆盖本地数据', value: 'replace' },
        ]"
      />
      <BaseFileUpload
        label="上传备份文件"
        accept=".json,application/json"
        button-label="选择 JSON 文件"
        hint="文件内容会被读入上方文本框"
        @change="onFileChange"
      />
      <div class="flex flex-wrap gap-3">
        <BaseButton variant="primary" @click="performImport">立即恢复</BaseButton>
        <BaseButton variant="ghost" @click="visible = false">取消</BaseButton>
      </div>
    </section>
  </BaseModal>
</template>
