import { create } from 'zustand'

interface CalculationResult {
  method: string
  result: any
  timestamp: number
}

interface Store {
  history: CalculationResult[]
  addToHistory: (result: CalculationResult) => void
  clearHistory: () => void
  getLastResult: () => CalculationResult | null
}

export const useStore = create<Store>((set, get) => ({
  history: [],
  
  addToHistory: (result: CalculationResult) => {
    set((state) => ({
      history: [...state.history, result]
    }))
  },
  
  clearHistory: () => {
    set({ history: [] })
  },
  
  getLastResult: () => {
    const state = get()
    return state.history.length > 0 ? state.history[state.history.length - 1] : null
  },
}))

export default useStore
