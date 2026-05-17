<script setup lang="ts">
interface Props {
  modelValue?: string
  placeholder?: string
  label?: string
  hint?: string
  rows?: number
  required?: boolean
  disabled?: boolean
  readonly?: boolean
  id?: string
}

withDefaults(defineProps<Props>(), {
  rows: 4,
  required: false,
  disabled: false,
  readonly: false,
})

defineEmits<{
  'update:modelValue': [value: string]
}>()
</script>

<template>
  <label class="flex flex-col gap-2" :for="id">
    <span
      v-if="label"
      class="text-sm font-medium text-on-surface-variant tracking-wide flex items-center gap-1"
    >
      {{ label }}
      <span v-if="required" class="text-error">*</span>
    </span>
    <textarea
      :id="id"
      :value="modelValue"
      :placeholder="placeholder"
      :disabled="disabled"
      :readonly="readonly"
      :rows="rows"
      @input="$emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
      :class="[
        'w-full px-5 py-3 rounded-md bg-surface-container-lowest text-on-surface',
        'placeholder:text-on-surface-variant/50 text-sm leading-relaxed',
        'border border-outline-variant/60 transition-all duration-200',
        'focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/15 focus:bg-white',
        'disabled:opacity-60 disabled:cursor-not-allowed resize-y font-mono text-xs',
        readonly && 'bg-surface-container-low/50',
      ]"
    />
    <span
      v-if="hint"
      class="text-xs text-on-surface-variant/70 px-3 leading-snug"
    >
      {{ hint }}
    </span>
  </label>
</template>
