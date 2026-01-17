# IELTS B2P Practice Mode Extension - Architecture Documentation

## Overview

This document outlines the extension of the IELTS mock exam platform to support long-term users (B2P), practice mode, subscriptions, and analytics. The implementation follows Vue 3 + Composition API best practices with Pinia for state management.

---

## 📁 Folder Structure

```
src/
├── components/
│   ├── common/
│   │   └── LockFeature.vue          # Feature lock overlay for premium content
│   ├── dashboard/
│   │   └── BandScoreChart.vue      # Canvas-based band score history chart
│   ├── exam/
│   │   ├── ExamHeader.vue          # Header with timer & navigation (updated)
│   │   ├── ExamFooter.vue          # Existing footer
│   │   └── ResizableDivider.vue    # Existing divider
│   ├── listening/                  # Existing listening components
│   ├── reading/                    # Existing reading components
│   └── writing/                    # Existing writing components
├── composables/
│   ├── useApi.ts                   # API abstraction layer
│   ├── useLocalStorage.ts          # Local storage persistence
│   ├── useAudioCache.ts            # Audio caching (IndexedDB)
│   ├── useListeningAudio.ts        # Audio playback logic
│   ├── useQuestionProcessor.ts     # Question processing utilities
│   ├── useReadingQuestionProcessor.ts
│   ├── useGlobalReadingDragDrop.ts
│   ├── useResizable.ts
│   └── useSpeakingAudio.ts         # Speaking audio recording (NEW)
├── router/
│   └── index.ts                    # Routes with mode separation (UPDATED)
├── stores/
│   ├── authStore.ts                # Authentication & exam submission (UPDATED)
│   ├── modeStore.ts                # Exam vs Practice mode state (NEW)
│   ├── userStore.ts                # User profile, subscription, analytics (NEW)
│   ├── speakingStore.ts            # Speaking module state (NEW)
│   ├── reviewStore.ts              # Answer review state (NEW)
│   ├── listeningStore.ts           # Existing
│   ├── readingStore.ts             # Existing
│   └── writingStore.ts             # Existing
├── types/
│   ├── user.ts                     # User, subscription, band score types (NEW)
│   ├── speaking.ts                 # Speaking module types (NEW)
│   ├── test.ts                     # Existing test types (UPDATED)
│   ├── listening.ts                # Existing
│   ├── reading.ts                  # Existing
│   └── writing.ts                  # Existing
└── views/
    ├── Auth/
    │   ├── ExamLoginView.vue       # Exam mode login (NEW)
    │   └── PracticeLoginView.vue   # Practice mode login (NEW)
    ├── practice/
    │   ├── DashboardView.vue       # Main user dashboard (NEW)
    │   ├── ReviewView.vue          # Answer review interface (NEW)
    │   └── PracticeCompletedView.vue # Practice completion page (NEW)
    ├── SpeakingExamView.vue        # Speaking module (NEW)
    ├── SubscriptionView.vue        # Subscription landing (NEW)
    ├── SubscriptionPlansView.vue   # Pricing page (NEW)
    ├── ListeningExamView.vue       # Existing
    ├── ReadingExamView.vue         # Existing
    ├── WritingExamView.vue         # Existing
    └── CompletedView.vue           # Existing (exam mode)
```

---

## 🏗️ Component Breakdown

### Authentication Components

#### `ExamLoginView.vue`
- **Purpose**: Entry point for exam mode
- **Features**:
  - Mode selector (Exam vs Practice)
  - Test code/credential input
  - Fullscreen enforcement notification
  - Strict timer warning
- **State**: Uses `authStore` + `modeStore`

#### `PracticeLoginView.vue`
- **Purpose**: Entry point for practice mode
- **Features**:
  - Email/password authentication
  - Persistent login
  - Sign-up CTA
  - Practice features highlight
- **State**: Uses `authStore` + `modeStore` + `userStore`

### Dashboard Components

