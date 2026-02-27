<template>
  <div class="h-full flex flex-col bg-gray-50" data-testid="list.page">
    <div class="bg-white p-4 shadow-sm flex items-center">
      <button @click="back" class="w-8 h-8 flex items-center justify-center text-gray-600" data-testid="nav.back">
        <i class="fas fa-arrow-left"></i>
      </button>
      <h2 class="text-lg font-bold ml-2" data-testid="list.title">{{ title }}</h2>
    </div>

    <div v-if="list.length === 0" class="flex-1 flex flex-col items-center justify-center text-gray-400" data-testid="list.empty">
      <i class="fas fa-folder-open text-4xl mb-4"></i>
      <p>暂无相关题目</p>
    </div>

    <div v-else class="flex-1 overflow-y-auto p-4 space-y-3">
      <div v-for="(q, idx) in list" :key="q.id" 
           @click="startPractice(idx)"
           class="bg-white p-4 rounded-xl shadow-sm active:bg-gray-50 cursor-pointer"
           data-testid="list.item">
        <div class="flex justify-between items-start mb-2">
          <span class="px-2 py-0.5 bg-blue-50 text-blue-600 text-xs rounded">{{ q.module }}</span>
          <button @click.stop="removeItem(q.id)" class="text-gray-400 hover:text-red-500 p-1" data-testid="list.remove">
            <i class="fas fa-trash"></i>
          </button>
        </div>
        <div class="font-medium text-gray-800 line-clamp-2">{{ q.question }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useProgressStore } from '../stores/progress.store';
import { QUESTION_BANK } from '../data/questionBank';
import type { Question } from '../domain/question.types';

const route = useRoute();
const router = useRouter();
const store = useProgressStore();

const isErrorView = computed(() => route.path === '/errors');
const title = computed(() => isErrorView.value ? '错题本' : '收藏夹');

const list = computed<Question[]>(() => {
  const ids = isErrorView.value ? store.wrongIds : store.favoriteIds;
  return ids
    .map(id => QUESTION_BANK.find(q => q.id === id))
    .filter((q): q is Question => Boolean(q))
    .reverse();
});

const back = () => router.push('/');

const startPractice = (startIdx: number) => {
  const ids = list.value.map(q => q.id);
  sessionStorage.setItem('quiz_list', JSON.stringify({ ids, startIdx }));
  router.push({ path: '/quiz', query: { mode: 'list' } });
};

const removeItem = (id: number) => {
  if (isErrorView.value) {
    const idx = store.wrongIds.indexOf(id);
    if (idx > -1) store.wrongIds.splice(idx, 1);
  } else {
    store.toggleFavorite(id);
  }
};
</script>
