import { ref } from 'vue'
import { getVersion } from '@tauri-apps/api/app'
import { isTauri } from './useTauri'

// App version (from tauri.conf.json). Shown on the login page.
export const appVersion = ref('')

if (isTauri()) {
  getVersion()
    .then((v) => (appVersion.value = v))
    .catch(() => {})
}

export function useAppVersion() {
  return { appVersion }
}
