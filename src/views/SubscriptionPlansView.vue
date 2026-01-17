<template>
  <div class="subscription-plans">
    <header class="plans-header">
      <h1>Choose Your Plan</h1>
      <p>Unlock your full potential with our flexible subscription plans</p>
    </header>

    <!-- Plan Cards -->
    <div class="plans-grid">
      <div class="plan-card free">
        <div class="plan-badge">Free</div>
        <div class="plan-price">$0<span>/month</span></div>
        <ul class="plan-features">
          <li class="included">
            <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path></svg>
            Practice mode
          </li>
          <li class="included">
            <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path></svg>
            Basic analytics
          </li>
          <li class="included">
            <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path></svg>
            3 practice tests/month
          </li>
          <li class="excluded">
            <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path></svg>
            Answer review
          </li>
          <li class="excluded">
            <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path></svg>
            AI feedback
          </li>
          <li class="excluded">
            <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path></svg>
            Speaking module
          </li>
        </ul>
        <button class="plan-btn current">Current Plan</button>
      </div>

      <div class="plan-card basic">
        <div class="plan-badge">Basic</div>
        <div class="plan-price">$9<span>/month</span></div>
        <ul class="plan-features">
          <li class="included">
            <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path></svg>
            Everything in Free
          </li>
          <li class="included">
            <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path></svg>
            Unlimited practice tests
          </li>
          <li class="included">
            <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path></svg>
            Answer review with explanations
          </li>
          <li class="included">
            <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path></svg>
            Speaking Part 1
          </li>
          <li class="excluded">
            <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path></svg>
            AI writing feedback
          </li>
          <li class="excluded">
            <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path></svg>
            Speaking Parts 2 & 3
          </li>
        </ul>
        <button class="plan-btn primary" @click="selectPlan('basic')">Get Started</button>
      </div>

      <div class="plan-card pro featured">
        <div class="popular-badge">Most Popular</div>
        <div class="plan-badge">Pro</div>
        <div class="plan-price">$19<span>/month</span></div>
        <ul class="plan-features">
          <li class="included">
            <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path></svg>
            Everything in Basic
          </li>
          <li class="included">
            <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path></svg>
            AI-powered writing feedback
          </li>
          <li class="included">
            <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path></svg>
            Full speaking module (Parts 1, 2, 3)
          </li>
          <li class="included">
            <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path></svg>
            Detailed band breakdown
          </li>
          <li class="included">
            <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path></svg>
            Certificate of completion
          </li>
        </ul>
        <button class="plan-btn primary" @click="selectPlan('pro')">Get Started</button>
      </div>

      <div class="plan-card premium">
        <div class="plan-badge">Premium</div>
        <div class="plan-price">$29<span>/month</span></div>
        <ul class="plan-features">
          <li class="included">
            <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path></svg>
            Everything in Pro
          </li>
          <li class="included">
            <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path></svg>
            Human examiner review
          </li>
          <li class="included">
            <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path></svg>
            Priority support
          </li>
          <li class="included">
            <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path></svg>
            1-on-1 consultation
          </li>
          <li class="included">
            <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path></svg>
            Personalized study plan
          </li>
        </ul>
        <button class="plan-btn primary" @click="selectPlan('premium')">Get Started</button>
      </div>
    </div>

    <!-- FAQ Section -->
    <section class="faq-section">
      <h2>Frequently Asked Questions</h2>
      <div class="faq-list">
        <details class="faq-item">
          <summary>Can I change or cancel my plan anytime?</summary>
          <p>Yes, you can upgrade, downgrade, or cancel your subscription at any time. Changes take effect at the end of your current billing cycle.</p>
        </details>
        <details class="faq-item">
          <summary>What payment methods do you accept?</summary>
          <p>We accept all major credit cards, PayPal, and various local payment methods depending on your region.</p>
        </details>
        <details class="faq-item">
          <summary>Is there a free trial?</summary>
          <p>Yes! All new users get a 7-day free trial of the Pro plan, no credit card required.</p>
        </details>
        <details class="faq-item">
          <summary>Can I download my certificates?</summary>
          <p>Yes, Pro and Premium users can download certificates for completed practice tests directly from their dashboard.</p>
        </details>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

