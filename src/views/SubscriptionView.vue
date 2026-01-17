<template>
  <div class="subscription">
    <div class="subscription-container">
      <div class="subscription-content">
        <h1>Choose Your Path</h1>
        <p>Start with our free trial or unlock unlimited practice with a subscription</p>

        <div class="mode-cards">
          <div class="mode-card free" @click="goToPlans('free')">
            <div class="card-icon">🎯</div>
            <h2>Free Trial</h2>
            <p class="price">Free forever</p>
            <ul class="features">
              <li>
                <svg viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                </svg>
                Practice mode
              </li>
              <li>
                <svg viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                </svg>
                Basic analytics
              </li>
              <li>
                <svg viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                </svg>
                3 practice tests/month
              </li>
            </ul>
            <button class="choose-btn">Get Started Free</button>
          </div>

          <div class="mode-card premium" @click="goToPlans('pro')">
            <div class="popular-badge">Most Popular</div>
            <div class="card-icon">⭐</div>
            <h2>Pro Plan</h2>
            <p class="price">$19/month</p>
            <ul class="features">
              <li>
                <svg viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                </svg>
                Unlimited practice tests
              </li>
              <li>
                <svg viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                </svg>
                AI writing feedback
              </li>
              <li>
                <svg viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                </svg>
                Full speaking module
              </li>
              <li>
                <svg viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                </svg>
                Detailed answer review
              </li>
              <li>
                <svg viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                </svg>
                Downloadable certificates
              </li>
            </ul>
            <button class="choose-btn primary">Start 7-Day Free Trial</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

const goToPlans = (plan: string) => {
  if (plan === 'free') {
    router.push('/practice/login')
  } else {
    router.push('/subscription/plans')
  }
}
</script>

<style scoped>
.subscription {
  min-height: 100vh;
  background: linear-gradient(135deg, #059669 0%, #047857 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
}

.subscription-container {
  max-width: 1000px;
  width: 100%;
}

.subscription-content {
  text-align: center;
  color: #fff;
}

.subscription-content h1 {
  font-size: 48px;
  font-weight: 800;
  margin: 0 0 16px 0;
}

.subscription-content > p {
  font-size: 18px;
  margin: 0 0 48px 0;
  opacity: 0.9;
}

.mode-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 24px;
}

.mode-card {
  background: #fff;
  border-radius: 20px;
  padding: 40px;
  position: relative;
  transition: transform 0.3s, box-shadow 0.3s;
  cursor: pointer;
  text-align: left;
}

.mode-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 20px 40px -10px rgba(0, 0, 0, 0.2);
}

.mode-card.premium {
  border: 3px solid #fbbf24;
}

.popular-badge {
  position: absolute;
  top: -16px;
  left: 50%;
  transform: translateX(-50%);
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  color: #fff;
  padding: 8px 24px;
  border-radius: 9999px;
  font-size: 14px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.card-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.mode-card h2 {
  font-size: 28px;
  font-weight: 700;
  color: #111827;
  margin: 0 0 8px 0;
}

.price {
  font-size: 24px;
  font-weight: 600;
  color: #6b7280;
  margin: 0 0 32px 0;
}

.mode-card.premium .price {
  color: #059669;
}

.features {
  list-style: none;
  padding: 0;
  margin: 0 0 32px 0;
}

.features li {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  font-size: 15px;
  color: #374151;
}

.features li svg {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  color: #059669;
}

.choose-btn {
  width: 100%;
  padding: 16px 32px;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  background: #fff;
  color: #374151;
  transition: all 0.2s;
}

.choose-btn:hover {
  background: #f9fafb;
  border-color: #9ca3af;
}

.choose-btn.primary {
  background: #059669;
  color: #fff;
  border-color: #059669;
}

.choose-btn.primary:hover {
  background: #047857;
}

@media (max-width: 768px) {
  .subscription-content h1 {
    font-size: 32px;
  }

  .subscription-content > p {
    font-size: 16px;
  }

  .mode-card {
    padding: 32px 24px;
  }

  .mode-card h2 {
    font-size: 24px;
  }
}
</style>
