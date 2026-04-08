import { useState } from 'react'
import { integrationService } from '../services/api'
import PlotlyGraph from '../components/PlotlyGraph'
import IterationsTable from '../components/IterationsTable'
import FormulaDisplay from '../components/FormulaDisplay'
import '../styles/Method.css'

export default function Integration() {
  const [method, setMethod] = useState('trapecio')
  const [input, setInput] = useState({
    func_str: 'x**2',
    a: '0',
    b: '1',
    n: '10',
    precision: '8'
  })
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

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
        n: parseInt(input.n),
        precision: parseInt(input.precision)
      }

      switch(method) {
        case 'trapecio':
          response = await integrationService.trapecio(basePayload)
          break
        case 'rectangulo':
          response = await integrationService.rectangulo(basePayload)
          break
        case 'simpson-13':
          response = await integrationService.simpson13(basePayload)
          break
        case 'simpson-38':
          response = await integrationService.simpson38(basePayload)
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

  const generateFunctionPlot = () => {
    try {
      const a = parseFloat(input.a)
      const b = parseFloat(input.b)
      const funcStr = input.func_str

      const func = new Function('x', `return ${funcStr.replace(/\^/g, '**')}`)

      const x = Array.from({ length: 200 }, (_, i) => a + (i / 200) * (b - a))
      const y = x.map(xi => {
        try {
          return func(xi)
        } catch {
          return NaN
        }
      })

      return [{
        x,
        y,
        type: 'scatter',
        name: 'f(x)',
        line: { color: '#000080' },
        fill: 'tozeroy',
        fillcolor: 'rgba(0,0,128,0.1)'
      }]
    } catch {
      return []
    }
  }

  const theories: Record<string, any> = {
    trapecio: {
      nombre: 'Regla del Trapecio Compuesta',
      descripcion: 'Aproxima el area bajo la curva dividiendo el intervalo en n trapecios.',
      formula_latex: 'I \\approx \\frac{h}{2} \\left[f(a) + 2\\sum_{i=1}^{n-1} f(x_i) + f(b)\\right], \\quad h = \\frac{b-a}{n}',
      condiciones: 'Aplicable a funciones continuas. Precision O(h²).',
      parametros: ['f(x): Funcion', '[a,b]: Intervalo de integracion', 'n: Numero de subintervalos', 'precision: Decimales']
    },
    rectangulo: {
      nombre: 'Regla del Rectangulo (Punto Medio) Compuesta',
      descripcion: 'Usa rectangulos con altura del punto medio de cada subintervalo.',
      formula_latex: 'I \\approx h \\sum_{i=0}^{n-1} f\\left(\\frac{x_i + x_{i+1}}{2}\\right), \\quad h = \\frac{b-a}{n}',
      condiciones: 'Mejor precision que trapecio para funciones suaves. O(h²).',
      parametros: ['f(x): Funcion', '[a,b]: Intervalo', 'n: Subintervalos', 'precision: Decimales']
    },
    'simpson-13': {
      nombre: 'Simpson 1/3 Compuesta',
      descripcion: 'Usa polinomios cuadraticos en pares de subintervalos (parabolico).',
      formula_latex: 'I \\approx \\frac{h}{3}\\left[f(x_0) + 4\\sum_\\text{impares} f(x_i) + 2\\sum_\\text{pares} f(x_i) + f(x_n)\\right]',
      condiciones: 'N DEBE SER PAR. Precision O(h⁴) - mucho mas precisa.',
      parametros: ['f(x): Funcion', '[a,b]: Intervalo', 'n: Subintervalos (PAR)', 'precision']
    },
    'simpson-38': {
      nombre: 'Simpson 3/8 Compuesta',
      descripcion: 'Usa polinomios cubicos - agrupa puntos de 3 en 3.',
      formula_latex: 'I \\approx \\frac{3h}{8}\\left[f(x_0) + 3\\sum_\\text{g1,g2} f(x_i) + 2\\sum_\\text{otros} f(x_i) + f(x_n)\\right]',
      condiciones: 'N DEBE SER MULTIPLE DE 3. Precision O(h⁴).',
      parametros: ['f(x): Funcion', '[a,b]: Intervalo', 'n: Subintervalos (mult 3)', 'precision']
    }
  }

  const theory = theories[method]

  return (
    <div className="method-page">
      <h1>Integracion Numerica</h1>

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

          <div className="method-selector">
            <label>Metodo:</label>
            <select value={method} onChange={(e) => setMethod(e.target.value)}>
              <option value="trapecio">Trapecio</option>
              <option value="rectangulo">Rectangulo (Punto Medio)</option>
              <option value="simpson-13">Simpson 1/3</option>
              <option value="simpson-38">Simpson 3/8</option>
            </select>
          </div>

          <form onSubmit={handleSubmit} className="param-form">
            <div className="form-group">
              <label>f(x):</label>
              <input
                type="text"
                value={input.func_str}
                onChange={(e) => setInput({...input, func_str: e.target.value})}
              />
              <small>Ej: x**2 o exp(-x) o sin(x)</small>
            </div>

            <div className="form-group">
              <label>a (limite inferior):</label>
              <input
                type="number"
                step="0.01"
                value={input.a}
                onChange={(e) => setInput({...input, a: e.target.value})}
              />
            </div>

            <div className="form-group">
              <label>b (limite superior):</label>
              <input
                type="number"
                step="0.01"
                value={input.b}
                onChange={(e) => setInput({...input, b: e.target.value})}
              />
            </div>

            <div className="form-group">
              <label>n (subintervalos):</label>
              <input
                type="number"
                min="2"
                step="1"
                value={input.n}
                onChange={(e) => setInput({...input, n: e.target.value})}
              />
              {method === 'simpson-13' && <small>Debe ser PAR</small>}
              {method === 'simpson-38' && <small>Debe ser multiple de 3</small>}
            </div>

            <div className="form-group">
              <label>Decimales (precision):</label>
              <input
                type="number"
                min="1"
                max="15"
                value={input.precision}
                onChange={(e) => setInput({...input, precision: e.target.value})}
              />
            </div>

            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? 'Integrando...' : 'Calcular Integral'}
            </button>
          </form>
        </div>

        <div className="result-section">
          <h2>Resultados</h2>
          {error && <div className="error-box">Error: {error}</div>}

          {result && !error && (
            <>
              <PlotlyGraph 
                data={generateFunctionPlot()}
                title={`∫ ${input.func_str} dx desde ${input.a} hasta ${input.b}`}
              />

              <div className="result-box">
                <strong>Integral ≈ {result.integral}</strong>
                <p>Cota de error: {result.cota_error || 'N/A'}</p>
              </div>

              {result.tabla && (
                <IterationsTable 
                  iterations={result.tabla}
                  title="Tabla de Subintervalos"
                />
              )}

              <div className="result-box">
                <p>Metodo: {result.metodo}</p>
                <p>Subintervalos: {result.n}</p>
                <p>h = (b-a)/n = {((parseFloat(input.b) - parseFloat(input.a)) / parseInt(input.n)).toFixed(8)}</p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
