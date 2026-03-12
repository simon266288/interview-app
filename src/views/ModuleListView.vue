<template>
  <div class="h-full flex flex-col bg-gray-50" data-testid="modules.page">
    <div class="bg-white p-4 shadow-sm flex items-center">
      <button @click="back" class="w-8 h-8 flex items-center justify-center text-gray-600" data-testid="nav.back">
        <i class="fas fa-arrow-left"></i>
      </button>
      <h2 class="text-lg font-bold ml-2" data-testid="modules.title">{{ props.mode === 'card' ? '选择记忆卡模块' : '选择练习模块' }}</h2>
    </div>
    
    <div class="flex-1 overflow-y-auto p-4 space-y-3">
      <div v-for="mod in modules" :key="mod" @click="selectModule(mod)" 
           class="bg-white p-4 rounded-xl shadow-sm hover:shadow-md transition active:bg-gray-50 cursor-pointer border-l-4 border-blue-500 flex justify-between items-center"
           data-testid="modules.item">
        <div>
          <div class="font-bold text-gray-800">{{ mod }}</div>
          <div class="text-xs text-gray-400 mt-1">共 {{ getCount(mod) }} 题 · 未完成 {{ getUnfinishedCount(mod) }} 题</div>
        </div>
        <div class="flex items-center text-blue-600">
          <span class="text-sm font-medium mr-2">去练习</span>
          <i class="fas fa-chevron-right text-xs"></i>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import { computed } from 'vue';
import { useProgressStore } from '../stores/progress.store';
import { useQuestionBankSettingsStore } from '../stores/questionBankSettings.store';
import { getEffectiveModules, getEffectiveQuestions } from '../services/effectiveQuestionBank';

const props = defineProps<{
  mode?: string
}>();

const router = useRouter();
const progressStore = useProgressStore();
const bankSettings = useQuestionBankSettingsStore();

const effectiveMode = computed(() => (props.mode === 'card' ? 'all' : 'sample'));
const effectiveQuestions = computed(() =>
  getEffectiveQuestions({
    mode: effectiveMode.value,
    seed: bankSettings.seed,
    samplePerModule: bankSettings.samplePerModule,
  })
);

const modules = computed(() => {
  const allModules = getEffectiveModules({
    mode: effectiveMode.value,
    seed: bankSettings.seed,
    samplePerModule: bankSettings.samplePerModule,
  });

  const hiddenPracticeModules = new Set(['手写代码', '场景题 & 项目经验']);
  if (props.mode === 'card') return allModules.filter(m => getCount(m) > 0);
  if (props.mode) return allModules;
  return allModules.filter(m => !hiddenPracticeModules.has(m));
});

const getCount = (mod: string) => {
  if (props.mode === 'card') {
    return effectiveQuestions.value.filter(q => q.module === mod && q.type === 'card').length;
  }
  return effectiveQuestions.value.filter(q => q.module === mod && q.type !== 'card').length;
};

const attemptedIds = computed(() => new Set<number>([...progressStore.completedIds, ...progressStore.wrongIds]));

const getUnfinishedCount = (mod: string) => {
  const total = getCount(mod);
  if (total === 0) return 0;
  const set = attemptedIds.value;
  const done = effectiveQuestions.value.filter(q => {
    if (q.module !== mod) return false;
    if (props.mode === 'card') return q.type === 'card' && set.has(q.id);
    return q.type !== 'card' && set.has(q.id);
  }).length;
  return Math.max(0, total - done);
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
