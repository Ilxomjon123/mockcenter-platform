import { ref } from 'vue'

/**
 * Text-to-Speech composable using Web Speech API.
 * Provides natural-sounding speech synthesis for speaking exam instructions and questions.
 */
export function useSpeakingTTS() {
  const isSpeaking = ref(false)
  const isSupported = ref('speechSynthesis' in window)

  let currentUtterance: SpeechSynthesisUtterance | null = null
  let cachedVoice: SpeechSynthesisVoice | null = null

  // Known male voice names across browsers/OS
  const MALE_VOICE_NAMES = [
    'daniel', 'david', 'james', 'thomas', 'tom', 'oliver',
    'george', 'arthur', 'fred', 'alex', 'ralph', 'albert',
    'gordon', 'aaron', 'guy', 'lee', 'malcolm', 'reed',
    'rishi', 'ryan', 'evan', 'mark', 'paul',
    'google uk english male',
    'google us english',
    'microsoft mark', 'microsoft david', 'microsoft george',
    'microsoft ryan', 'microsoft guy',
  ]

  function isMaleVoice(v: SpeechSynthesisVoice): boolean {
    const name = v.name.toLowerCase()
    return MALE_VOICE_NAMES.some((m) => name.includes(m))
  }

  /**
   * Score a voice by quality. Higher = more natural and expressive.
   * Strongly prefers male voices with warm, soft tone.
   */
  function scoreVoice(v: SpeechSynthesisVoice): number {
    const name = v.name.toLowerCase()
    let score = 0

    // Male voice bonus (highest priority)
    if (isMaleVoice(v)) score += 300

    // Neural / Enhanced / Premium voices are the most natural and expressive
    if (name.includes('neural')) score += 150
    if (name.includes('enhanced')) score += 120
    if (name.includes('premium')) score += 110
    if (name.includes('natural')) score += 100

    // Microsoft Online voices (Edge) are very natural
    if (name.includes('microsoft') && name.includes('online')) score += 90

    // Specific high-quality male voices
    if (name.includes('daniel')) score += 80
    if (name.includes('david')) score += 70
    if (name.includes('james')) score += 65
    if (name.includes('thomas')) score += 60
    if (name.includes('google uk english male')) score += 80
    if (name.includes('google us english')) score += 65
    if (name.includes('microsoft mark')) score += 65
    if (name.includes('microsoft david')) score += 65
    if (name.includes('microsoft george')) score += 60
    if (name.includes('microsoft ryan')) score += 60
    if (name.includes('microsoft guy')) score += 60

    // Google voices on Chrome are good quality
    if (name.includes('google')) score += 40

    // Microsoft voices are generally decent
    if (name.includes('microsoft')) score += 25

    // Remote/cloud voices are almost always higher quality than local
    if (!v.localService) score += 20

    // Prefer en-GB for exams (clearer, warmer enunciation)
    if (v.lang === 'en-GB') score += 12
    if (v.lang === 'en-US') score += 10
    if (v.lang === 'en-AU') score += 6

    return score
  }

  /**
   * Get the best English voice available.
   * Uses scoring system to find the most natural-sounding voice.
   */
  function getBestVoice(): SpeechSynthesisVoice | null {
    if (cachedVoice) return cachedVoice

    const voices = speechSynthesis.getVoices()
    const englishVoices = voices.filter(
      (v) => v.lang.startsWith('en-') || v.lang === 'en',
    )

    if (englishVoices.length === 0) return voices[0] || null

    // Sort by quality score descending
    const sorted = [...englishVoices].sort((a, b) => scoreVoice(b) - scoreVoice(a))
    cachedVoice = sorted[0] ?? null
    return cachedVoice
  }

  /**
   * Speak text and return a promise that resolves when speech finishes.
   */
  function speak(text: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!isSupported.value) {
        setTimeout(resolve, 1000)
        return
      }

      // Cancel any ongoing speech
      speechSynthesis.cancel()

      const utterance = new SpeechSynthesisUtterance(text)
      currentUtterance = utterance

      const voice = getBestVoice()
      if (voice) {
        utterance.voice = voice
      }

      // Natural, warm male speech — slightly varied to reduce robotic feel
      utterance.rate = 0.95
      utterance.pitch = 1.0
      utterance.volume = 0.9

      utterance.onstart = () => {
        isSpeaking.value = true
      }

      utterance.onend = () => {
        isSpeaking.value = false
        currentUtterance = null
        resolve()
      }

      utterance.onerror = (event) => {
        isSpeaking.value = false
        currentUtterance = null
        if (event.error === 'canceled' || event.error === 'interrupted') {
          resolve()
        } else {
          reject(new Error(`Speech synthesis error: ${event.error}`))
        }
      }

      speechSynthesis.speak(utterance)
    })
  }

  /**
   * Stop current speech.
   */
  function stop() {
    speechSynthesis.cancel()
    isSpeaking.value = false
    currentUtterance = null
  }

  /**
   * Ensure voices are loaded (they load async in some browsers).
   */
  function ensureVoicesLoaded(): Promise<void> {
    return new Promise((resolve) => {
      const voices = speechSynthesis.getVoices()
      if (voices.length > 0) {
        cachedVoice = null // Reset cache to re-evaluate with all voices
        resolve()
        return
      }

      speechSynthesis.onvoiceschanged = () => {
        cachedVoice = null
        resolve()
      }

      // Fallback timeout
      setTimeout(resolve, 1000)
    })
  }

  /**
   * Play ascending "tiling" sound — signals recording START.
   */
  function playStartSound(): Promise<void> {
    return new Promise((resolve) => {
      try {
        const ctx = new AudioContext()
        const t = ctx.currentTime

        // Two ascending tones
        const osc1 = ctx.createOscillator()
        const gain1 = ctx.createGain()
        osc1.connect(gain1)
        gain1.connect(ctx.destination)
        osc1.type = 'sine'
        osc1.frequency.setValueAtTime(880, t)
        gain1.gain.setValueAtTime(0.35, t)
        gain1.gain.exponentialRampToValueAtTime(0.01, t + 0.2)
        osc1.start(t)
        osc1.stop(t + 0.2)

        const osc2 = ctx.createOscillator()
        const gain2 = ctx.createGain()
        osc2.connect(gain2)
        gain2.connect(ctx.destination)
        osc2.type = 'sine'
        osc2.frequency.setValueAtTime(1320, t + 0.15)
        gain2.gain.setValueAtTime(0.01, t)
        gain2.gain.setValueAtTime(0.35, t + 0.15)
        gain2.gain.exponentialRampToValueAtTime(0.01, t + 0.5)
        osc2.start(t + 0.15)
        osc2.stop(t + 0.5)

        osc2.onended = () => {
          ctx.close()
          resolve()
        }
      } catch {
        resolve()
      }
    })
  }

  /**
   * Play "jiring" bell/chime sound — signals recording STOP.
   * Two descending bell tones like a doorbell or exam bell.
   */
  function playStopSound(): Promise<void> {
    return new Promise((resolve) => {
      try {
        const ctx = new AudioContext()
        const t = ctx.currentTime

        // First bell strike — high note
        const osc1 = ctx.createOscillator()
        const gain1 = ctx.createGain()
        osc1.connect(gain1)
        gain1.connect(ctx.destination)
        osc1.type = 'sine'
        osc1.frequency.setValueAtTime(1047, t) // C6
        gain1.gain.setValueAtTime(0.3, t)
        gain1.gain.exponentialRampToValueAtTime(0.01, t + 0.6)
        osc1.start(t)
        osc1.stop(t + 0.6)

        // First bell overtone
        const osc1h = ctx.createOscillator()
        const gain1h = ctx.createGain()
        osc1h.connect(gain1h)
        gain1h.connect(ctx.destination)
        osc1h.type = 'sine'
        osc1h.frequency.setValueAtTime(2094, t) // C7 (octave)
        gain1h.gain.setValueAtTime(0.1, t)
        gain1h.gain.exponentialRampToValueAtTime(0.01, t + 0.3)
        osc1h.start(t)
        osc1h.stop(t + 0.3)

        // Second bell strike — lower note (after short pause)
        const osc2 = ctx.createOscillator()
        const gain2 = ctx.createGain()
        osc2.connect(gain2)
        gain2.connect(ctx.destination)
        osc2.type = 'sine'
        osc2.frequency.setValueAtTime(784, t + 0.3) // G5
        gain2.gain.setValueAtTime(0.01, t)
        gain2.gain.setValueAtTime(0.3, t + 0.3)
        gain2.gain.exponentialRampToValueAtTime(0.01, t + 1.0)
        osc2.start(t + 0.3)
        osc2.stop(t + 1.0)

        // Second bell overtone
        const osc2h = ctx.createOscillator()
        const gain2h = ctx.createGain()
        osc2h.connect(gain2h)
        gain2h.connect(ctx.destination)
        osc2h.type = 'sine'
        osc2h.frequency.setValueAtTime(1568, t + 0.3) // G6
        gain2h.gain.setValueAtTime(0.01, t)
        gain2h.gain.setValueAtTime(0.08, t + 0.3)
        gain2h.gain.exponentialRampToValueAtTime(0.01, t + 0.6)
        osc2h.start(t + 0.3)
        osc2h.stop(t + 0.6)

        osc2.onended = () => {
          ctx.close()
          resolve()
        }
      } catch {
        resolve()
      }
    })
  }

  return {
    isSpeaking,
    isSupported,
    speak,
    stop,
    playStartSound,
    playStopSound,
    ensureVoicesLoaded,
  }
}
