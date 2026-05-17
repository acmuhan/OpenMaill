<script setup lang="ts">
import MailLogin from '@/components/modules/mail/MailLogin.vue'
import MailList from '@/components/modules/mail/MailList.vue'
import MailDetail from '@/components/modules/mail/MailDetail.vue'
</script>

<template>
  <div class="grid grid-cols-1 xl:grid-cols-12 gap-6">
    <div class="xl:col-span-5 flex flex-col gap-6">
      <MailLogin />
      <MailList />
    </div>
    <div class="xl:col-span-7">
      <MailDetail />
    </div>
  </div>
</template>
