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
   * Detect if running on iOS Safari
   */
  function isIOSSafari(): boolean {
    const ua = navigator.userAgent
    return /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  }

  /**
   * iOS Safari workaround: speechSynthesis stops working after ~15s without
   * user interaction. We periodically poke it to keep the audio session alive.
   */
  let iosKeepAliveTimer: ReturnType<typeof setInterval> | null = null

  function startIOSKeepAlive() {
    if (!isIOSSafari() || iosKeepAliveTimer) return
    iosKeepAliveTimer = setInterval(() => {
      if (!isSpeaking.value) {
        speechSynthesis.cancel()
        const silent = new SpeechSynthesisUtterance('')
        silent.volume = 0
        speechSynthesis.speak(silent)
      }
    }, 10000)
  }

  function stopIOSKeepAlive() {
    if (iosKeepAliveTimer) {
      clearInterval(iosKeepAliveTimer)
      iosKeepAliveTimer = null
    }
  }

  /**
   * Small delay helper.
   */
  function delay(ms: number): Promise<void> {
    return new Promise((r) => setTimeout(r, ms))
  }

  /**
   * Speak text and return a promise that resolves when speech finishes.
   * Includes a safety timeout so the exam never hangs if TTS fails on mobile.
   */
  async function speak(text: string): Promise<void> {
    if (!isSupported.value) {
      await delay(1000)
      return
    }

    // Cancel any ongoing speech, then wait briefly.
    // On mobile browsers, calling speak() immediately after cancel()
    // causes the new utterance to be silently canceled too.
    speechSynthesis.cancel()
    await delay(100)

    return new Promise((resolve) => {
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

      let settled = false

      function settle() {
        if (settled) return
        settled = true
        clearTimeout(safetyTimer)
        isSpeaking.value = false
        currentUtterance = null
        resolve()
      }

      // Safety timeout: if TTS hangs (common on iOS Safari), resolve anyway
      // so the exam flow continues. Max wait = 800ms per word + 4s base.
      const wordCount = text.split(/\s+/).length
      const timeoutMs = Math.max(6000, wordCount * 800 + 4000)
      const safetyTimer = setTimeout(settle, timeoutMs)

      utterance.onstart = () => {
        isSpeaking.value = true
        startIOSKeepAlive()
      }

      utterance.onend = () => settle()

      utterance.onerror = () => settle()

      speechSynthesis.speak(utterance)

      // Mobile fallback: if after 3 seconds nothing happened (no onstart,
      // no speaking, no pending), TTS is broken on this device — skip.
      // 200ms was too aggressive and killed TTS on slower mobile engines.
      setTimeout(() => {
        if (!settled && !isSpeaking.value && !speechSynthesis.speaking && !speechSynthesis.pending) {
          settle()
        }
      }, 3000)
    })
  }

  /**
   * Stop current speech.
   */
  function stop() {
    speechSynthesis.cancel()
    isSpeaking.value = false
    currentUtterance = null
    stopIOSKeepAlive()
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
   * Shared AudioContext — reused across all sound effects.
   * Mobile browsers require user gesture to start AudioContext;
   * creating a new one each time often fails silently on mobile.
   */
  let sharedAudioCtx: AudioContext | null = null

  function getAudioContext(): AudioContext {
    if (!sharedAudioCtx || sharedAudioCtx.state === 'closed') {
      sharedAudioCtx = new AudioContext()
    }
    // Resume if suspended (mobile autoplay policy)
    if (sharedAudioCtx.state === 'suspended') {
      sharedAudioCtx.resume()
    }
    return sharedAudioCtx
  }

  /**
   * Warm up AudioContext with a user gesture.
   * Call this from a click/touch handler to unlock audio on mobile.
   */
  function warmUpAudio() {
    try {
      const ctx = getAudioContext()
      // Play a silent buffer to unlock the audio context
      const buffer = ctx.createBuffer(1, 1, 22050)
      const source = ctx.createBufferSource()
      source.buffer = buffer
      source.connect(ctx.destination)
      source.start(0)
    } catch {
      // ignore
    }
  }

  /**
   * Play ascending "tiling" sound — signals recording START.
   */
  function playStartSound(): Promise<void> {
    return new Promise((resolve) => {
      try {
        const ctx = getAudioContext()
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
          resolve()
        }

        // Safety timeout in case onended doesn't fire on some mobile browsers
        setTimeout(resolve, 600)
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
        const ctx = getAudioContext()
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
          resolve()
        }

        // Safety timeout in case onended doesn't fire on some mobile browsers
        setTimeout(resolve, 1100)
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
    warmUpAudio,
  }
}
