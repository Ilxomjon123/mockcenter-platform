<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useCscaStore } from '@/stores/cscaStore'
import { useAuthStore } from '@/stores/authStore'
import { CSCA_SUBJECT_LABELS, CSCA_SUBJECT_DURATION_MINUTES } from '@/types/csca'

const router = useRouter()
const cscaStore = useCscaStore()
const authStore = useAuthStore()

onMounted(() => {
  cscaStore.restore()
})

const subjectCards = computed(() =>
  cscaStore.subjects.map((session) => ({
    sessionId: session.session_id,
    key: session.subject,
    label: CSCA_SUBJECT_LABELS[session.subject] || session.subject,
    totalQuestions: session.total_questions,
    submitted: cscaStore.isSubmitted(session.session_id),
    inProgress:
      !!cscaStore.startedAt[session.session_id] &&
      !cscaStore.isSubmitted(session.session_id),
    result: cscaStore.results[session.session_id],
    icon: session.subject === 'math' ? '📐' : session.subject === 'physics' ? '⚛️' : '🧪',
    color: session.subject === 'math' ? 'blue' : session.subject === 'physics' ? 'purple' : 'emerald',
  })),
)

const allDone = computed(() => cscaStore.allCompleted)
const completedCount = computed(() => subjectCards.value.filter(c => c.submitted).length)
const totalScore = computed(() => {
  if (!allDone.value) return 0
  const scores = subjectCards.value.filter(c => c.result).map(c => c.result!.score)
  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
})

// Confirmation modal
const showStartModal = ref(false)
const pendingCard = ref<typeof subjectCards.value[0] | null>(null)

function openStartModal(card: typeof subjectCards.value[0]) {
  pendingCard.value = card
  showStartModal.value = true
}

function closeStartModal() {
  showStartModal.value = false
  pendingCard.value = null
}

function confirmStart() {
  if (!pendingCard.value) return
  cscaStore.startSubject(pendingCard.value.sessionId)
  showStartModal.value = false
  router.push({ name: 'csca-exam' })
}

function handleCardClick(card: typeof subjectCards.value[0]) {
  if (card.submitted) return
  if (card.inProgress) {
    cscaStore.startSubject(card.sessionId)
    router.push({ name: 'csca-exam' })
  } else {
    openStartModal(card)
  }
}

function goToResults() {
  router.push({ name: 'csca-results' })
}

function handleLogout() {
  authStore.logout()
}
</script>

