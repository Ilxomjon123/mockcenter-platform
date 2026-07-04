import { ref } from 'vue'
import { check, type Update } from '@tauri-apps/plugin-updater'
import { relaunch } from '@tauri-apps/plugin-process'
import { isTauri, enableClose } from './useTauri'

export const updateInfo = ref<{ version: string; notes: string } | null>(null)
export const updating = ref(false)
export const updateProgress = ref(0)
export const checking = ref(false)
let _update: Update | null = null

export type CheckResult = 'available' | 'latest' | 'offline' | 'error' | 'unsupported'

// Check for a newer version. Has a timeout so it never hangs when offline.
export async function checkForUpdate(): Promise<CheckResult> {
  if (!isTauri()) return 'unsupported'
  if (!navigator.onLine) return 'offline'
  checking.value = true
  try {
    const u = await Promise.race([
      check(),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), 8000)),
    ])
    if (u) {
      _update = u
      updateInfo.value = { version: u.version, notes: u.body ?? '' }
      return 'available'
    }
    updateInfo.value = null
    return 'latest'
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    // timeout / network error → treat as offline
    return msg === 'timeout' || !navigator.onLine ? 'offline' : 'error'
  } finally {
    checking.value = false
  }
}

export async function installUpdate(): Promise<void> {
  if (!_update) return
  updating.value = true
  updateProgress.value = 0
  let total = 0
  let got = 0
  try {
    await _update.downloadAndInstall((ev) => {
      if (ev.event === 'Started') {
        total = ev.data.contentLength ?? 0
      } else if (ev.event === 'Progress') {
        got += ev.data.chunkLength
        updateProgress.value = total ? Math.round((got / total) * 100) : 0
      }
    })
    // Kiosk mode blocks window close by default — release the guard so relaunch succeeds.
    await enableClose()
    await relaunch()
  } finally {
    updating.value = false
  }
}

export function dismissUpdate() {
  updateInfo.value = null
}

export function useUpdater() {
  return {
    updateInfo,
    updating,
    updateProgress,
    checking,
    checkForUpdate,
    installUpdate,
    dismissUpdate,
  }
}