#### `DashboardView.vue`
- **Purpose**: Main user hub for practice mode
- **Features**:
  - User profile display with avatar
  - Subscription status badge
  - Band score history chart
  - Section-wise progress (Listening/Reading/Writing/Speaking)
  - Recent exam history
  - Quick action buttons
  - Weekly challenge banner
  - Subscription upgrade CTA
- **Sub-components**: `BandScoreChart`, `LockFeature`

#### `BandScoreChart.vue`
- **Purpose**: Visualize band score progress over time
- **Technology**: Canvas 2D API
- **Features**:
  - Time-based filtering (week/month/all)
  - Gradient fill under line
  - Responsive design
  - Empty state handling
- **Props**: `scores: BandScore[]`, `period: 'week' | 'month' | 'all'`

### Review Components

#### `ReviewView.vue`
- **Purpose**: Detailed exam answer review
- **Features**:
  - Section filter tabs (All/Listening/Reading/Writing/Speaking)
  - Stats overview with band scores
  - Question-by-question review
  - Correct/incorrect answer comparison
  - Keyword highlighting
  - Explanation blocks
  - Writing AI feedback display
  - Band breakdown (Task Response/Coherence/Lexical/Grammar)
  - Correction suggestions
- **State**: Uses `reviewStore`

### Speaking Module

#### `SpeakingExamView.vue`
- **Purpose**: Browser-based speaking exam
- **Features**:
  - Part 1/2/3 navigation
  - Audio recording (MediaRecorder API)
  - Preparation timer (Part 2: 1 min)
  - Recording timer (auto-stop at limit)
  - Audio playback & review
  - Recording save/delete
  - Question-by-question flow
  - Submission with upload
- **State**: Uses `speakingStore`
- **Audio**: Web Audio API + MediaRecorder

### Subscription Components

#### `SubscriptionView.vue`
- **Purpose**: Subscription landing page
- **Features**:
  - Free vs Premium comparison
  - Feature highlights
  - CTA to plans or sign-up

#### `SubscriptionPlansView.vue`
- **Purpose**: Detailed pricing page
- **Features**:
  - Plan comparison (Free/Basic/Pro/Premium)
  - Feature checklist
  - Popular badge
  - FAQ section
  - Responsive grid layout

### Common Components

#### `LockFeature.vue`
- **Purpose**: Overlay for locked premium features
- **Features**:
  - Tooltip on hover
  - Plan requirement message
  - Upgrade CTA link
  - Reusable across components
- **Props**: `feature: string`, `plan?: 'basic' | 'pro' | 'premium'`

#### `ExamHeader.vue` (Updated)
- **Purpose**: Global header for exam/practice views
- **Features**:
  - Mode badge (Exam/Practice)
  - Timer display
  - Navigation menu (practice mode only)
  - Dropdown with Dashboard/History/Logout
  - Auto-submit on timeout

---

## 🗄️ State Management Structure

### `modeStore.ts`
**Purpose**: Track current application mode (Exam vs Practice)

```typescript
{
  currentMode: 'exam' | 'practice'
  isExamMode: boolean
  isPracticeMode: boolean
  actions: {
    setExamMode()
    setPracticeMode()
    setMode(mode)
    clearMode()
  }
}
```

**Usage**: Persists in localStorage, used by router guards

---

### `userStore.ts`
**Purpose**: User profile, subscription, analytics data

```typescript
{
  // State
  user: User | null
  bandScores: BandScore[]
  examHistory: ExamHistory[]
  dashboardStats: DashboardStats | null

  // Computed
  isAuthenticated: boolean
  subscriptionStatus: SubscriptionStatus
  subscriptionPlan: SubscriptionPlan
  isSubscribed: boolean
  hasFeature(feature: string): boolean
  averageBand: number
  bestBand: number

  // Actions
  fetchProfile()
  fetchDashboardStats()
  fetchBandScores()
  fetchExamHistory()
  updateProfile(data)
  clearUser()
}
```

