import { useState } from 'react'
import { rootFindingService } from '../services/api'
import PlotlyGraph from '../components/PlotlyGraph'
import IterationsTable from '../components/IterationsTable'
import FormulaDisplay from '../components/FormulaDisplay'
import '../styles/Method.css'

export default function RootFinding() {
  const [method, setMethod] = useState('biseccion')
  const [input, setInput] = useState({
    func_str: 'x**2 - 2',
    g_str: 'sqrt(2)',
    a: '-2',
    b: '2',
    x0: '1',
    tol: '1e-6',
    max_iter: '100'
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
        g_str: input.g_str,
        a: input.a ? parseFloat(input.a) : undefined,
        b: input.b ? parseFloat(input.b) : undefined,
        x0: parseFloat(input.x0),
        tol: parseFloat(input.tol),
        max_iter: parseInt(input.max_iter)
      }

      switch(method) {
        case 'biseccion':
          response = await rootFindingService.biseccion(basePayload)
          break
        case 'punto-fijo':
          response = await rootFindingService.puntoFijo(basePayload)
          break
        case 'newton-raphson':
          response = await rootFindingService.newtonRaphson(basePayload)
          break
        case 'aitken':
          response = await rootFindingService.aitken(basePayload)
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
        line: { color: '#000080' }
      }]
    } catch {
      return []
    }
  }

  const theories: Record<string, any> = {
    biseccion: {
      nombre: 'Metodo de Biseccion',
      descripcion: 'Encuentra una raiz dividiendo el intervalo a la mitad iterativamente.',
      formula_latex: 'x_n = \\frac{a + b}{2}',
      condiciones: 'Requiere f(a) * f(b) < 0 (signos opuestos)',
      parametros: ['f(x): Funcion continua', 'a, b: Intervalo [a,b]', 'tolerancia: Precision requerida', 'max_iter: Iteraciones maximas']
    },
    'punto-fijo': {
      nombre: 'Metodo de Punto Fijo',
      descripcion: 'Resuelve x = g(x) iterativamente: x_n+1 = g(x_n)',
      formula_latex: 'x_{n+1} = g(x_n)',
      condiciones: '|g\'(x)| < 1 en el intervalo de convergencia',
      parametros: ['g(x): Funcion iterada', 'x0: Valor inicial', 'tolerancia', 'max_iter']
    },
    'newton-raphson': {
      nombre: 'Metodo de Newton-Raphson',
      descripcion: 'Metodo de segundo orden usando derivada: x_n+1 = x_n - f(x_n)/f\'(x_n)',
      formula_latex: 'x_{n+1} = x_n - \\frac{f(x_n)}{f\'(x_n)}',
      condiciones: 'f\'(x) != 0 en la vecindad de la raiz',
      parametros: ['f(x): Funcion', 'x0: Valor inicial', 'tolerancia', 'max_iter']
    },
    aitken: {
      nombre: 'Aceleracion de Aitken (Delta-squared)',
      descripcion: 'Acelera la convergencia del punto fijo usando: x_n+1 = x_n - (Δx_n)² / Δ²x_n',
      formula_latex: '\\Delta^2 x = (x_{n+2} - 2x_{n+1} + x_n)',
      condiciones: 'Aplicable sobre punto fijo convergente',
      parametros: ['g(x): Funcion iterada', 'x0: Valor inicial', 'tolerancia', 'max_iter']
    }
  }

  const theory = theories[method]

  return (
    <div className="method-page">
      <h1>Busqueda de Raices</h1>

      <div className="theory-section">
        <h3>Teoria: {theory.nombre}</h3>
        <p><strong>Descripcion:</strong> {theory.descripcion}</p>
        
        <FormulaDisplay formula={theory.formula_latex} title="Formula:" />
        
        <p><strong>Condiciones:</strong> {theory.condiciones}</p>
        <p><strong>Parametros requeridos:</strong></p>
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
              <option value="biseccion">Biseccion</option>
              <option value="punto-fijo">Punto Fijo</option>
              <option value="newton-raphson">Newton-Raphson</option>
              <option value="aitken">Aitken (Acelerado)</option>
            </select>
          </div>

          <form onSubmit={handleSubmit} className="param-form">
            {(method === 'punto-fijo' || method === 'aitken') && (
              <div className="form-group">
                <label>g(x) [iteracion]:</label>
                <input
                  type="text"
                  value={input.g_str}
                  onChange={(e) => setInput({...input, g_str: e.target.value})}
                />
                <small>Ej: (x + 2/x) / 2 o sqrt(2)</small>
              </div>
            )}

            {(method === 'biseccion' || method === 'newton-raphson') && (
              <div className="form-group">
                <label>f(x):</label>
                <input
                  type="text"
                  value={input.func_str}
                  onChange={(e) => setInput({...input, func_str: e.target.value})}
                />
                <small>Ej: x**2 - 2 o sin(x) - x/2</small>
              </div>
            )}

            {method === 'biseccion' && (
              <>
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
              </>
            )}

            {(method !== 'biseccion') && (
              <div className="form-group">
                <label>x0 (valor inicial):</label>
                <input
                  type="number"
                  step="0.01"
                  value={input.x0}
                  onChange={(e) => setInput({...input, x0: e.target.value})}
                />
              </div>
            )}

            <div className="form-group">
              <label>Tolerancia (epsilon):</label>
              <input
                type="text"
                value={input.tol}
                onChange={(e) => setInput({...input, tol: e.target.value})}
              />
              <small>Ej: 1e-6 o 0.0001</small>
            </div>

            <div className="form-group">
              <label>Max iteraciones:</label>
              <input
                type="number"
                value={input.max_iter}
                onChange={(e) => setInput({...input, max_iter: e.target.value})}
              />
            </div>

            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? 'Calculando...' : 'Calcular'}
            </button>
          </form>
        </div>

        <div className="result-section">
          <h2>Resultados</h2>
          {error && <div className="error-box">Error: {error}</div>}

          {result && !error && (
            <>
              <div className="result-box">
                <strong>Raiz encontrada:</strong> {(result.raiz || result.root)?.toFixed(8)}
              </div>

              {method === 'biseccion' && (
                <PlotlyGraph 
                  data={generateFunctionPlot()}
                  title={`f(x) = ${input.func_str}`}
                />
              )}

              {(result.iteraciones || result.iterations) && (
                <IterationsTable 
                  iterations={result.iteraciones || result.iterations}
                  title="Historial de Iteraciones"
                />
              )}

              <div className="result-box">
                <p>Iter. totales: {result.num_iter}</p>
                <p>Convergencia: {result.convergencia ? 'SI' : 'NO'}</p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
