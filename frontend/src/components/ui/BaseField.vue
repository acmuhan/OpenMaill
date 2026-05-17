<script setup lang="ts">
import { computed } from 'vue'
import type { ToolField } from '@/tools'
import BaseInput from './BaseInput.vue'
import BaseTextarea from './BaseTextarea.vue'
import BaseSelect from './BaseSelect.vue'
import BaseSwitch from './BaseSwitch.vue'

interface Props {
  field: ToolField
  modelValue: unknown
  disabled?: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{ 'update:modelValue': [v: unknown] }>()

function update(v: unknown) {
  emit('update:modelValue', v)
}

const numericValue = computed({
  get: () => String(props.modelValue ?? ''),
  set: (v) => update(v === '' ? undefined : Number(v)),
})
</script>

<template>
  <BaseTextarea
    v-if="field.type === 'textarea'"
    :model-value="(modelValue as string) || ''"
    :label="field.label"
    :placeholder="field.placeholder"
    :hint="field.help"
    :required="field.required"
    :disabled="disabled"
    :rows="field.rows ?? 3"
    @update:model-value="update"
  />

  <BaseSelect
    v-else-if="field.type === 'select'"
    :model-value="(modelValue as string) || ''"
    :label="field.label"
    :placeholder="field.placeholder"
    :options="field.options || []"
    :required="field.required"
    :disabled="disabled"
    :hint="field.help"
    @update:model-value="update"
  />

  <div v-else-if="field.type === 'switch'" class="flex flex-col gap-2">
    <span v-if="field.label" class="text-sm font-medium text-on-surface-variant tracking-wide">{{ field.label }}</span>
    <BaseSwitch
      :model-value="!!modelValue"
      :disabled="disabled"
      :hint="field.help"
      @update:model-value="update"
    >
      {{ modelValue ? '已启用' : '未启用' }}
    </BaseSwitch>
  </div>

  <BaseInput
    v-else
    :model-value="field.type === 'number' ? numericValue : ((modelValue as string) || '')"
    :type="field.type === 'password' ? 'password' : field.type === 'number' ? 'number' : field.type === 'email' ? 'email' : 'text'"
    :label="field.label"
    :placeholder="field.placeholder"
    :hint="field.help"
    :required="field.required"
    :disabled="disabled"
    @update:model-value="field.type === 'number' ? (numericValue = $event as string) : update($event)"
  />
</template>
