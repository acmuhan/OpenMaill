<script setup lang="ts">
interface Props {
  modelValue?: string | number
  type?: string
  placeholder?: string
  label?: string
  hint?: string
  error?: string
  required?: boolean
  disabled?: boolean
  readonly?: boolean
  id?: string
  autocomplete?: string
}

withDefaults(defineProps<Props>(), {
  type: 'text',
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
    <div class="relative">
      <input
        :id="id"
        :type="type"
        :value="modelValue"
        :placeholder="placeholder"
        :disabled="disabled"
        :readonly="readonly"
        :autocomplete="autocomplete"
        @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
        :class="[
          'w-full h-12 px-5 rounded-full bg-surface-container-lowest text-on-surface',
          'placeholder:text-on-surface-variant/50 text-sm leading-relaxed',
          'border border-outline-variant/60 transition-all duration-200',
          'focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/15 focus:bg-surface-container-lowest',
          'disabled:opacity-60 disabled:cursor-not-allowed',
          'read-only:bg-surface-container-low/50',
          error ? '!border-error focus:!ring-error/15' : '',
        ]"
      />
    </div>
    <span
      v-if="hint && !error"
      class="text-xs text-on-surface-variant/70 px-3 leading-snug"
    >
      {{ hint }}
    </span>
    <span
      v-if="error"
      role="alert"
      class="text-xs text-error px-3 leading-snug font-medium"
    >
      {{ error }}
    </span>
  </label>
</template>