<template>
  <div class="page">
    <!-- Top bar -->
    <nav class="nav">
      <div class="nav__left">
        <div class="nav__logo">
          <span class="nav__logo-icon">🎓</span>
          <span class="nav__logo-text">CSCA</span>
        </div>
      </div>
      <div class="nav__right">
        <div class="nav__user">
          <div class="nav__avatar">{{ (authStore.takerName || 'U')[0] }}</div>
          <div class="nav__user-info">
            <span class="nav__user-name">{{ authStore.takerName || 'Taker' }}</span>
            <span class="nav__user-id">{{ authStore.takerNumber }}</span>
          </div>
        </div>
        <button class="nav__logout" @click="handleLogout">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
        </button>
      </div>
    </nav>

    <!-- Content -->
    <div class="content">
      <!-- Hero -->
      <div class="hero">
        <h1 class="hero__title">Select a Subject</h1>
        <p class="hero__desc">Choose a subject to start your exam. Complete all subjects to see your final results.</p>
        <div class="hero__stats">
          <div class="hero__stat">
            <span class="hero__stat-num">{{ completedCount }}/{{ subjectCards.length }}</span>
            <span class="hero__stat-lbl">Completed</span>
          </div>
          <div class="hero__stat-divider"></div>
          <div class="hero__stat">
            <span class="hero__stat-num">{{ CSCA_SUBJECT_DURATION_MINUTES }}m</span>
            <span class="hero__stat-lbl">Per subject</span>
          </div>
          <div class="hero__stat-divider"></div>
          <div class="hero__stat">
            <span class="hero__stat-num">48</span>
            <span class="hero__stat-lbl">Questions</span>
          </div>
        </div>
      </div>

      <!-- Cards -->
      <div class="cards">
        <button
          v-for="card in subjectCards"
          :key="card.sessionId"
          class="card"
          :class="[
            `card--${card.color}`,
            { 'card--done': card.submitted, 'card--active': card.inProgress },
          ]"
          :disabled="card.submitted"
          @click="handleCardClick(card)"
        >
          <div class="card__glow"></div>
          <div class="card__inner">
            <div class="card__top">
              <span class="card__icon">{{ card.icon }}</span>
              <span
                class="card__badge"
                :class="{
                  'card__badge--done': card.submitted,
                  'card__badge--active': card.inProgress,
                }"
              >
                {{ card.submitted ? '✓ Done' : card.inProgress ? 'In progress' : 'Ready' }}
              </span>
            </div>
            <h3 class="card__name">{{ card.label }}</h3>
            <div class="card__meta">
              <span>{{ card.totalQuestions }} questions</span>
              <span class="card__dot">·</span>
              <span>{{ CSCA_SUBJECT_DURATION_MINUTES }} min</span>
            </div>

            <!-- Result -->
            <div v-if="card.submitted && card.result" class="card__result">
              <div class="card__score-ring">
                <svg viewBox="0 0 36 36" class="card__ring-svg">
                  <path class="card__ring-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  <path class="card__ring-fill" :stroke-dasharray="`${card.result.score}, 100`" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                </svg>
                <span class="card__score-text">{{ Math.round(card.result.score) }}</span>
              </div>
              <span class="card__correct">{{ card.result.correct_count }}/{{ card.result.total_questions }} correct</span>
            </div>

            <!-- Action -->
            <div v-else class="card__cta">
              <span v-if="card.inProgress" class="card__cta-text card__cta-text--resume">Continue →</span>
              <span v-else class="card__cta-text">Start Exam →</span>
            </div>
          </div>
        </button>
      </div>

      <!-- All done banner -->
      <div v-if="allDone" class="done-banner">
        <div class="done-banner__info">
          <span class="done-banner__emoji">🎉</span>
          <div>
            <p class="done-banner__title">All subjects completed!</p>
            <p class="done-banner__sub">Average score: <strong>{{ totalScore }}/100</strong></p>
          </div>
        </div>
        <button class="done-banner__btn" @click="goToResults">View Results →</button>
      </div>

      <!-- Warning -->
      <p class="footnote">
        ⚠️ Once started, the <strong>{{ CSCA_SUBJECT_DURATION_MINUTES }}-minute</strong> timer begins immediately and you <strong>cannot leave</strong> until you submit.
      </p>
    </div>

    <!-- Confirmation Modal -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="showStartModal && pendingCard" class="overlay" @click="closeStartModal">
          <Transition name="pop">
            <div v-if="showStartModal" class="dialog" @click.stop>
              <div class="dialog__icon">{{ pendingCard.icon }}</div>
              <h3 class="dialog__title">{{ pendingCard.label }}</h3>
              <p class="dialog__sub">Are you ready to begin?</p>

              <div class="dialog__chips">
                <div class="dialog__chip">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  {{ CSCA_SUBJECT_DURATION_MINUTES }} minutes
                </div>
                <div class="dialog__chip">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>
                  {{ pendingCard.totalQuestions }} questions
                </div>
              </div>

              <div class="dialog__warn">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                <div>
                  <p>Timer starts <strong>immediately</strong>. You cannot close or navigate away until you submit your answers.</p>
                </div>
              </div>

              <div class="dialog__btns">
                <button class="dialog__btn dialog__btn--ghost" @click="closeStartModal">Cancel</button>
                <button class="dialog__btn dialog__btn--go" @click="confirmStart">
                  Start Exam
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                </button>
              </div>
            </div>
          </Transition>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
/* ========== Base ========== */
.page {
  min-height: 100vh;
  background: #0a0f1a;
  color: #e2e8f0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Inter, sans-serif;
  position: relative;
  overflow: hidden;
}

