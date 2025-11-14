/**
 * Vue Router configuration
 */

import { createRouter, createWebHistory } from 'vue-router';
import SubmitEvaluation from '../pages/SubmitEvaluation.vue';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/submit',
    },
    {
      path: '/submit',
      name: 'SubmitEvaluation',
      component: SubmitEvaluation,
    },
  ],
});

export default router;
