<template>
  <div class="h-full flex flex-col bg-gray-50" data-testid="modules.page">
    <div class="bg-white p-4 shadow-sm flex items-center">
      <button @click="back" class="w-8 h-8 flex items-center justify-center text-gray-600" data-testid="nav.back">
        <i class="fas fa-arrow-left"></i>
      </button>
      <h2 class="text-lg font-bold ml-2" data-testid="modules.title">
        {{ props.mode === 'card' ? '选择记忆卡模块' : '选择练习模块' }}
      </h2>
    </div>

    <div class="flex-1 overflow-y-auto p-4 space-y-3">
      <div
        v-for="mod in modules"
        :key="mod"
        @click="selectModule(mod)"
        class="bg-white p-4 rounded-xl shadow-sm transition border-l-4 flex justify-between items-center"
        :class="getCardClass(mod)"
        data-testid="modules.item"
      >
        <div>
          <div class="font-bold text-gray-800">{{ mod }}</div>
          <div class="text-xs text-gray-500 mt-1">
            已完成 {{ getDoneCount(mod) }} / {{ getCount(mod) }} · 剩余 {{ getUnfinishedCount(mod) }}
          </div>
          <div class="mt-2">
            <span class="text-[11px] px-2 py-0.5 rounded-full" :class="getStatusClass(mod)">
              {{ getStatusLabel(mod) }}
            </span>
          </div>
        </div>
        <div class="flex items-center" :class="getCtaClass(mod)">
          <span class="text-sm font-medium mr-2">{{ getCtaLabel(mod) }}</span>
          <i class="fas fa-chevron-right text-xs"></i>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import { MODULES, QUESTION_BANK } from '../data/questionBank';
import { computed } from 'vue';
import { useProgressStore } from '../stores/progress.store';

const props = defineProps<{
  mode?: string
}>();

const router = useRouter();
const getCount = (mod: string) => {
  if (props.mode === 'card') {
    return QUESTION_BANK.filter((q) => q.module === mod && q.type === 'card').length;
  }
  return QUESTION_BANK.filter((q) => q.module === mod && q.type !== 'card').length;
};

const hiddenPracticeModules = new Set(['手写代码', '场景题 & 项目经验']);
const modules = computed(() => {
  if (props.mode === 'card') return MODULES.filter((m) => getCount(m) > 0);
  if (props.mode) return MODULES;
  return MODULES.filter((m) => !hiddenPracticeModules.has(m));
});

const store = useProgressStore();
const attemptedIds = computed(() => new Set<number>([...store.completedIds, ...store.wrongIds]));

const getDoneCount = (mod: string) => {
  const set = attemptedIds.value;
  return QUESTION_BANK.filter((q) => {
    if (q.module !== mod) return false;
    if (props.mode === 'card') return q.type === 'card' && set.has(q.id);
    return q.type !== 'card' && set.has(q.id);
  }).length;
};

const getUnfinishedCount = (mod: string) => {
  const total = getCount(mod);
  if (total === 0) return 0;
  const done = getDoneCount(mod);
  return Math.max(0, total - done);
};

const getStatusLabel = (mod: string) => {
  const total = getCount(mod);
  const done = getDoneCount(mod);
  if (total === 0) return '暂无题目';
  if (done === 0) return '未开始';
  if (done >= total) return '已完成';
  return '进行中';
};

const getStatusClass = (mod: string) => {
  const status = getStatusLabel(mod);
  if (status === '已完成') return 'bg-green-100 text-green-700';
  if (status === '进行中') return 'bg-blue-100 text-blue-700';
  if (status === '暂无题目') return 'bg-gray-100 text-gray-500';
  return 'bg-amber-100 text-amber-700';
};

const getCtaLabel = (mod: string) => {
  const total = getCount(mod);
  if (total === 0) return '暂无题目';
  return getDoneCount(mod) > 0 ? '继续练习' : '开始练习';
};

const getCtaClass = (mod: string) => {
  return getCount(mod) === 0 ? 'text-gray-400' : 'text-blue-600';
};

const getCardClass = (mod: string) => {
  if (getCount(mod) === 0) {
    return 'border-gray-300 opacity-60 cursor-not-allowed';
  }
  return 'border-blue-500 hover:shadow-md active:scale-[0.98] active:bg-gray-50 cursor-pointer';
};

const back = () => router.push('/');

const selectModule = (mod: string) => {
  if (getCount(mod) === 0) {
    alert(props.mode === 'card' ? '该模块暂无记忆卡片' : '该模块暂无练习题');
    return;
  }
  router.push({ path: '/quiz', query: { module: mod, mode: props.mode } });
};
</script>