const selectPlan = (plan: string) => {
  // Navigate to checkout or payment page
  console.log('Selected plan:', plan)
  router.push(`/subscription/checkout?plan=${plan}`)
}
</script>

<style scoped>
.subscription-plans {
  min-height: 100vh;
  background: #f9fafb;
  padding: 40px 20px;
}

.plans-header {
  text-align: center;
  max-width: 600px;
  margin: 0 auto 60px;
}

.plans-header h1 {
  font-size: 48px;
  font-weight: 700;
  color: #111827;
  margin: 0 0 16px 0;
}

.plans-header p {
  font-size: 18px;
  color: #6b7280;
  margin: 0;
  line-height: 1.6;
}

.plans-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 24px;
  max-width: 1200px;
  margin: 0 auto 80px;
}

.plan-card {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  padding: 32px;
  position: relative;
  transition: all 0.3s;
}

.plan-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 20px 40px -10px rgba(0, 0, 0, 0.15);
}

.plan-card.featured {
  border: 2px solid #059669;
  box-shadow: 0 10px 30px -10px rgba(5, 150, 105, 0.3);
}

.popular-badge {
  position: absolute;
  top: -12px;
  left: 50%;
  transform: translateX(-50%);
  background: #059669;
  color: #fff;
  padding: 6px 16px;
  border-radius: 9999px;
  font-size: 13px;
  font-weight: 600;
}

.plan-badge {
  display: inline-block;
  padding: 6px 12px;
  background: #f3f4f6;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 16px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.plan-price {
  font-size: 48px;
  font-weight: 700;
  color: #111827;
  margin-bottom: 32px;
  line-height: 1;
}

.plan-price span {
  font-size: 18px;
  font-weight: 500;
  color: #6b7280;
}

.plan-features {
  list-style: none;
  padding: 0;
  margin: 0 0 24px 0;
}

.plan-features li {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  font-size: 14px;
  color: #374151;
}

.plan-features li svg {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

.plan-features li.included svg {
  color: #059669;
}

.plan-features li.excluded svg {
  color: #9ca3af;
}

.plan-btn {
  width: 100%;
  padding: 14px 24px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  background: #fff;
  color: #374151;
}

.plan-btn:hover:not(.current) {
  background: #f9fafb;
}

.plan-btn.current {
  background: #f3f4f6;
  color: #6b7280;
  cursor: default;
}

.plan-btn.primary {
  background: #059669;
  color: #fff;
  border-color: #059669;
}

.plan-btn.primary:hover {
  background: #047857;
}

.faq-section {
  max-width: 800px;
  margin: 0 auto;
}

.faq-section h2 {
  text-align: center;
  font-size: 32px;
  font-weight: 600;
  color: #111827;
  margin-bottom: 40px;
}

.faq-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.faq-item {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 20px;
  cursor: pointer;
  transition: border-color 0.2s;
}

.faq-item:hover {
  border-color: #059669;
}

.faq-item summary {
  font-size: 16px;
  font-weight: 500;
  color: #111827;
  cursor: pointer;
  list-style: none;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.faq-item summary::-webkit-details-marker {
  display: none;
}

.faq-item summary::after {
  content: '+';
  font-size: 24px;
  color: #6b7280;
  font-weight: 300;
}

.faq-item[open] summary::after {
  content: '−';
}

.faq-item p {
  margin: 16px 0 0 0;
  font-size: 14px;
  color: #6b7280;
  line-height: 1.6;
}

@media (max-width: 1024px) {
  .plans-grid {
    grid-template-columns: 1fr;
    max-width: 400px;
  }
}

@media (max-width: 640px) {
  .plans-header h1 {
    font-size: 32px;
  }

  .plans-header p {
    font-size: 16px;
  }

  .plan-card {
    padding: 24px;
  }
}
</style>
