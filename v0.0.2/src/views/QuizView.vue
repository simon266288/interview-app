<template>
  <div class="h-full flex flex-col bg-gray-50" data-testid="quiz.page">
    <!-- 顶部导航 -->
    <div class="bg-white p-4 shadow-sm flex items-center justify-between z-10">
      <button @click="back" class="w-8 h-8 flex items-center justify-center text-gray-600" data-testid="nav.back">
        <i class="fas fa-arrow-left"></i>
      </button>
      <h2 class="text-base font-bold truncate mx-2 max-w-[200px]" data-testid="quiz.title">{{ title }}</h2>
      <div class="text-sm font-medium text-blue-600">{{ currentIndex + 1 }}/{{ total }}</div>
    </div>

    <!-- 答题区域 -->
    <div class="flex-1 overflow-y-auto p-4 pb-24">
      <!-- 题目卡片 -->
      <div class="bg-white p-6 rounded-2xl shadow-sm mb-6">
        <div class="flex items-center mb-3">
          <span class="px-2 py-1 bg-blue-100 text-blue-600 text-xs rounded-md font-bold mr-2">
            {{ typeLabel }}
          </span>
          <button @click="toggleFavorite" class="ml-auto text-xl transition active:scale-125" :class="isFavorite(currentQ.id) ? 'text-yellow-400' : 'text-gray-300'" data-testid="quiz.favorite">
            <i class="fas fa-star"></i>
          </button>
        </div>
        <div class="text-lg font-medium leading-relaxed text-gray-800" data-testid="quiz.question">
          {{ currentQ.question }}
        </div>
      </div>

      <!-- 选项列表 (选择题/判断题) -->
      <div v-if="currentQ.type !== 'card'" class="space-y-3">
        <button v-for="(opt, idx) in options" :key="idx"
          @click="selectOption(idx)"
          :disabled="hasAnswered && !isExamMode"
          class="w-full text-left p-4 rounded-xl border-2 transition relative overflow-hidden"
          :class="getOptionClass(idx)"
          data-testid="quiz.option">

          <div class="flex items-start">
            <div class="w-6 h-6 rounded-full border-2 flex items-center justify-center mr-3 flex-shrink-0 mt-0.5"
                 :class="getRadioClass(idx)">
              <span v-if="getOptionIcon(idx)" class="text-xs">
                <i :class="getOptionIcon(idx)"></i>
              </span>
              <span v-else class="text-xs font-bold text-gray-400">{{ getOptionLabel(idx) }}</span>
            </div>
            <span class="text-base">{{ opt }}</span>
          </div>
        </button>
      </div>

      <!-- 记忆卡片 (Card) -->
      <div v-else class="min-h-[16rem] md:min-h-[24rem] h-auto flip-card cursor-pointer" :class="{ 'flipped': cardFlipped }" @click="toggleCardFlip" data-testid="quiz.flipCard">
        <div class="flip-card-inner">
          <div class="flip-card-front">
            <div class="text-gray-400 text-sm mb-4">点击翻转查看答案</div>
            <i class="fas fa-touch-app text-3xl text-blue-200"></i>
          </div>
          <div class="flip-card-back text-left items-start">
            <div ref="cardBackEl" class="w-full card-back-scroll">
              <div class="font-bold text-blue-600 mb-2">参考答案：</div>
              <div class="text-sm leading-relaxed"
                   :class="{
                     'font-mono bg-gray-50 p-2 rounded border border-gray-100 whitespace-pre overflow-x-auto text-xs md:text-sm custom-scrollbar': currentQ.module === '手写代码',
                     'whitespace-pre-wrap': currentQ.module !== '手写代码'
                   }">{{ currentQ.answer }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 解析区域 -->
      <div v-if="(hasAnswered || (currentQ.type === 'card' && cardFlipped)) && !isExamMode && currentQ.module !== '手写代码'"
           class="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-100 animate-fade-in"
           data-testid="quiz.analysis">
        <div class="flex items-center text-blue-800 font-bold mb-2">
          <i class="fas fa-lightbulb mr-2 text-yellow-500"></i>
          答案解析
        </div>
        <div class="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
          {{ currentQ.analysis }}
        </div>
      </div>
    </div>

    <!-- 底部操作栏 -->
    <div class="fixed bottom-0 left-0 right-0 bg-white border-t p-4 flex items-center justify-between max-w-md mx-auto z-20">
      <button @click="prev" :disabled="currentIndex === 0" class="px-4 py-2 text-gray-600 disabled:opacity-30" data-testid="quiz.prev">
        <i class="fas fa-chevron-left mr-1"></i> 上一题
      </button>

      <!-- 模拟考试提交按钮 -->
      <div v-if="isExamMode" class="flex-1 text-center">
           <button @click="submitExam" class="px-6 py-2 bg-blue-600 text-white rounded-full shadow-lg font-bold text-sm active:scale-95 transition" data-testid="quiz.submit">
              交卷
          </button>
      </div>

      <!-- 记忆卡片操作按钮 -->
      <div v-else-if="currentQ.type === 'card'" class="flex space-x-4">
        <button @click="markCard(false)" class="w-12 h-12 rounded-full bg-red-100 text-red-500 flex items-center justify-center text-xl shadow-sm active:scale-90 transition" data-testid="quiz.card.unknown">
          <i class="fas fa-times"></i>
        </button>
        <button @click="markCard(true)" class="w-12 h-12 rounded-full bg-green-100 text-green-500 flex items-center justify-center text-xl shadow-sm active:scale-90 transition" data-testid="quiz.card.known">
          <i class="fas fa-check"></i>
        </button>
      </div>

      <button @click="next" :disabled="currentIndex === total - 1" class="px-4 py-2 text-blue-600 font-bold disabled:opacity-30" data-testid="quiz.next">
        下一题 <i class="fas fa-chevron-right ml-1"></i>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useProgressStore } from '../stores/progress.store';
