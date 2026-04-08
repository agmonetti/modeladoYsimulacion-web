import { create } from 'zustand'

export const useMethodStore = create((set) => ({
  // Estado global
  selectedMethod: 'biseccion',
  selectedCategory: 'root-finding',
  history: [],
  currentResult: null,
  loading: false,
  error: null,

  // Acciones
  setSelectedMethod: (method) => set({ selectedMethod: method }),
  setSelectedCategory: (category) => set({ selectedCategory: category }),
  setCurrentResult: (result) => set({ currentResult: result }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  
  addToHistory: (item) => set((state) => ({
    history: [item, ...state.history].slice(0, 50) // Últimas 50
  })),

  clearHistory: () => set({ history: [] }),
  clearError: () => set({ error: null }),
}))
