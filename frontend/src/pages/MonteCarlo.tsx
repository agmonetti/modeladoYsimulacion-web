import { useState } from 'react'
import { monteCarloService } from '../services/api'
import PlotlyGraph from '../components/PlotlyGraph'
import IterationsTable from '../components/IterationsTable'
import FormulaDisplay from '../components/FormulaDisplay'
import '../styles/Method.css'

export default function MonteCarlo() {
  const [dimension, setDimension] = useState('1d')
  const [method, setMethod] = useState('valor-promedio-1d')
  const [input, setInput] = useState({
    func_str: 'x**2',
    a: '0',
    b: '1',
    ya: '0',
    yb: '1',
    N: '10000',
    seed: '',
    M: '50',
    nivel_confianza: '0.95',
    precision: '8'
  })
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleDimensionChange = (dim: string) => {
    setDimension(dim)
    if (dim === '1d') setMethod('valor-promedio-1d')
    if (dim === '2d') setMethod('valor-promedio-2d')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setResult(null)

    try {
      let response
      const basePayload = {
        func_str: input.func_str,
        a: parseFloat(input.a),
        b: parseFloat(input.b),
        N: parseInt(input.N),
        seed: input.seed ? parseInt(input.seed) : undefined,
        precision: parseInt(input.precision)
      }

      switch(method) {
        case 'hit-or-miss-1d':
          response = await monteCarloService.hitOrMiss(basePayload)
          break
        case 'valor-promedio-1d':
          response = await monteCarloService.valorPromedio1d(basePayload)
          break
        case 'convergencia-1d':
          response = await monteCarloService.convergencia1d(basePayload)
          break
        case 'valor-promedio-2d':
          response = await monteCarloService.valorPromedio2d({
            ...basePayload,
            ya: parseFloat(input.ya),
            yb: parseFloat(input.yb)
          })
          break
        case 'estadistico-1d':
          response = await monteCarloService.estadistico({
            ...basePayload,
            M: parseInt(input.M),
            nivel_confianza: parseFloat(input.nivel_confianza)
          })
          break
        default:
          return
      }

      setResult(response.data)
    } catch (error: any) {
      setError(error.response?.data?.detail || String(error))
    } finally {
      setLoading(false)
    }
  }

  const theories: Record<string, any> = {
    'hit-or-miss-1d': {
      nombre: 'Metodo Hit-or-Miss (1D)',
      descripcion: 'Genera puntos aleatorios en un recuadro, cuenta cuantos caen bajo la curva.',
      formula_latex: 'I \\approx \\frac{\\text{Aciertos}}{N} \\times \\text{Area}_{\\text{caja}}',
      condiciones: 'Funciona mejor con funciones acotadas.',
      parametros: ['f(x): Funcion', '[a,b]: Intervalo', 'N: Numero de muestras', 'seed: Reproducibilidad']
    },
    'valor-promedio-1d': {
      nombre: 'Metodo de Valor Promedio (1D)',
      descripcion: 'Estima ∫f(x) = (b-a)*E[f(x)] con muestreo aleatorio uniforme.',
      formula_latex: 'I \\approx (b-a) \\cdot \\frac{1}{N} \\sum_{i=1}^{N} f(x_i)',
      condiciones: 'Superior a hit-or-miss. Usa teorema del valor promedio.',
      parametros: ['f(x): Funcion', '[a,b]: Intervalo', 'N: Muestras', 'seed: Reproducibilidad']
    },
    'convergencia-1d': {
      nombre: 'Analisis de Convergencia (1D)',
      descripcion: 'Monitorea como converge la integral al aumentar N.',
      formula_latex: 'I_N \\approx (b-a) \\cdot \\frac{1}{N} \\sum_{i=1}^{N} f(x_i)',
      condiciones: 'Útil para estudiar mejora con muestras adicionales.',
      parametros: ['f(x): Funcion', '[a,b]: Intervalo', 'N: Total de muestras para convergencia']
    },
    'valor-promedio-2d': {
      nombre: 'Valor Promedio (2D) - Integral Doble',
      descripcion: '∫∫ f(x,y) dxdy ≈ Area * promedio(f(x_i, y_i))',
      formula_latex: 'I \\approx (b-a)(d-c) \\cdot \\frac{1}{N} \\sum_{i=1}^{N} f(x_i, y_i)',
      condiciones: 'Extensión natural a 2 dimensiones. N puntos uniformes en [a,b]×[c,d].',
      parametros: ['f(x,y): Funcion bivariada', '[a,b]: Rango X', '[c,d]: Rango Y', 'N: Muestras']
    },
    'estadistico-1d': {
      nombre: 'Analisis Estadistico (Intervalos de Confianza)',
      descripcion: 'Realiza M replicas independientes para estimar intervalo de confianza.',
      formula_latex: '\\text{IC} = \\bar{I} \\pm z_{\\alpha/2} \\cdot \\frac{\\sigma}{\\sqrt{M}}',
      condiciones: 'Proporciona bounds probabilísticos sobre la integral verdadera.',
      parametros: ['f(x): Funcion', '[a,b]: Intervalo', 'N: Muestras por replica', 'M: Numero de replicas']
    }
  }

  const methods_by_dimension: Record<string, Array<[string, string]>> = {
    '1d': [
      ['valor-promedio-1d', 'Valor Promedio 1D'],
      ['hit-or-miss-1d', 'Hit-or-Miss 1D'],
      ['convergencia-1d', 'Convergencia 1D']
    ],
    '1d-stat': [
      ['estadistico-1d', 'Analisis Estadistico 1D']
    ],
    '2d': [
      ['valor-promedio-2d', 'Valor Promedio 2D']
    ]
  }

  const theory = theories[method]

  return (
    <div className="method-page">
      <h1>Simulacion Monte Carlo</h1>

      <div className="theory-section">
        <h3>Teoria: {theory.nombre}</h3>
        <p><strong>Descripcion:</strong> {theory.descripcion}</p>
        
        <FormulaDisplay formula={theory.formula_latex} title="Formula:" />
        
        <p><strong>Condiciones:</strong> {theory.condiciones}</p>
        <p><strong>Parametros:</strong></p>
        <ul>
          {theory.parametros.map((p: string, i: number) => <li key={i}>{p}</li>)}
        </ul>
      </div>

      <div className="method-container">
        <div className="form-section">
          <h2>Parametros</h2>

          <div className="dimension-selector">
            <label>Dimensionalidad:</label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                onClick={() => handleDimensionChange('1d')}
                style={{
                  padding: '8px 16px',
                  background: dimension === '1d' ? '#000080' : '#c0c0c0',
                  color: dimension === '1d' ? 'white' : 'black',
                  border: '2px outset #dfdfdf',
                  cursor: 'pointer'
                }}
              >
                1D
              </button>
              <button 
                onClick={() => handleDimensionChange('2d')}
                style={{
                  padding: '8px 16px',
                  background: dimension === '2d' ? '#000080' : '#c0c0c0',
                  color: dimension === '2d' ? 'white' : 'black',
                  border: '2px outset #dfdfdf',
                  cursor: 'pointer'
                }}
              >
                2D
              </button>
            </div>
          </div>

          <div className="method-selector">
            <label>Metodo:</label>
            <select value={method} onChange={(e) => setMethod(e.target.value)}>
              {dimension === '1d' && methods_by_dimension['1d'].map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
              {dimension === '1d' && methods_by_dimension['1d-stat'].map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
              {dimension === '2d' && methods_by_dimension['2d'].map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>
          </div>

          <form onSubmit={handleSubmit} className="param-form">
            <div className="form-group">
              <label>f({dimension === '2d' ? 'x,y' : 'x'}):</label>
              <input
                type="text"
                value={input.func_str}
                onChange={(e) => setInput({...input, func_str: e.target.value})}
              />
              <small>Ej: {dimension === '2d' ? 'x*y o x**2 + y**2' : 'x**2 o sin(x) o exp(-x)'}</small>
            </div>

            <div className="form-group">
              <label>a (limite inferior X):</label>
              <input type="number" step="0.1" value={input.a} onChange={(e) => setInput({...input, a: e.target.value})} />
            </div>

            <div className="form-group">
              <label>b (limite superior X):</label>
              <input type="number" step="0.1" value={input.b} onChange={(e) => setInput({...input, b: e.target.value})} />
            </div>

            {dimension === '2d' && (
              <>
                <div className="form-group">
                  <label>c (limite inferior Y):</label>
                  <input type="number" step="0.1" value={input.ya} onChange={(e) => setInput({...input, ya: e.target.value})} />
                </div>

                <div className="form-group">
                  <label>d (limite superior Y):</label>
                  <input type="number" step="0.1" value={input.yb} onChange={(e) => setInput({...input, yb: e.target.value})} />
                </div>
              </>
            )}

            <div className="form-group">
              <label>N (numero de muestras):</label>
              <input type="number" min="1000" step="1000" value={input.N} onChange={(e) => setInput({...input, N: e.target.value})} />
            </div>

            {method === 'estadistico-1d' && (
              <>
                <div className="form-group">
                  <label>M (replicas independientes):</label>
                  <input type="number" min="10" value={input.M} onChange={(e) => setInput({...input, M: e.target.value})} />
                </div>

                <div className="form-group">
                  <label>Nivel de confianza:</label>
                  <input type="number" min="0.8" max="0.99" step="0.01" value={input.nivel_confianza} onChange={(e) => setInput({...input, nivel_confianza: e.target.value})} />
                </div>
              </>
            )}

            <div className="form-group">
              <label>Seed (opcional):</label>
              <input type="number" value={input.seed} onChange={(e) => setInput({...input, seed: e.target.value})} />
              <small>Para reproducibilidad</small>
            </div>

            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? 'Simulando...' : 'Ejecutar Simulacion'}
            </button>
          </form>
        </div>

        <div className="result-section">
          <h2>Resultados</h2>
          {error && <div className="error-box">Error: {error}</div>}

          {result && !error && (
            <>
              <div className="result-box">
                <strong>Integral estimada: {result.integral || result.promedio || result.media}</strong>
              </div>

              {result.historial && (
                <div>
                  <IterationsTable 
                    iterations={result.historial}
                    title="Historial de Convergencia"
                  />
                </div>
              )}

              {result.desv_estandar && (
                <div className="result-box">
                  <p>Desv. Estandar: {result.desv_estandar}</p>
                  {result.error_std && <p>Error std: {result.error_std}</p>}
                  {result.puntos_validos && <p>Puntos validos: {result.puntos_validos}</p>}
                </div>
              )}

              {result.ic_inf && result.ic_sup && (
                <div className="result-box">
                  <p><strong>Intervalo de Confianza ({(parseFloat(input.nivel_confianza)*100).toFixed(0)}%):</strong></p>
                  <p>[{result.ic_inf}, {result.ic_sup}]</p>
                </div>
              )}

              <div className="result-box">
                <p>Metodo: {result.metodo}</p>
                <p>Muestras: {result.N || result.num_replicas}</p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}