import { QUESTION_BANK } from '../data/questionBank';
import type { Question } from '../domain/question.types';

const route = useRoute();
const router = useRouter();
const store = useProgressStore();

// 状态管理
const currentQuestions = ref<Question[]>([]);
const currentIndex = ref(0);
const userAnswers = ref<Record<number, any>>({});
const cardFlipped = ref(false);
const cardBackEl = ref<HTMLElement | null>(null);

// 初始化：根据 query 参数加载题目
onMounted(() => {
  const moduleName = route.query.module as string;
  const mode = route.query.mode as string; // 'card', 'exam', 'list'

  if (mode === 'exam') {
    // 这里简化处理：如果是 exam，直接随机 20 题
    const pool = QUESTION_BANK.filter(q => q.type !== 'card');
    const shuffled = [...pool].sort(() => 0.5 - Math.random());
    currentQuestions.value = shuffled.slice(0, 20);
  } else if (mode === 'card') {
    if (moduleName) {
      currentQuestions.value = QUESTION_BANK.filter(q => q.type === 'card' && q.module === moduleName);
    } else {
      currentQuestions.value = QUESTION_BANK.filter(q => q.type === 'card');
    }
  } else if (mode === 'list') {
    const raw = sessionStorage.getItem('quiz_list');
    if (!raw) {
      router.replace('/');
      return;
    }
    const parsed = JSON.parse(raw) as { ids: number[]; startIdx: number };
    const ids = Array.isArray(parsed.ids) ? parsed.ids : [];
    currentQuestions.value = ids.map(id => QUESTION_BANK.find(q => q.id === id)).filter(Boolean) as Question[];
    currentIndex.value = typeof parsed.startIdx === 'number' ? parsed.startIdx : 0;
  } else if (moduleName) {
    currentQuestions.value = QUESTION_BANK.filter(q => q.module === moduleName && q.type !== 'card');
    const resumeIdx = store.getPracticeIndex(moduleName);
    currentIndex.value = Math.max(0, Math.min(resumeIdx, currentQuestions.value.length - 1));
  } else {
    router.replace('/');
  }
});

const currentQ = computed(() => currentQuestions.value[currentIndex.value] || {} as Question);
const total = computed(() => currentQuestions.value.length);
const isExamMode = computed(() => route.query.mode === 'exam');
const isPracticeMode = computed(() => Boolean(route.query.module) && !route.query.mode);
const title = computed(() => {
  if (isExamMode.value) return '模拟考试中...';
  if (route.query.mode === 'card') return route.query.module ? `${String(route.query.module)} · 记忆卡片` : '记忆卡片';
  if (route.query.mode === 'list') return '错题/收藏练习';
  return (route.query.module || '练习模式') as string;
});

const options = computed(() => {
  if (currentQ.value.type === 'judge') return ['正确', '错误'];
  return currentQ.value.options || [];
});

const typeLabel = computed(() => {
  const map: Record<string, string> = { choice: '选择题', judge: '判断题', card: '记忆卡' };
  return map[currentQ.value.type] || '题目';
});

const hasAnswered = computed(() => userAnswers.value[currentQ.value.id] !== undefined);

const getOptionLabel = (idx: number) => String.fromCharCode(65 + idx);