**Feature Access Matrix**:
| Feature | Free | Basic | Pro | Premium |
|---------|-------|-------|-----|----------|
| practice_mode | ✅ | ✅ | ✅ | ✅ |
| basic_analytics | ✅ | ✅ | ✅ | ✅ |
| answer_review | ❌ | ✅ | ✅ | ✅ |
| speaking_part1 | ❌ | ✅ | ✅ | ✅ |
| speaking_part2 | ❌ | ❌ | ✅ | ✅ |
| ai_feedback | ❌ | ❌ | ✅ | ✅ |
| speaking_full | ❌ | ❌ | ❌ | ✅ |
| examiner_review | ❌ | ❌ | ❌ | ✅ |
| certificate | ❌ | ❌ | ✅ | ✅ |

---

### `speakingStore.ts`
**Purpose**: Speaking exam state management

```typescript
{
  // State
  questions: SpeakingQuestion[]
  currentPart: SpeakingPart
  currentQuestionIndex: number
  recordings: Map<number, string>  // questionId -> audioUrl
  feedback: Map<number, SpeakingFeedback>
  recordingState: RecordingState
  isRecording: boolean
  elapsedSeconds: number
  preparationElapsedSeconds: number
  audioBlob: Blob | null
  audioUrl: string | null

  // Computed
  currentQuestion
  partQuestions
  totalQuestions
  currentQuestionNumber
  isPartCompleted
  isExamCompleted
  hasRecording
  currentFeedback

  // Actions
  setTest(testData)
  setPart(part)
  nextQuestion()
  previousQuestion()
  startRecording()
  stopRecording(mediaRecorder)
  saveRecording()
  deleteRecording()
  startPreparationTimer()
  stopPreparationTimer()
  resetRecordingState()
  uploadRecording(questionId)
  uploadAllRecordings()
  setFeedback(questionId, feedback)
  clearSpeaking()
}
```

---

### `reviewStore.ts`
**Purpose**: Exam answer review state

```typescript
{
  // State
  currentReview: ExamReview | null
  selectedSection: 'all' | 'listening' | 'reading' | 'writing' | 'speaking'

  // Computed
  allReviews: AnswerReview[]
  writingReviews: WritingReview[]
  correctCount: number
  incorrectCount: number
  correctPercentage: number
  sectionStats: {
    listening: { correct, total, band }
    reading: { correct, total, band }
    writing: { band }
    speaking: { band }
  }

  // Actions
  fetchExamReview(examId)
  setSelectedSection(section)
  clearReview()
}
```

---

### `authStore.ts` (Updated)
**Key Changes**:
- Added `isFullscreenEnforced` flag
- Modified `login()` to handle both modes
- Modified `logout()` to handle auto-logout in exam mode
- Added speaking data fetching in `fetchTestData()`

**Exam Mode Flow**:
1. Login → Fetch test data → Enforce fullscreen → Redirect to exam
2. Submit → Auto logout (clear all data)

**Practice Mode Flow**:
1. Login → Fetch user profile → Redirect to dashboard
2. Submit → Redirect to practice completed (no logout)

---

## 🛣️ Routing Structure

### Route Prefixes

**Exam Mode** (`/exam/*`):
- `/exam/login` - Exam mode login
- `/exam/listening` - Listening exam
- `/exam/reading` - Reading exam
- `/exam/writing` - Writing exam
- `/exam/completed` - Exam completion

**Practice Mode** (`/practice/*`):
- `/practice/login` - Practice mode login
- `/practice/dashboard` - User dashboard
- `/practice/listening` - Listening practice
- `/practice/reading` - Reading practice
- `/practice/writing` - Writing practice
- `/practice/speaking` - Speaking practice
- `/practice/review/:examId` - Answer review
- `/practice/completed` - Practice completion

**Subscription**:
- `/subscription` - Landing page
- `/subscription/plans` - Pricing page

**Legacy Routes** (redirected to exam routes):
- `/login` → `/exam/login`
- `/listening` → `/exam/listening`
- `/reading` → `/exam/reading`
- `/writing` → `/exam/writing`
- `/completed` → `/exam/completed`

### Route Meta

