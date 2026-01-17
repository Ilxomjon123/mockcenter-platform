export interface User {
  id: number
  email: string
  name: string
  avatar?: string
  subscription_status: SubscriptionStatus
  subscription_plan?: SubscriptionPlan
  subscription_ends_at?: string
  created_at: string
}

export enum SubscriptionStatus {
  TRIAL = 'trial',
  ACTIVE = 'active',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
}

export enum SubscriptionPlan {
  FREE = 'free',
  BASIC = 'basic',
  PRO = 'pro',
  PREMIUM = 'premium',
}

export interface BandScore {
  id: number
  user_id: number
  exam_id: number
  exam_type: 'listening' | 'reading' | 'writing' | 'speaking' | 'overall'
  band: number
  correct_count?: number
  total_count?: number
  created_at: string
}

export interface ExamHistory {
  id: number
  exam_id: number
  title: string
  type: 'exam' | 'practice'
  completed_at: string
  scores: {
    listening?: number
    reading?: number
    writing?: number
    speaking?: number
    overall?: number
  }
}

export interface DashboardStats {
  total_exams_taken: number
  total_practice_tests: number
  average_band: number
  best_band: number
  current_streak: number
  weekly_goal: number
  weekly_progress: number
}
