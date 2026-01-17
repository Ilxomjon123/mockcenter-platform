<template>
  <div class="band-score-chart">
    <canvas ref="chartCanvas"></canvas>
    <div v-if="scores.length === 0" class="empty-state">
      <p>No band score data available</p>
      <p class="empty-hint">Complete practice tests to see your progress</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, nextTick } from 'vue'
import type { BandScore } from '@/types/user'

interface Props {
  scores: BandScore[]
  period?: 'week' | 'month' | 'all'
}

const props = withDefaults(defineProps<Props>(), {
  period: 'week',
})

const chartCanvas = ref<HTMLCanvasElement | null>(null)

const filterScoresByPeriod = (scores: BandScore[]): BandScore[] => {
  const now = new Date()
  const periodDays = {
    week: 7,
    month: 30,
    all: 365 * 10,
  }

  const cutoffDate = new Date(now.getTime() - periodDays[props.period] * 24 * 60 * 60 * 1000)

  return scores.filter((score) => new Date(score.created_at) >= cutoffDate)
}

const drawChart = () => {
  if (!chartCanvas.value) return

  const canvas = chartCanvas.value
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const filteredScores = filterScoresByPeriod(props.scores)

  if (filteredScores.length === 0) {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    return
  }

  const overallScores = filteredScores
    .filter((s) => s.exam_type === 'overall')
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())

  if (overallScores.length === 0) return

  const containerWidth = canvas.parentElement?.clientWidth || 800
  const containerHeight = 300

  canvas.width = containerWidth * 2
  canvas.height = containerHeight * 2
  canvas.style.width = `${containerWidth}px`
  canvas.style.height = `${containerHeight}px`

  ctx.scale(2, 2)

  const padding = { top: 40, right: 40, bottom: 60, left: 50 }
  const chartWidth = containerWidth - padding.left - padding.right
  const chartHeight = containerHeight - padding.top - padding.bottom

  ctx.clearRect(0, 0, containerWidth, containerHeight)

  // Draw grid lines
  ctx.strokeStyle = '#e5e7eb'
  ctx.lineWidth = 1
  ctx.font = '12px Inter, system-ui, sans-serif'
  ctx.fillStyle = '#6b7280'

  // Y-axis labels (bands 0-9)
  for (let i = 0; i <= 9; i++) {
    const y = padding.top + chartHeight - (i / 9) * chartHeight

    ctx.beginPath()
    ctx.moveTo(padding.left, y)
    ctx.lineTo(padding.left + chartWidth, y)
    ctx.stroke()

    ctx.fillText(i.toString(), padding.left - 25, y + 4)
  }

  if (overallScores.length === 0) return

  // Draw line
  const maxScore = 9
  const minScore = 0
  const dataPoints = overallScores.map((score, index) => {
    const x = padding.left + (index / (overallScores.length - 1 || 1)) * chartWidth
    const y = padding.top + chartHeight - ((score.band - minScore) / (maxScore - minScore)) * chartHeight
    return { x, y, score }
  })

  if (dataPoints.length > 1) {
    ctx.beginPath()
    ctx.strokeStyle = '#059669'
    ctx.lineWidth = 3
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    ctx.moveTo(dataPoints[0].x, dataPoints[0].y)
    for (let i = 1; i < dataPoints.length; i++) {
      ctx.lineTo(dataPoints[i].x, dataPoints[i].y)
    }
    ctx.stroke()

    // Draw gradient fill under line
    const gradient = ctx.createLinearGradient(0, padding.top, 0, padding.top + chartHeight)
    gradient.addColorStop(0, 'rgba(5, 150, 105, 0.2)')
    gradient.addColorStop(1, 'rgba(5, 150, 105, 0)')

    ctx.beginPath()
    ctx.moveTo(dataPoints[0].x, padding.top + chartHeight)
    ctx.lineTo(dataPoints[0].x, dataPoints[0].y)

    for (let i = 1; i < dataPoints.length; i++) {
      ctx.lineTo(dataPoints[i].x, dataPoints[i].y)
    }

    ctx.lineTo(dataPoints[dataPoints.length - 1].x, padding.top + chartHeight)
    ctx.closePath()
    ctx.fillStyle = gradient
    ctx.fill()
  }

  // Draw points
  dataPoints.forEach((point, index) => {
    ctx.beginPath()
    ctx.arc(point.x, point.y, 6, 0, Math.PI * 2)
    ctx.fillStyle = '#fff'
    ctx.fill()
    ctx.strokeStyle = '#059669'
    ctx.lineWidth = 3
    ctx.stroke()

    // Draw date labels
    const date = new Date(point.score.created_at)
    const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

    ctx.fillStyle = '#6b7280'
    ctx.font = '11px Inter, system-ui, sans-serif'
    ctx.textAlign = 'center'

    // Show fewer labels if many points
    const labelStep = Math.ceil(dataPoints.length / 6)
    if (index % labelStep === 0) {
      ctx.fillText(dateStr, point.x, padding.top + chartHeight + 20)
    }

    // Draw band score above point
    ctx.fillStyle = '#111827'
    ctx.font = 'bold 12px Inter, system-ui, sans-serif'
    ctx.fillText(point.score.band.toFixed(1), point.x, point.y - 12)
  })
}

onMounted(async () => {
  await nextTick()
  drawChart()
})

watch(
  () => [props.scores, props.period],
  async () => {
    await nextTick()
    drawChart()
  },
  { deep: true },
)

// Handle window resize
let resizeTimeout: number
const handleResize = () => {
  clearTimeout(resizeTimeout)
  resizeTimeout = window.setTimeout(async () => {
    await nextTick()
    drawChart()
  }, 200)
}

if (typeof window !== 'undefined') {
  window.addEventListener('resize', handleResize)
}
</script>

<style scoped>
.band-score-chart {
  width: 100%;
  height: 100%;
  position: relative;
}

canvas {
  display: block;
  width: 100%;
  height: 100%;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 300px;
  color: #6b7280;
  text-align: center;
}

.empty-state p {
  margin: 0;
  font-size: 14px;
}

.empty-hint {
  font-size: 12px;
  color: #9ca3af;
  margin-top: 8px;
}
</style>
