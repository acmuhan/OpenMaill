<script setup lang="ts">
import { useToast } from '@/stores/toast.store'

const { items, remove } = useToast()

const iconPath: Record<string, string> = {
  success: 'M5 13l4 4L19 7',
  error: 'M6 18L18 6M6 6l12 12',
  warning: 'M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.732 0 2.815-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126Z',
  info: 'M11.25 11.25l.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z',
}

const bgClass: Record<string, string> = {
  success: 'bg-secondary-fixed text-on-secondary-fixed',
  error: 'bg-error-container text-on-error-container',
  warning: 'bg-tertiary-fixed text-on-tertiary-fixed',
  info: 'bg-primary text-on-primary',
}
</script>

<template>
  <Teleport to="body">
    <div
      class="fixed top-6 right-6 z-[1000] flex flex-col gap-3 pointer-events-none"
      aria-live="polite"
    >
      <TransitionGroup name="toast">
        <div
          v-for="t in items"
          :key="t.id"
          @click="remove(t.id)"
          :class="[
            'pointer-events-auto cursor-pointer flex items-center gap-3 pl-4 pr-5 py-3 rounded-full',
            'shadow-[0_8px_32px_rgba(15,23,42,0.12)] min-w-[280px] max-w-md',
            bgClass[t.type],
          ]"
        >
          <svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" :d="iconPath[t.type]" />
          </svg>
          <span class="text-sm font-medium tracking-wide">{{ t.message }}</span>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<style scoped>
.toast-enter-active, .toast-leave-active {
  transition: all 280ms cubic-bezier(0.34, 1.56, 0.64, 1);
}
.toast-enter-from, .toast-leave-to {
  opacity: 0;
  transform: translateY(-12px) scale(0.95);
}
</style>