const getOptionClass = (idx: number) => {
  if (!hasAnswered.value || isExamMode.value) {
    if (userAnswers.value[currentQ.value.id] === idx) return 'border-blue-500 bg-blue-50 text-blue-700';
    return 'border-gray-200 text-gray-700 hover:bg-gray-50';
  }

  const correctAns = currentQ.value.type === 'judge' ? (currentQ.value.answer ? 0 : 1) : currentQ.value.answer;
  if (idx === correctAns) return 'border-green-500 bg-green-50 text-green-700';
  if (userAnswers.value[currentQ.value.id] === idx) return 'border-red-500 bg-red-50 text-red-700 shake-animation';
  return 'border-gray-100 text-gray-400 opacity-60';
};

const getRadioClass = (idx: number) => {
  if (!hasAnswered.value || isExamMode.value) {
    if (userAnswers.value[currentQ.value.id] === idx) return 'border-blue-500 bg-blue-500 text-white';
    return 'border-gray-300';
  }
  const correctAns = currentQ.value.type === 'judge' ? (currentQ.value.answer ? 0 : 1) : currentQ.value.answer;
  if (idx === correctAns) return 'border-green-500 bg-green-500 text-white border-transparent';
  if (userAnswers.value[currentQ.value.id] === idx) return 'border-red-500 bg-red-500 text-white border-transparent';
  return 'border-gray-200';
};

const getOptionIcon = (idx: number) => {
  if (!hasAnswered.value || isExamMode.value) return null;
  const correctAns = currentQ.value.type === 'judge' ? (currentQ.value.answer ? 0 : 1) : currentQ.value.answer;
  if (idx === correctAns) return 'fas fa-check';
  if (userAnswers.value[currentQ.value.id] === idx) return 'fas fa-times';
  return null;
};

const selectOption = (idx: number) => {
  if (hasAnswered.value && !isExamMode.value) return;
  userAnswers.value[currentQ.value.id] = idx;

  if (!isExamMode.value) {
    const isRight = (currentQ.value.type === 'judge' ? (currentQ.value.answer ? 0 : 1) : currentQ.value.answer) === idx;
    if (isRight) store.addCompleted(currentQ.value.id);
    else store.addWrong(currentQ.value.id);
  }
};


const resetCardScroll = () => {
  if (cardBackEl.value) cardBackEl.value.scrollTop = 0;
};

const toggleCardFlip = () => {
  cardFlipped.value = !cardFlipped.value;
  if (cardFlipped.value) nextTick(resetCardScroll);
};
const markCard = (known: boolean) => {
  if (known) store.addCompleted(currentQ.value.id);
  else store.addWrong(currentQ.value.id);
  setTimeout(() => { if (currentIndex.value < total.value - 1) next(); }, 300);
};

const toggleFavorite = () => store.toggleFavorite(currentQ.value.id);
const isFavorite = (id: number) => store.isFavorite(id);

const next = () => { if (currentIndex.value < total.value - 1) currentIndex.value++; };
const prev = () => { if (currentIndex.value > 0) currentIndex.value--; };

const back = () => {
  router.back();
};

const submitExam = () => {
  const resultData = {
    questions: currentQuestions.value,
    userAnswers: userAnswers.value
  };
  sessionStorage.setItem('exam_result', JSON.stringify(resultData));
  router.replace('/result');
};

watch(currentIndex, () => { cardFlipped.value = false; resetCardScroll(); });

watch(
  [currentIndex, total],
  () => {
    if (!isPracticeMode.value) return;
    const moduleName = String(route.query.module || '');
    if (!moduleName) return;
    if (total.value <= 0) return;
    const idx = Math.max(0, Math.min(currentIndex.value, total.value - 1));
    store.setPracticeIndex(moduleName, idx);
  },
  { immediate: true }
);
</script>

<style>
.flip-card {
  perspective: 1000px;
}
.flip-card-inner {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: inherit;
  text-align: center;
  transition: transform 0.6s;
  transform-style: preserve-3d;
}
.flip-card.flipped .flip-card-inner {
  transform: rotateY(180deg);
}
.flip-card-front,
.flip-card-back {
  position: absolute;
  inset: 0;
  -webkit-backface-visibility: hidden;
  backface-visibility: hidden;
  border-radius: 1rem;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background-color: white;
  padding: 1.5rem;
  border: 1px solid #e5e7eb;
}
.flip-card-front {
  z-index: 2;
}
.flip-card.flipped .flip-card-front {
  pointer-events: none;
  visibility: hidden;
}
.flip-card-back {
  z-index: 3;
  transform: rotateY(180deg);
  overflow: hidden;
  justify-content: flex-start;
  align-items: flex-start;
}
.card-back-scroll {
  height: 100%;
  overflow-y: auto;
  padding-right: 0.25rem;
  -webkit-overflow-scrolling: touch;
}

.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #d1d5db;
  border-radius: 4px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #9ca3af;
}
</style>




