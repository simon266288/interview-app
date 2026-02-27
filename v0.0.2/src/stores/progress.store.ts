import { defineStore } from 'pinia';
import { ref, computed, watch } from 'vue';
import { storageService } from '../services/storage';
import type { ProgressState } from '../services/storage';

export const useProgressStore = defineStore('progress', () => {
  // State
  const completedIds = ref<number[]>([]);
  const wrongIds = ref<number[]>([]);
  const favoriteIds = ref<number[]>([]);
  const moduleStats = ref<Record<string, number>>({});
  const examHistory = ref<any[]>([]);
  const practiceIndexByModule = ref<Record<string, number>>({});
  
  // 初始化加载
  const init = () => {
    const data = storageService.load();
    if (data.completedIds) completedIds.value = data.completedIds;
    if (data.wrongIds) wrongIds.value = data.wrongIds;
    if (data.favoriteIds) favoriteIds.value = data.favoriteIds;
    if (data.moduleStats) moduleStats.value = data.moduleStats;
    if (data.examHistory) examHistory.value = data.examHistory;
    if (data.practiceIndexByModule) practiceIndexByModule.value = data.practiceIndexByModule;
  };

  // 自动保存
  watch(
    [completedIds, wrongIds, favoriteIds, moduleStats, examHistory, practiceIndexByModule],
    () => {
      storageService.save({
        completedIds: completedIds.value,
        wrongIds: wrongIds.value,
        favoriteIds: favoriteIds.value,
        moduleStats: moduleStats.value,
        examHistory: examHistory.value,
        practiceIndexByModule: practiceIndexByModule.value,
        schemaVersion: 1
      } as ProgressState);
    },
    { deep: true }
  );

  // Actions
  const toggleFavorite = (id: number) => {
    const idx = favoriteIds.value.indexOf(id);
    if (idx > -1) {
      favoriteIds.value.splice(idx, 1);
    } else {
      favoriteIds.value.push(id);
    }
  };

  const addWrong = (id: number) => {
    if (!wrongIds.value.includes(id)) {
      wrongIds.value.push(id);
    }
    // 同时也可能需要从 completed 移除？视业务逻辑定
  };

  const addCompleted = (id: number) => {
    if (!completedIds.value.includes(id)) {
      completedIds.value.push(id);
    }
    // 如果答对了，从错题本移除？
    const wIdx = wrongIds.value.indexOf(id);
    if (wIdx > -1) wrongIds.value.splice(wIdx, 1);
  };

  // Getters
  const totalDone = computed(() => completedIds.value.length + wrongIds.value.length);
  const correctRate = computed(() => {
    if (totalDone.value === 0) return 0;
    return Math.round((completedIds.value.length / totalDone.value) * 100);
  });
  const isFavorite = (id: number) => favoriteIds.value.includes(id);
  const getPracticeIndex = (moduleName: string) => practiceIndexByModule.value[moduleName] ?? 0;
  const setPracticeIndex = (moduleName: string, idx: number) => {
    practiceIndexByModule.value[moduleName] = Math.max(0, idx);
  };

  return {
    init,
    completedIds,
    wrongIds,
    favoriteIds,
    moduleStats,
    examHistory,
    practiceIndexByModule,
    totalDone,
    correctRate,
    toggleFavorite,
    addWrong,
    addCompleted,
    isFavorite,
    getPracticeIndex,
    setPracticeIndex
  };
});