```typescript
{
  requiresAuth: boolean  // Authentication required
  mode: 'exam' | 'practice' | undefined  // Mode requirement
}
```

---

## 🔄 UX Flow Explanation

### Exam Mode Flow

```
User Access → Exam Login (/exam/login)
    ↓
Enter test credentials
    ↓
Login (authStore.login)
    ↓
- Fetch test data
- Enforce fullscreen
- Set mode to 'exam'
    ↓
Listening Exam (/exam/listening)
    ↓ [Complete]
Reading Exam (/exam/reading)
    ↓ [Complete or 60 min timeout]
Writing Exam (/exam/writing)
    ↓ [Submit]
Submit answers to /api/exam/submit
    ↓
Auto Logout (clear all data)
    ↓
Completed Page (/exam/completed) with scores
```

**Key Behaviors**:
- Fullscreen enforced during exam
- Strict navigation (can't revisit sections)
- No access to dashboard/history
- Auto-logout after submit
- Temporary credentials (test code)

---

### Practice Mode Flow

```
User Access → Practice Login (/practice/login)
    ↓
Enter email/password
    ↓
Login (authStore.login)
    ↓
- Fetch user profile
- Set mode to 'practice'
    ↓
Dashboard (/practice/dashboard)
    ↓
[Choose section or start practice test]
    ↓
Section Exam (/practice/listening|reading|writing|speaking)
    ↓ [Submit]
Submit answers to /api/practice/submit
    ↓
Practice Completed (/practice/completed)
    ↓
- View scores
- Download certificate (if premium)
- Share results
- Review answers
    ↓
Back to Dashboard
```

**Key Behaviors**:
- Persistent user account
- No fullscreen requirement
- Can revisit sections
- Access to dashboard/history
- No auto-logout
- Can review answers

---

### Speaking Module Flow

```
Select Speaking from Dashboard
    ↓
Speaking Exam (/practice/speaking)
    ↓
Part 1: Introduction
    ↓
[For each question]
    ↓
Click Start Recording
    ↓
Record answer (auto-stop at limit)
    ↓
Review recording (playback)
    ↓
Save/Delete
    ↓
[Next question or Next part]
    ↓
Part 2: Long Turn
    ↓
1 min preparation timer
    ↓
2 min recording
    ↓
Save
    ↓
Part 3: Discussion
    ↓
[For each question]
    ↓
Record → Review → Save
    ↓
Submit All Recordings
    ↓
Upload to /api/speaking/upload-recording
    ↓
Wait for feedback
    ↓
View feedback in Review View
```

**Audio Recording**:
- Uses `navigator.mediaDevices.getUserMedia()`
- `MediaRecorder` API for capturing
- Blob storage for recordings
- Upload as multipart/form-data

---

### Answer Review Flow

```
From Practice Completed or Dashboard History
    ↓
Click "Review" button
    ↓
Review View (/practice/review/:examId)
    ↓
Fetch review data from /api/review/exam/:id
    ↓
Display section tabs (All/Listening/Reading/Writing/Speaking)
    ↓
[For each question]
    ↓
- User answer (correct/incorrect)
- Correct answer (if wrong)
- Keywords highlighted
- Explanation
    ↓
[For writing]
    ↓
- Band breakdown (4 criteria)
- AI feedback text
- Correction suggestions
    ↓
Navigate back to dashboard
```

---

### Subscription Flow

```
User (not logged in) → /subscription
    ↓
Choose: Free Trial vs Pro Plan
    ↓
[If Free] → Practice Login → Create account
[If Pro] → Plans Page (/subscription/plans)
    ↓
Select Plan (Basic/Pro/Premium)
    ↓
Checkout flow (not implemented in frontend)
    ↓
Payment success
    ↓
User account created with subscription
    ↓
Redirect to Dashboard
```

**Locked Feature Flow**:
```
User clicks locked feature (e.g., Speaking)
    ↓
LockFeature component shown
    ↓
Hover displays tooltip:
  - "X is locked"
  - "Pro plan required"
    ↓
Click "Upgrade to Unlock"
    ↓
Navigate to /subscription/plans
```

---

## 🎨 UI/UX Guidelines

### Color Scheme

**Exam Mode**:
- Primary: Red (#dc2626) - Urgency, attention
- Background: Light gray (#f9fafb)
- Warning: Amber (#f59e0b)

**Practice Mode**:
- Primary: Green (#059669) - Growth, progress
- Background: Light gray (#f9fafb)
- Accent: Blue for listening, Green for reading, Amber for writing

**Subscription**:
- Free: Gray (#6b7280)
- Basic: Blue (#3b82f6)
- Pro: Purple (#7c3aed)
- Premium: Gold (#f59e0b)

### Typography

**Headings**:
- H1: 32-48px, font-weight 800
- H2: 24-28px, font-weight 600
- H3: 18-20px, font-weight 600

**Body**:
- Primary: 14-16px, font-weight 400/500
- Small: 12-13px, font-weight 500

**Monospace**: Courier New for timers

### Spacing

- Padding: 16px (small), 24px (medium), 32px (large)
- Gap: 8px (tight), 16px (normal), 24px (relaxed)
- Border radius: 8px (small), 12px (medium), 16px (large)

### Transitions

- Fast: 0.2s (hover effects)
- Normal: 0.3s (modal transitions)
- Slow: 0.5s (page transitions)

---

## 🔌 API Integration

### Endpoints (Frontend expects these from backend)

**Authentication**:
- `POST /api/exam/login` - Exam mode login
- `POST /api/auth/login` - Practice mode login
- `POST /api/auth/register` - User registration
- `POST /api/auth/logout` - Logout

**User Data**:
- `GET /api/user/profile` - User profile
- `GET /api/user/dashboard-stats` - Dashboard statistics
- `GET /api/user/band-scores` - Band score history
- `GET /api/user/exam-history` - Exam history

**Exam**:
- `GET /api/exam/test` - Fetch test data
- `POST /api/exam/submit` - Submit exam (exam mode)
- `POST /api/practice/submit` - Submit practice test

**Speaking**:
- `POST /api/speaking/upload-recording` - Upload audio
- `GET /api/speaking/feedback/:recordingId` - Get feedback

**Review**:
- `GET /api/review/exam/:examId` - Get exam review

**Subscription**:
- `POST /api/subscription/checkout` - Initiate checkout
- `POST /api/subscription/webhook` - Payment webhook

---

## 📱 Responsive Design

### Breakpoints
- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px

### Mobile Adaptations
- Stacked grids (1 column)
- Smaller fonts (16px headers)
- Compact padding
- Bottom navigation (considered)

### Tablet Adaptations
- 2-column grids
- Medium fonts
- Horizontal scrolling for cards

---

## 🚀 Deployment Notes

### Environment Variables
```bash
VITE_API_URL=https://api.example.com
```

### Build
```bash
pnpm build
```

### Preview
```bash
pnpm preview
```

---

## 📝 Future Enhancements

1. **Offline Support**: Service worker for offline practice
2. **Speech Recognition**: AI-powered speaking analysis
3. **Study Plan**: Personalized study schedule
4. **Community**: Social features, leaderboards
5. **Gamification**: Points, badges, achievements
6. **Mobile App**: Native iOS/Android apps
7. **Zoom Integration**: Live speaking sessions
8. **Advanced Analytics**: Detailed performance insights

---

## 🧪 Testing Considerations

### Unit Tests
- Store actions (authStore, userStore, speakingStore, reviewStore)
- Component rendering
- Utility functions

### Integration Tests
- Authentication flow
- Exam submission
- Recording upload
- Review data fetching

### E2E Tests
- Full exam mode flow
- Full practice mode flow
- Speaking recording
- Subscription upgrade

---

## 📞 Support

For questions or issues, refer to:
- Vue 3 documentation: https://vuejs.org/
- Pinia documentation: https://pinia.vuejs.org/
- Vue Router: https://router.vuejs.org/

---

*Document Version: 1.0*
*Last Updated: 2024*
