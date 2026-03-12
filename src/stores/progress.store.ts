import { defineStore } from 'pinia';
import { ref, computed, watch } from 'vue';
import { storageService } from '../services/storage';
import type { ProgressState } from '../services/storage';
import type { Question } from '../domain/question.types';
import { getAllQuestions } from '../services/effectiveQuestionBank';

type QuestionSnapshot = Pick<Question, 'id' | 'type' | 'module' | 'question' | 'options' | 'answer' | 'analysis'>;

function toSnapshot(q: Question): QuestionSnapshot {
  return {
    id: q.id,
    type: q.type,
    module: q.module,
    question: q.question,
    options: q.options,
    answer: q.answer,
    analysis: q.analysis,
  };
}

function findQuestionById(id: number): Question | undefined {
  return getAllQuestions().find(q => q.id === id);
}

export const useProgressStore = defineStore('progress', () => {
  // State
  const completedIds = ref<number[]>([]);
  const wrongIds = ref<number[]>([]);
  const favoriteIds = ref<number[]>([]);
  const wrongItemsById = ref<Record<number, QuestionSnapshot>>({});
  const favoriteItemsById = ref<Record<number, QuestionSnapshot>>({});
  const moduleStats = ref<Record<string, number>>({});
  const examHistory = ref<any[]>([]);
  const practiceIndexByModule = ref<Record<string, number>>({});

  const ensureWrongSnapshot = (id: number, q?: Question) => {
    if (wrongItemsById.value[id]) return;
    const found = q ?? findQuestionById(id);
    if (!found) return;
    wrongItemsById.value[id] = toSnapshot(found);
  };

  const ensureFavoriteSnapshot = (id: number, q?: Question) => {
    if (favoriteItemsById.value[id]) return;
    const found = q ?? findQuestionById(id);
    if (!found) return;
    favoriteItemsById.value[id] = toSnapshot(found);
  };

  // 初始化加载 + 迁移（schemaVersion 1 -> 2）
  const init = () => {
    const data = storageService.load();

    if (data.completedIds) completedIds.value = data.completedIds;
    if (data.wrongIds) wrongIds.value = data.wrongIds;
    if (data.favoriteIds) favoriteIds.value = data.favoriteIds;
    if (data.moduleStats) moduleStats.value = data.moduleStats;
    if (data.examHistory) examHistory.value = data.examHistory;
    if (data.practiceIndexByModule) practiceIndexByModule.value = data.practiceIndexByModule;

    if (data.wrongItemsById) wrongItemsById.value = data.wrongItemsById as Record<number, QuestionSnapshot>;
    if (data.favoriteItemsById) favoriteItemsById.value = data.favoriteItemsById as Record<number, QuestionSnapshot>;

    const schemaVersion = typeof data.schemaVersion === 'number' ? data.schemaVersion : 1;

    // Only need to backfill snapshots. User chose: missing items should not be shown.
    if (schemaVersion < 2) {
      for (const id of wrongIds.value) ensureWrongSnapshot(id);
      for (const id of favoriteIds.value) ensureFavoriteSnapshot(id);

      storageService.save({
        completedIds: completedIds.value,
        wrongIds: wrongIds.value,
        favoriteIds: favoriteIds.value,
        wrongItemsById: wrongItemsById.value,
        favoriteItemsById: favoriteItemsById.value,
        moduleStats: moduleStats.value,
        examHistory: examHistory.value,
        practiceIndexByModule: practiceIndexByModule.value,
        schemaVersion: 2,
      } as ProgressState);
    }
  };

  // 自动保存
  watch(
    [completedIds, wrongIds, favoriteIds, wrongItemsById, favoriteItemsById, moduleStats, examHistory, practiceIndexByModule],
    () => {
      storageService.save({
        completedIds: completedIds.value,
        wrongIds: wrongIds.value,
        favoriteIds: favoriteIds.value,
        wrongItemsById: wrongItemsById.value,
        favoriteItemsById: favoriteItemsById.value,
        moduleStats: moduleStats.value,
        examHistory: examHistory.value,
        practiceIndexByModule: practiceIndexByModule.value,
        schemaVersion: 2,
      } as ProgressState);
    },
    { deep: true, flush: 'sync' }
  );

  // Actions
  const toggleFavorite = (arg: number | Question) => {
    const id = typeof arg === 'number' ? arg : arg.id;
    const snapshotQ = typeof arg === 'number' ? undefined : arg;

    const idx = favoriteIds.value.indexOf(id);
    if (idx > -1) {
      favoriteIds.value.splice(idx, 1);
      delete favoriteItemsById.value[id];
    } else {
      favoriteIds.value.push(id);
      ensureFavoriteSnapshot(id, snapshotQ);
    }
  };

  const addWrong = (arg: number | Question) => {
    const id = typeof arg === 'number' ? arg : arg.id;
    const snapshotQ = typeof arg === 'number' ? undefined : arg;

    if (!wrongIds.value.includes(id)) {
      wrongIds.value.push(id);
    }
    ensureWrongSnapshot(id, snapshotQ);
  };

  const removeWrong = (id: number) => {
    const idx = wrongIds.value.indexOf(id);
    if (idx > -1) wrongIds.value.splice(idx, 1);
    delete wrongItemsById.value[id];
  };

  const addCompleted = (arg: number | Question) => {
    const id = typeof arg === 'number' ? arg : arg.id;

    if (!completedIds.value.includes(id)) {
      completedIds.value.push(id);
    }
    // 如果答对了，从错题本移除
    removeWrong(id);
  };

  // Getters
  const totalDone = computed(() => completedIds.value.length + wrongIds.value.length);
  const correctRate = computed(() => {
    if (totalDone.value === 0) return 0;
    return Math.round((completedIds.value.length / totalDone.value) * 100);
  });
  const isFavorite = (id: number) => favoriteIds.value.includes(id);

  const wrongList = computed<QuestionSnapshot[]>(() =>
    wrongIds.value.map(id => wrongItemsById.value[id]).filter((q): q is QuestionSnapshot => Boolean(q)).slice().reverse()
  );

  const favoriteList = computed<QuestionSnapshot[]>(() =>
    favoriteIds.value.map(id => favoriteItemsById.value[id]).filter((q): q is QuestionSnapshot => Boolean(q)).slice().reverse()
  );

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

    wrongList,
    favoriteList,

    toggleFavorite,
    addWrong,
    removeWrong,
    addCompleted,

    isFavorite,
    getPracticeIndex,
    setPracticeIndex,
  };
});
