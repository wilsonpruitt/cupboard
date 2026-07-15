// Single localStorage-backed state object for the startup guide. Load once,
// write-through on change. No migrations needed at v1.

const STORAGE_KEY = 'cupboard-startup-guide-v1'

export interface StartupGuideState {
  churchName?: string
  town?: string
  permitAnswers: Record<string, string>
  checked: Record<string, boolean>
  householdsPerMonth?: number
  targetLaunchMonth?: string // '2026-10'
}

const DEFAULT_STATE: StartupGuideState = {
  permitAnswers: {},
  checked: {},
}

export function loadGuideState(): StartupGuideState {
  if (typeof window === 'undefined') return { ...DEFAULT_STATE }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...DEFAULT_STATE }
    const parsed = JSON.parse(raw) as Partial<StartupGuideState>
    return {
      ...DEFAULT_STATE,
      ...parsed,
      permitAnswers: parsed.permitAnswers ?? {},
      checked: parsed.checked ?? {},
    }
  } catch {
    return { ...DEFAULT_STATE }
  }
}

export function saveGuideState(state: StartupGuideState): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}
