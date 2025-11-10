import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'GameSelection',
    component: () => import('../components/GameSelection.vue')
  },
  {
    path: '/memory-questline',
    name: 'MemoryQuestline',
    component: () => import('../components/MemoryQuestline.vue')
  },
  {
    path: '/memory-game',
    name: 'MemoryGame',
    component: () => import('../components/MemoryGame.vue')
  },
  {
    path: '/sound-detective',
    name: 'SoundDetective',
    component: () => import('../components/SoundDetective.vue')
  },
  {
    path: '/symbol-sleuth',
    name: 'SymbolSleuth',
    component: () => import('../components/SymbolSleuth.vue')
  },
  {
    path: '/pronunciation-coach',
    name: 'PronunciationCoach',
    component: () => import('../components/PronunciationCoach.vue')
  },
  {
    path: '/sound-sequence',
    name: 'SoundSequence',
    component: () => import('../components/SoundSequence.vue')
  },
  {
    path: '/minimal-pairs',
    name: 'MinimalPairs',
    component: () => import('../components/MinimalPairs.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router