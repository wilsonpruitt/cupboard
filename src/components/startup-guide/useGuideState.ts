import { useEffect, useState } from 'react'
import { loadGuideState, saveGuideState, type StartupGuideState } from '@/lib/startup-guide-state'

export function useGuideState() {
  const [state, setState] = useState<StartupGuideState>(() => loadGuideState())

  useEffect(() => {
    saveGuideState(state)
  }, [state])

  const update = (patch: Partial<StartupGuideState>) => {
    setState((prev) => ({ ...prev, ...patch }))
  }

  const toggleChecked = (id: string) => {
    setState((prev) => ({ ...prev, checked: { ...prev.checked, [id]: !prev.checked[id] } }))
  }

  const setPermitAnswer = (question: string, answer: string) => {
    setState((prev) => ({ ...prev, permitAnswers: { ...prev.permitAnswers, [question]: answer } }))
  }

  return { state, update, toggleChecked, setPermitAnswer }
}
