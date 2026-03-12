<template>
  <div id="app-root" class="h-full max-w-md mx-auto bg-white shadow-xl relative overflow-hidden">
    <router-view v-slot="{ Component }">
      <transition name="fade" mode="out-in">
        <component :is="Component" />
      </transition>
    </router-view>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useProgressStore } from './stores/progress.store';

const store = useProgressStore();

onMounted(() => {
  store.init();
});
</script>

<style>
/* 简单的路由过渡 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
