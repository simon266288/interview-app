<template>
  <div class="h-full flex flex-col bg-gray-50" data-testid="result.page">
    <div class="bg-white p-6 shadow-sm flex flex-col items-center">
      <div class="text-xl font-bold mb-4" data-testid="result.title">考试结束</div>
      <div class="w-32 h-32 rounded-full border-8 flex items-center justify-center text-4xl font-bold mb-4"
           :class="score >= 60 ? 'border-green-500 text-green-600' : 'border-red-500 text-red-600'">
        {{ score }}
      </div>
      <div class="text-sm text-gray-500">满分 100 分</div>
    </div>

    <div class="flex-1 overflow-y-auto p-4">
      <h3 class="font-bold text-gray-700 mb-3">答题卡</h3>
      <div class="grid grid-cols-5 gap-3">
        <button v-for="(q, idx) in questions" :key="q.id" 
          class="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm"
          :class="getResultClass(q)"
          @click="viewAnalysis(idx)">
          {{ idx + 1 }}
        </button>
      </div>
    </div>

    <div class="p-4 bg-white border-t">
      <button @click="back" class="w-full py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg hover:bg-blue-700 active:scale-95 transition" data-testid="result.backHome">
        返回首页
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useProgressStore } from '../stores/progress.store';
import type { Question } from '../domain/question.types';

const router = useRouter();
const store = useProgressStore();

const questions = ref<Question[]>([]);
const userAnswers = ref<Record<number, any>>({});

onMounted(() => {
  const data = sessionStorage.getItem('exam_result');
  if (data) {
    const parsed = JSON.parse(data);
    questions.value = parsed.questions;
    userAnswers.value = parsed.userAnswers;
    
    // 计算错题并入库
    questions.value.forEach(q => {
      const userAns = userAnswers.value[q.id];
      if (userAns === undefined) return;
      const correctAns = q.type === 'judge' ? (q.answer ? 0 : 1) : q.answer;
      if (userAns !== correctAns) {
        store.addWrong(q.id);
      } else {
        store.addCompleted(q.id);
      }
    });
  } else {
    router.replace('/');
  }
});

const score = computed(() => {
  if (questions.value.length === 0) return 0;
  let correctCount = 0;
  questions.value.forEach(q => {
    const userAns = userAnswers.value[q.id];
    const correctAns = q.type === 'judge' ? (q.answer ? 0 : 1) : q.answer;
    if (userAns === correctAns) correctCount++;
  });
  return Math.round((correctCount / questions.value.length) * 100);
});

const getResultClass = (q: Question) => {
  const userAns = userAnswers.value[q.id];
  if (userAns === undefined) return 'bg-gray-200 text-gray-500';
  const correctAns = q.type === 'judge' ? (q.answer ? 0 : 1) : q.answer;
  return userAns === correctAns ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600';
};

const viewAnalysis = (_idx: number) => {
  alert('点击题号查看解析功能开发中，请关注后续版本');
};

const back = () => router.push('/');
</script>