/* ========== Nav ========== */
.nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1.5rem;
  background: rgba(15, 23, 42, 0.8);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(255,255,255,0.06);
  position: sticky;
  top: 0;
  z-index: 10;
}
.nav__left { display: flex; align-items: center; gap: 0.5rem; }
.nav__logo { display: flex; align-items: center; gap: 0.5rem; }
.nav__logo-icon { font-size: 1.25rem; }
.nav__logo-text { font-weight: 800; font-size: 1rem; background: linear-gradient(135deg, #22c55e, #3b82f6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; letter-spacing: 0.04em; }
.nav__right { display: flex; align-items: center; gap: 0.75rem; }
.nav__user { display: flex; align-items: center; gap: 0.5rem; }
.nav__avatar {
  width: 32px; height: 32px;
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-weight: 700; font-size: 0.8rem; color: white;
}
.nav__user-info { display: flex; flex-direction: column; }
.nav__user-name { font-size: 0.8rem; font-weight: 600; color: #e2e8f0; }
.nav__user-id { font-size: 0.65rem; color: #475569; font-family: monospace; }
.nav__logout {
  width: 32px; height: 32px;
  display: flex; align-items: center; justify-content: center;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 8px;
  color: #64748b;
  cursor: pointer;
  transition: all 0.15s;
}
.nav__logout:hover { background: rgba(255,255,255,0.08); color: #e2e8f0; }

/* ========== Content ========== */
.content {
  max-width: 680px;
  margin: 0 auto;
  padding: 2rem 1.5rem 3rem;
  position: relative;
  z-index: 1;
}

/* ========== Hero ========== */
.hero { text-align: center; margin-bottom: 2rem; }
.hero__title {
  font-size: 1.75rem;
  font-weight: 800;
  margin: 0 0 0.5rem;
  background: linear-gradient(to right, #f1f5f9, #94a3b8);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
.hero__desc { color: #64748b; font-size: 0.85rem; margin: 0 0 1.25rem; line-height: 1.5; }
.hero__stats {
  display: inline-flex;
  align-items: center;
  gap: 1rem;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 12px;
  padding: 0.625rem 1.25rem;
}
.hero__stat { text-align: center; }
.hero__stat-num { display: block; font-size: 1.1rem; font-weight: 800; color: #e2e8f0; }
.hero__stat-lbl { font-size: 0.6rem; color: #475569; text-transform: uppercase; letter-spacing: 0.06em; }
.hero__stat-divider { width: 1px; height: 24px; background: rgba(255,255,255,0.08); }

/* ========== Cards ========== */
.cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.card {
  position: relative;
  background: rgba(30, 41, 59, 0.6);
  border: 1.5px solid rgba(255,255,255,0.08);
  border-radius: 16px;
  padding: 0;
  cursor: pointer;
  color: inherit;
  text-align: left;
  overflow: hidden;
  transition: all 0.2s;
  font-family: inherit;
}
.card:not(:disabled):hover {
  border-color: rgba(255,255,255,0.15);
  transform: translateY(-4px);
  box-shadow: 0 12px 40px rgba(0,0,0,0.3);
}
.card:disabled { cursor: default; }

.card__glow {
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  opacity: 0;
  transition: opacity 0.3s;
  pointer-events: none;
}
.card:not(:disabled):hover .card__glow { opacity: 1; }

.card--blue .card__glow { background: radial-gradient(circle at 50% 50%, rgba(59,130,246,0.08), transparent 70%); }
.card--purple .card__glow { background: radial-gradient(circle at 50% 50%, rgba(139,92,246,0.08), transparent 70%); }
.card--emerald .card__glow { background: radial-gradient(circle at 50% 50%, rgba(16,185,129,0.08), transparent 70%); }

.card--blue:not(:disabled):hover { border-color: rgba(59,130,246,0.4); }
.card--purple:not(:disabled):hover { border-color: rgba(139,92,246,0.4); }
.card--emerald:not(:disabled):hover { border-color: rgba(16,185,129,0.4); }

.card--done { opacity: 0.75; border-color: rgba(34,197,94,0.3); }
.card--active { border-color: rgba(245,158,11,0.4); }

.card__inner {
  position: relative;
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.card__top { display: flex; align-items: center; justify-content: space-between; }
.card__icon { font-size: 1.5rem; }
.card__badge {
  font-size: 0.6rem;
  padding: 0.2rem 0.5rem;
  border-radius: 6px;
  background: rgba(255,255,255,0.06);
  color: #64748b;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.card__badge--done { background: rgba(34,197,94,0.15); color: #4ade80; }
.card__badge--active { background: rgba(245,158,11,0.15); color: #fbbf24; }

.card__name { font-size: 1.05rem; font-weight: 700; margin: 0; color: #f1f5f9; }
.card__meta { font-size: 0.7rem; color: #475569; display: flex; align-items: center; gap: 0.375rem; }
.card__dot { opacity: 0.4; }

/* Score ring */
.card__result {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-top: 0.375rem;
  padding-top: 0.625rem;
  border-top: 1px solid rgba(255,255,255,0.06);
}
.card__score-ring {
  position: relative;
  width: 44px;
  height: 44px;
  flex-shrink: 0;
}
.card__ring-svg { width: 100%; height: 100%; transform: rotate(-90deg); }
.card__ring-bg { fill: none; stroke: rgba(255,255,255,0.06); stroke-width: 3; }
.card__ring-fill { fill: none; stroke: #4ade80; stroke-width: 3; stroke-linecap: round; transition: stroke-dasharray 0.6s ease; }
.card__score-text {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  font-weight: 800;
  color: #4ade80;
}
.card__correct { font-size: 0.7rem; color: #64748b; }

/* CTA */
.card__cta { margin-top: 0.375rem; padding-top: 0.625rem; border-top: 1px solid rgba(255,255,255,0.06); }
.card__cta-text { font-size: 0.8rem; font-weight: 700; color: #3b82f6; }
.card__cta-text--resume { color: #fbbf24; }

/* ========== Done banner ========== */
.done-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  background: linear-gradient(135deg, rgba(34,197,94,0.1), rgba(59,130,246,0.05));
  border: 1px solid rgba(34,197,94,0.2);
  border-radius: 14px;
  padding: 1rem 1.25rem;
  margin-bottom: 1rem;
}
.done-banner__info { display: flex; align-items: center; gap: 0.75rem; }
.done-banner__emoji { font-size: 1.5rem; }
.done-banner__title { margin: 0; font-size: 0.9rem; font-weight: 700; color: #f1f5f9; }
.done-banner__sub { margin: 0.125rem 0 0; font-size: 0.75rem; color: #64748b; }
.done-banner__sub strong { color: #4ade80; }
.done-banner__btn {
  background: #22c55e;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-weight: 700;
  font-size: 0.8rem;
  cursor: pointer;
  white-space: nowrap;
  font-family: inherit;
  transition: background 0.15s;
}
.done-banner__btn:hover { background: #16a34a; }

/* ========== Footnote ========== */
.footnote {
  text-align: center;
  font-size: 0.7rem;
  color: #475569;
  margin: 0;
  line-height: 1.5;
}
.footnote strong { color: #64748b; }

/* ========== Modal ========== */
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.6);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
  padding: 1rem;
}

.dialog {
  background: #1e293b;
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 20px;
  max-width: 380px;
  width: 100%;
  padding: 1.75rem 1.5rem 1.5rem;
  text-align: center;
}
.dialog__icon { font-size: 2.5rem; margin-bottom: 0.5rem; }
.dialog__title { font-size: 1.25rem; font-weight: 800; margin: 0 0 0.25rem; color: #f1f5f9; }
.dialog__sub { font-size: 0.8rem; color: #64748b; margin: 0 0 1.25rem; }

.dialog__chips {
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
}
.dialog__chip {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 8px;
  padding: 0.4rem 0.75rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: #94a3b8;
}

.dialog__warn {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  background: rgba(239,68,68,0.06);
  border: 1px solid rgba(239,68,68,0.15);
  border-radius: 10px;
  padding: 0.75rem;
  margin-bottom: 1.25rem;
  text-align: left;
  color: #f87171;
}
.dialog__warn p { margin: 0; font-size: 0.72rem; line-height: 1.55; }
.dialog__warn strong { color: #fca5a5; }

.dialog__btns { display: flex; gap: 0.5rem; }
.dialog__btn {
  flex: 1;
  padding: 0.65rem;
  border-radius: 10px;
  font-weight: 700;
  font-size: 0.85rem;
  cursor: pointer;
  font-family: inherit;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.375rem;
  transition: all 0.15s;
}
.dialog__btn--ghost {
  background: transparent;
  border: 1px solid rgba(255,255,255,0.1);
  color: #94a3b8;
}
.dialog__btn--ghost:hover { background: rgba(255,255,255,0.05); }
.dialog__btn--go {
  background: linear-gradient(135deg, #22c55e, #16a34a);
  border: none;
  color: white;
  box-shadow: 0 4px 16px rgba(34,197,94,0.25);
}
.dialog__btn--go:hover { box-shadow: 0 6px 20px rgba(34,197,94,0.35); }

/* Transitions */
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

.pop-enter-active { transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1); }
.pop-leave-active { transition: all 0.15s; }
.pop-enter-from { opacity: 0; transform: scale(0.92); }
.pop-leave-to { opacity: 0; transform: scale(0.95); }

/* ========== Responsive ========== */
@media (max-width: 640px) {
  .content { padding: 1.25rem 1rem 2rem; }
  .hero__title { font-size: 1.375rem; }
  .cards { grid-template-columns: 1fr; }
  .done-banner { flex-direction: column; text-align: center; }
  .done-banner__info { flex-direction: column; }
  .done-banner__btn { width: 100%; }
}
</style>
