<template>
  <div class="h-full flex flex-col bg-gray-50" data-testid="home.page">
    <div class="p-6 bg-blue-600 text-white rounded-b-3xl shadow-lg">
      <h1 class="text-2xl font-bold mb-2" data-testid="home.title">前端面试助手</h1>
      <p class="opacity-90 text-sm">梅军军专属版 | 目标：斩获 Offer</p>

      <div class="mt-6 flex justify-center gap-10 text-center">
        <div class="min-w-20">
          <div class="text-2xl font-bold" data-testid="home.totalDone">{{ totalDone }}</div>
          <div class="text-xs opacity-75">已刷题数</div>
        </div>
        <div class="min-w-20">
          <div class="text-2xl font-bold">{{ correctRate }}%</div>
          <div class="text-xs opacity-75">正确率</div>
        </div>
      </div>
    </div>

    <div class="flex-1 p-4 overflow-y-auto space-y-4">
      <button
        v-if="continueTarget"
        @click="continueLearning"
        class="w-full bg-white rounded-xl shadow-sm border border-blue-100 p-4 text-left active:scale-[0.98] transition"
        data-testid="home.continue"
      >
        <div class="text-xs text-blue-600 font-semibold">继续学习</div>
        <div class="mt-1 text-sm text-gray-700">
          {{ continueTarget.module }} · 第 {{ continueTarget.index + 1 }} 题
        </div>
      </button>

      <section>
        <div class="text-sm text-gray-500 mb-2 px-1">高频入口</div>
        <div class="grid grid-cols-2 gap-4">
          <button @click="nav('/modules')" class="bg-white p-4 rounded-xl shadow-sm hover:shadow-md transition active:scale-[0.98] flex flex-col items-center justify-center h-32" data-testid="home.practice">
            <div class="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mb-2 text-xl">
              <i class="fas fa-layer-group"></i>
            </div>
            <span class="font-bold text-gray-800">专项练习</span>
          </button>

          <button @click="startExam" class="bg-white p-4 rounded-xl shadow-sm hover:shadow-md transition active:scale-[0.98] flex flex-col items-center justify-center h-32" data-testid="home.exam">
            <div class="w-12 h-12 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center mb-2 text-xl">
              <i class="fas fa-clock"></i>
            </div>
            <span class="font-bold text-gray-800">模拟考试</span>
          </button>
        </div>
      </section>

      <section>
        <div class="text-sm text-gray-500 mb-2 px-1">复盘与强化</div>
        <div class="grid grid-cols-2 gap-4">
          <button @click="nav('/errors')" class="bg-white p-4 rounded-xl shadow-sm hover:shadow-md transition active:scale-[0.98] flex flex-col items-center justify-center h-32" data-testid="home.errors">
            <div class="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mb-2 text-xl">
              <i class="fas fa-times-circle"></i>
            </div>
            <span class="font-bold text-gray-800">错题本</span>
            <span class="text-xs text-gray-400 mt-1">{{ wrongCount }} 题待复习</span>
          </button>

          <button @click="nav('/favorites')" class="bg-white p-4 rounded-xl shadow-sm hover:shadow-md transition active:scale-[0.98] flex flex-col items-center justify-center h-32" data-testid="home.favorites">
            <div class="w-12 h-12 rounded-full bg-yellow-100 text-yellow-600 flex items-center justify-center mb-2 text-xl">
              <i class="fas fa-star"></i>
            </div>
            <span class="font-bold text-gray-800">收藏夹</span>
          </button>

          <button @click="nav('/cards')" class="bg-white p-4 rounded-xl shadow-sm hover:shadow-md transition active:scale-[0.98] flex flex-col items-center justify-center h-28 col-span-2" data-testid="home.cards">
            <div class="w-10 h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center mb-2 text-lg">
              <i class="fas fa-brain"></i>
            </div>
            <span class="font-bold text-gray-800">记忆卡片模式</span>
            <span class="text-xs text-gray-400 mt-1">手写代码 & 场景题专用</span>
          </button>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useProgressStore } from '../stores/progress.store';
import { MODULES, QUESTION_BANK } from '../data/questionBank';

const router = useRouter();
const store = useProgressStore();

const totalDone = computed(() => store.totalDone);
const correctRate = computed(() => store.correctRate);
const wrongCount = computed(() => store.wrongIds.length);

const practiceModules = computed(() =>
  MODULES.filter((m) => QUESTION_BANK.some((q) => q.module === m && q.type !== 'card'))
);

const continueTarget = computed(() => {
  const entries = Object.entries(store.practiceIndexByModule || {})
    .filter(([module]) => practiceModules.value.includes(module));
  if (!entries.length) return null;

  entries.sort((a, b) => b[1] - a[1]);
  const top = entries[0];
  if (!top) return null;
  const module = top[0];
  const index = top[1];
  return { module, index: Number(index) || 0 };
});

const nav = (path: string) => {
  router.push(path);
};

const startExam = () => {
  router.push({ path: '/quiz', query: { mode: 'exam' } });
};

const continueLearning = () => {
  if (!continueTarget.value) return;
  router.push({ path: '/quiz', query: { module: continueTarget.value.module } });
};
</script>

