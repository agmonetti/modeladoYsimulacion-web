import axios from 'axios'

const API_URL = 'http://localhost:8000/api'

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Root Finding
export const callBiseccion = (data) => apiClient.post('/root-finding/biseccion', data)
export const callPuntoFijo = (data) => apiClient.post('/root-finding/punto-fijo', data)
export const callNewtonRaphson = (data) => apiClient.post('/root-finding/newton-raphson', data)
export const callAitken = (data) => apiClient.post('/root-finding/aitken', data)

// Differentiation
export const callDiferenciasFinitas = (data) => apiClient.post('/differentiation/diferencias-finitas', data)

// Integration
export const callRectangulo = (data) => apiClient.post('/integration/rectangulo', data)
export const callTrapecio = (data) => apiClient.post('/integration/trapecio', data)
export const callSimpson13 = (data) => apiClient.post('/integration/simpson-13', data)
export const callSimpson38 = (data) => apiClient.post('/integration/simpson-38', data)

// Interpolation
export const callLagrange = (data) => apiClient.post('/interpolation/lagrange', data)

// Monte Carlo
export const callHitOrMiss1D = (data) => apiClient.post('/monte-carlo/hit-or-miss-1d', data)
export const callValorPromedio1D = (data) => apiClient.post('/monte-carlo/valor-promedio-1d', data)
export const callValorPromedio2D = (data) => apiClient.post('/monte-carlo/valor-promedio-2d', data)
export const callEstadistico1D = (data) => apiClient.post('/monte-carlo/estadistico-1d', data)
