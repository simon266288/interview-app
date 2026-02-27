import { createRouter, createWebHashHistory } from 'vue-router';
import HomeView from '../views/HomeView.vue';
import ModuleListView from '../views/ModuleListView.vue';
import QuizView from '../views/QuizView.vue';
import ExamResultView from '../views/ExamResultView.vue';
import QuestionListView from '../views/QuestionListView.vue';

const routes = [
  { path: '/', component: HomeView },
  { path: '/modules', component: ModuleListView },
  { path: '/quiz', component: QuizView },
  { path: '/result', component: ExamResultView },
  { path: '/errors', component: QuestionListView },
  { path: '/favorites', component: QuestionListView },
  { path: '/cards', component: ModuleListView, props: { mode: 'card' } }, // 传递 mode 参数给 ModuleListView
  { path: '/exam', redirect: { path: '/quiz', query: { mode: 'exam' } } }
];

export const router = createRouter({
  history: createWebHashHistory(),
  routes
});
