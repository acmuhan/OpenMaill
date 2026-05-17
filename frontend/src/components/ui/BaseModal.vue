<script setup lang="ts">
interface Props {
  modelValue: boolean
  title?: string
  subtitle?: string
  size?: 'sm' | 'md' | 'lg' | 'full'
  closable?: boolean
}

withDefaults(defineProps<Props>(), {
  size: 'md',
  closable: true,
})

const emit = defineEmits<{
  'update:modelValue': [v: boolean]
  close: []
}>()

const sizeMap: Record<string, string> = {
  sm: 'max-w-md',
  md: 'max-w-xl',
  lg: 'max-w-3xl',
  full: 'max-w-[min(95vw,1280px)]',
}

function close() {
  emit('update:modelValue', false)
  emit('close')
}
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="modelValue"
        class="fixed inset-0 z-[900] flex items-center justify-center p-4 bg-on-surface/40 backdrop-blur-sm"
        @click.self="closable && close()"
      >
        <div
          :class="[
            'w-full bg-surface-container-lowest rounded-lg shadow-[0_24px_64px_rgba(15,23,42,0.18)] flex flex-col gap-5 p-6 sm:p-8 max-h-[90vh] overflow-y-auto',
            sizeMap[size],
          ]"
        >
          <header v-if="title || $slots.title || closable" class="flex items-start justify-between gap-3">
            <div class="flex flex-col gap-1">
              <slot name="title">
                <h2 class="text-xl font-semibold tracking-tight text-on-surface">{{ title }}</h2>
              </slot>
              <p v-if="subtitle" class="text-sm text-on-surface-variant/80">{{ subtitle }}</p>
            </div>
            <button
              v-if="closable"
              class="w-9 h-9 rounded-full hover:bg-surface-container-low text-on-surface-variant flex items-center justify-center shrink-0"
              @click="close"
              aria-label="关闭"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2.4" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </header>
          <slot />
          <footer v-if="$slots.footer" class="flex items-center justify-end gap-2 pt-2 border-t border-outline-variant/30">
            <slot name="footer" />
          </footer>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 200ms ease;
}
.modal-enter-active > div,
.modal-leave-active > div {
  transition: all 240ms cubic-bezier(0.34, 1.56, 0.64, 1);
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
.modal-enter-from > div,
.modal-leave-to > div {
  opacity: 0;
  transform: translateY(16px) scale(0.96);
}
</style>
