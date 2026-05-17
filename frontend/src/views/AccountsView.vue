<script setup lang="ts">
import AccountFetcher from '@/components/modules/account/AccountFetcher.vue'
import HistoryList from '@/components/modules/account/HistoryList.vue'
</script>

<template>
  <div class="grid grid-cols-1 xl:grid-cols-2 gap-6">
    <AccountFetcher />
    <HistoryList />
  </div>
</template>
