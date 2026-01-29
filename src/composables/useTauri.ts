import { invoke } from '@tauri-apps/api/core'

// Check if running in Tauri
export const isTauri = (): boolean => {
  return '__TAURI__' in window || '__TAURI_INTERNALS__' in window
}

// Exit the application (only works in Tauri)
export const exitApp = async (): Promise<void> => {
  if (isTauri()) {
    try {
      await invoke('exit_app')
    } catch (error) {
      console.error('Failed to exit app:', error)
    }
  }
}

// Enable close (allows the window to be closed)
export const enableClose = async (): Promise<void> => {
  if (isTauri()) {
    try {
      await invoke('enable_close')
    } catch (error) {
      console.error('Failed to enable close:', error)
    }
  }
}

export function useTauri() {
  return {
    isTauri,
    exitApp,
    enableClose,
  }
}
