import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface DebugLog {
  id: string
  event: string
  timestamp: Date
  ga4Status: 'sent' | 'failed' | 'pending' | 'not_configured'
  pixelStatus: 'sent' | 'failed' | 'pending' | 'not_configured'
  data: Record<string, unknown>
}

interface DebugStore {
  enabled: boolean
  logs: DebugLog[]
  ga4Id: string | null
  pixelId: string | null
  installationDebugSetting: 'inherit' | 'enabled' | 'disabled' | null
  addLog: (log: Omit<DebugLog, 'id'>) => void
  clearLogs: () => void
  toggle: () => void
  setEnabled: (enabled: boolean) => void
  setGa4Id: (id: string | null) => void
  setPixelId: (id: string | null) => void
  setInstallationDebugSetting: (setting: 'inherit' | 'enabled' | 'disabled' | null) => void
  isDebugActive: () => boolean
}

export const useDebugStore = create<DebugStore>()(
  persist(
    (set, get) => ({
      enabled: false,
      logs: [],
      ga4Id: null,
      pixelId: null,
      installationDebugSetting: null,
      addLog: (log) =>
        set((state) => ({
          logs: [{ ...log, id: crypto.randomUUID() }, ...state.logs].slice(0, 50),
        })),
      clearLogs: () => set({ logs: [] }),
      toggle: () => set((state) => ({ enabled: !state.enabled })),
      setEnabled: (enabled) => set({ enabled }),
      setGa4Id: (id) => set({ ga4Id: id }),
      setPixelId: (id) => set({ pixelId: id }),
      setInstallationDebugSetting: (setting) => set({ installationDebugSetting: setting }),
      isDebugActive: () => {
        const state = get()
        if (state.enabled) return true
        if (state.installationDebugSetting === 'enabled') return true
        return false
      },
    }),
    {
      name: 'youtube-shell-debug',
      partialize: (state) => ({
        enabled: state.enabled,
        installationDebugSetting: state.installationDebugSetting,
      }),
    }
  )
)
