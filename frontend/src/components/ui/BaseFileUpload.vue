<script setup lang="ts">
import { ref } from 'vue'
import BaseButton from './BaseButton.vue'

interface Props {
  label?: string
  hint?: string
  accept?: string
  disabled?: boolean
  multiple?: boolean
  buttonLabel?: string
}

withDefaults(defineProps<Props>(), {
  accept: '',
  disabled: false,
  multiple: false,
  buttonLabel: '选择文件',
})

defineEmits<{
  change: [files: FileList | null]
}>()

const inputEl = ref<HTMLInputElement | null>(null)

function openPicker() {
  inputEl.value?.click()
}
</script>

<template>
  <div class="flex flex-col gap-2">
    <span v-if="label" class="text-sm font-medium text-on-surface-variant tracking-wide">
      {{ label }}
    </span>
    <input
      ref="inputEl"
      type="file"
      class="sr-only"
      :accept="accept"
      :multiple="multiple"
      :disabled="disabled"
      @change="$emit('change', ($event.target as HTMLInputElement).files)"
    >
    <BaseButton variant="ghost" :disabled="disabled" fullWidth @click="openPicker">
      {{ buttonLabel }}
    </BaseButton>
    <span v-if="hint" class="text-xs text-on-surface-variant/70 px-1 leading-snug">
      {{ hint }}
    </span>
  </div>
</template>
