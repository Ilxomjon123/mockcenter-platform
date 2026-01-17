# B2P Practice Mode - Quick Reference

## 🚀 Quick Start

```bash
# Install dependencies
pnpm install

# Run dev server
pnpm dev

# Build for production
pnpm build
```

## 📍 Key URLs

| Mode | URL | Description |
|------|-----|-------------|
| Exam Login | `/exam/login` | Test credential login |
| Practice Login | `/practice/login` | Email/password login |
| Dashboard | `/practice/dashboard` | User home |
| Speaking | `/practice/speaking` | Speaking module |
| Review | `/practice/review/:id` | Answer review |
| Subscription | `/subscription` | Plans page |

## 🏪 Store Quick Reference

```typescript
// Mode Management
import { useModeStore } from '@/stores/modeStore'
const modeStore = useModeStore()
modeStore.isExamMode        // boolean
modeStore.isPracticeMode    // boolean
modeStore.setPracticeMode()

// User Data
import { useUserStore } from '@/stores/userStore'
const userStore = useUserStore()
userStore.hasFeature('speaking_full')  // boolean
userStore.averageBand                   // number
userStore.subscriptionStatus            // enum

// Speaking Module
import { useSpeakingStore } from '@/stores/speakingStore'
const speakingStore = useSpeakingStore()
speakingStore.startRecording()
speakingStore.saveRecording()

// Answer Review
import { useReviewStore } from '@/stores/reviewStore'
const reviewStore = useReviewStore()
reviewStore.fetchExamReview(examId)
```

## 🎨 Component Quick Import

```typescript
// Dashboard
import BandScoreChart from '@/components/dashboard/BandScoreChart.vue'
import RecentExamsCard from '@/components/dashboard/RecentExamsCard.vue'

// Common
import LockFeature from '@/components/common/LockFeature.vue'

// Exam
import ExamHeader from '@/components/exam/ExamHeader.vue'
```

## 🔐 Feature Access Check

```vue
<template>
  <button @click="doSomething" :disabled="!hasAccess">
    {{ hasAccess ? 'Click me' : 'Locked' }}
  </button>

  <LockFeature v-if="!hasAccess" feature="Feature Name" :plan="requiredPlan" />
</template>

<script setup lang="ts">
import { useUserStore } from '@/stores/userStore'
const userStore = useUserStore()
const hasAccess = computed(() => userStore.hasFeature('feature_name'))
const requiredPlan = 'pro' // 'basic' | 'pro' | 'premium'
</script>
```

## 🎤 Speaking Recording

```typescript
// Start recording
const { success, mediaRecorder } = await speakingStore.startRecording()
if (success) {
  // Store mediaRecorder to stop later
}

// Stop recording
speakingStore.stopRecording(mediaRecorder)

// Review
speakingStore.audioUrl  // blob URL for playback
speakingStore.elapsedSeconds  // recording duration

// Save or delete
speakingStore.saveRecording()   // saves to map
speakingStore.deleteRecording()  // removes from map
```

## 📊 Chart Usage

```vue
<template>
  <BandScoreChart
    :scores="userStore.bandScores"
    :period="chartPeriod"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue'
const chartPeriod = ref<'week' | 'month' | 'all'>('month')
</script>
```

## 🎯 Mode Detection in Components

```vue
<script setup lang="ts">
import { useModeStore } from '@/stores/modeStore'
const modeStore = useModeStore()

if (modeStore.isExamMode) {
  // Exam mode logic (fullscreen, strict timer, etc.)
} else if (modeStore.isPracticeMode) {
  // Practice mode logic (review, dashboard, etc.)
}
</script>
```

## 🔄 Router Navigation

```typescript
// Programmatic navigation
router.push('/practice/dashboard')
router.push({ name: 'practice-review', params: { examId: 123 } })

// With query params
router.push({ path: '/practice/completed', query: { o: '7.5' } })
```

## 🎨 Tailwind-ish Color Palette

```css
/* Exam Mode */
--exam-primary: #dc2626;       /* Red */
--exam-bg: #f9fafb;             /* Light gray */
--exam-warning: #f59e0b;        /* Amber */

/* Practice Mode */
--practice-primary: #059669;    /* Green */
--practice-bg: #f9fafb;
--practice-accent: #3b82f6;     /* Blue (listening) */

/* Subscription */
--plan-free: #6b7280;
--plan-basic: #3b82f6;
--plan-pro: #7c3aed;
--plan-premium: #f59e0b;
```

## 📱 Responsive Breakpoints

```css
/* Mobile */
@media (max-width: 640px) { }

/* Tablet */
@media (min-width: 641px) and (max-width: 1024px) { }

/* Desktop */
@media (min-width: 1025px) { }
```

## 🔧 Common Composables

```typescript
import { useApi } from '@/composables/useApi'
import { useLocalStorage } from '@/composables/useLocalStorage'

// API calls
const { get, post, put, del } = useApi()
const response = await get<{ data: User }>('/api/user/profile')

// Local storage
const user = useLocalStorage<User>('user', null)
user.value = { /* update */ }  // auto-persists
```

## 🧪 Testing Locally

1. **Test Exam Mode**:
   - Go to `/exam/login`
   - Enter dummy credentials
   - Verify fullscreen

2. **Test Practice Mode**:
   - Go to `/practice/login`
   - Try to register/login
   - Access dashboard

3. **Test Speaking**:
   - Navigate to `/practice/speaking`
   - Grant mic permission
   - Record audio

4. **Test Subscription**:
   - Click locked features
   - Check LockFeature tooltips
   - Navigate to plans

## 🐛 Common Issues

**Issue**: Router not working
- **Fix**: Check router meta for `requiresAuth` and `mode`

**Issue**: Store state not persisting
- **Fix**: Ensure using `useLocalStorage` for state that needs persistence

**Issue**: Audio recording not working
- **Fix**: Check HTTPS requirement for getUserMedia (localhost is exempt)

**Issue**: Feature lock not showing
- **Fix**: Verify `userStore.hasFeature()` is returning correct boolean

## 📚 Full Documentation

- **Architecture**: `B2P_PRACTICE_EXTENSION_DOCUMENTATION.md`
- **Implementation**: `IMPLEMENTATION_SUMMARY.md`
- **Main README**: `README.md`

---

*Happy coding! 🎉*
