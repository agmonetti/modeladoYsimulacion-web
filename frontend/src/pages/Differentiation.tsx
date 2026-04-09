import { useState } from 'react'
import { differentiationService } from '../services/api'
import PlotlyGraph from '../components/PlotlyGraph'
import FormulaDisplay from '../components/FormulaDisplay'
import '../styles/Method.css'

export default function Differentiation() {
  const [input, setInput] = useState({
    func_str: 'sin(x)',
    x_val: 'pi/4', // Ejemplificamos con texto matemático por defecto
    h: '1e-5',
    compare_exact: true,
    precision: '8'
  })
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // SÚPER TRADUCTOR MATEMÁTICO (Convierte pi/4 -> 0.785...)
  const parseMathExpr = (expr: string): number => {
    if (!expr || expr.trim() === '') return NaN;
    try {
      const safeExpr = expr
        .replace(/\bpi\b/gi, 'Math.PI')
        .replace(/\be\b/gi, 'Math.E')
        .replace(/\^/g, '**');
      const res = new Function(`return ${safeExpr}`)();
      return Number(res);
    } catch {
      return NaN;
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setResult(null)

    try {
      // Parseamos los textos a números reales
      const x_val_parsed = parseMathExpr(input.x_val);
      const h_parsed = parseMathExpr(input.h);

      if (isNaN(x_val_parsed) || isNaN(h_parsed)) {
        throw new Error("El punto x o el paso h contienen expresiones inválidas (ej. use pi/4 o 1/3)");
      }

      const payload = {
        func_str: input.func_str,
        x_val: x_val_parsed,
        h: h_parsed,
        precision: parseInt(input.precision),
        compare_exact: input.compare_exact
      }

      const response = await differentiationService.diferenciasFinitas(payload)
      setResult(response.data)
    } catch (error: any) {
      setError(error.message || error.response?.data?.detail || String(error))
    } finally {
      setLoading(false)
    }
  }

  const generateDerivativePlot = () => {
    try {
      const x_val = parseMathExpr(input.x_val)
      if (isNaN(x_val)) return [];

      const func_str = input.func_str.replace(/sen/gi, 'sin')

      // Traductor para que JS pueda graficar sin problemas
      const jsFuncStr = func_str
        .replace(/\^/g, '**')
        .replace(/\bsin\(/g, 'Math.sin(')
        .replace(/\bcos\(/g, 'Math.cos(')
        .replace(/\btan\(/g, 'Math.tan(')
        .replace(/\bexp\(/g, 'Math.exp(')
        .replace(/\blog\(/g, 'Math.log(')
        .replace(/\bsqrt\(/g, 'Math.sqrt(')
        .replace(/\bpi\b/g, 'Math.PI')
        .replace(/\be\b/g, 'Math.E');

      const func = new Function('x', `return ${jsFuncStr}`)

      // Generar puntos alrededor de x_val
      const range = 2
      const x = Array.from({ length: 200 }, (_, i) => x_val - range + (i / 200) * (2 * range))
      const y = x.map(xi => {
        try {
          return func(xi)
        } catch {
          return NaN
        }
      })

      // Marker en el punto de derivada
      return [{
        x,
        y,
        type: 'scatter',
        name: 'f(x)',
        line: { color: '#000080' }
      },
      {
        x: [x_val],
        y: [func(x_val)],
        type: 'scatter',
        name: 'Punto x',
        mode: 'markers',
        marker: { size: 10, color: '#ff0000' }
      }]
    } catch {
      return []
    }
  }

  const theory = {
    nombre: 'Diferencias Finitas',
    descripcion: 'Aproxima derivadas usando coeficientes de Taylor sin calcular la derivada analítica.',
    formula_1: "f'(x) \\approx \\frac{f(x+h) - f(x-h)}{2h} \\quad O(h^2)",
    formula_2: "f''(x) \\approx \\frac{f(x+h) - 2f(x) + f(x-h)}{h^2} \\quad O(h^2)",
    condiciones: 'h debe ser suficientemente pequeño pero no demasiado. Precisión limitada por aritmética de punto flotante.',
    parametros: ['f(x): Función', 'x: Punto donde calcular', 'h: Tamaño del paso', 'compare_exact: Comparar con derivada analítica']
  }

  return (
    <div className="method-page">
      <h1>Derivacion Numerica</h1>

      <div className="theory-section">
        <h3>Teoria: {theory.nombre}</h3>
        <p><strong>Descripcion:</strong> {theory.descripcion}</p>
        
        <FormulaDisplay formula={theory.formula_1} title="Primera Derivada (Central):" />
        <FormulaDisplay formula={theory.formula_2} title="Segunda Derivada:" />
        
        <p><strong>Condiciones:</strong> {theory.condiciones}</p>
        <p><strong>Parametros:</strong></p>
        <ul>
          {theory.parametros.map((p: string, i: number) => <li key={i}>{p}</li>)}
        </ul>
      </div>

      <div className="method-container">
        <div className="form-section">
          <h2>Parametros</h2>

          <form onSubmit={handleSubmit} className="param-form">
            <div className="form-group">
              <label>f(x):</label>
              <input
                type="text"
                value={input.func_str}
                onChange={(e) => setInput({...input, func_str: e.target.value})}
              />
              <small>Ej: sin(x) o x**2 o exp(x)</small>
            </div>

            <div className="form-group">
              <label>Punto x:</label>
              {/* CAMBIADO de type="number" a type="text" para aceptar fracciones y constantes */}
              <input
                type="text"
                value={input.x_val}
                onChange={(e) => setInput({...input, x_val: e.target.value})}
              />
              <small>Ej: pi/4, 1/3, 0.5</small>
            </div>

            <div className="form-group">
              <label>Paso h:</label>
              {/* CAMBIADO de type="number" a type="text" */}
              <input
                type="text"
                value={input.h}
                onChange={(e) => setInput({...input, h: e.target.value})}
              />
              <small>Ej: 1e-5 o 0.001 - controla precision</small>
            </div>

            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  checked={input.compare_exact}
                  onChange={(e) => setInput({...input, compare_exact: e.target.checked})}
                />
                Comparar con derivada exacta (simbolica)
              </label>
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
              {loading ? 'Calculando...' : 'Calcular Derivadas'}
            </button>
          </form>
        </div>

        <div className="result-section">
          <h2>Resultados</h2>
          {error && <div className="error-box">Error: {error}</div>}

          {result && !error && (
            <>
              <PlotlyGraph 
                data={generateDerivativePlot()}
                title={`f(x) = ${input.func_str} en x = ${input.x_val}`}
              />

              <div className="result-box">
                <h3>Primera Derivada</h3>
                <p><strong>Numerica:</strong> {result.primera_derivada.aproximada}</p>
                {input.compare_exact && result.primera_derivada.exacta !== undefined && (
                  <>
                    <p><strong>Exacta:</strong> {result.primera_derivada.exacta}</p>
                    <p><strong>Error:</strong> {result.primera_derivada.error}</p>
                  </>
                )}
                <small>Formula: {result.primera_derivada.formula_numerica}</small>
              </div>

              <div className="result-box">
                <h3>Segunda Derivada</h3>
                <p><strong>Numerica:</strong> {result.segunda_derivada.aproximada}</p>
                {input.compare_exact && result.segunda_derivada.exacta !== undefined && (
                  <>
                    <p><strong>Exacta:</strong> {result.segunda_derivada.exacta}</p>
                    <p><strong>Error:</strong> {result.segunda_derivada.error}</p>
                  </>
                )}
                <small>Formula: {result.segunda_derivada.formula_numerica}</small>
              </div>

              <div className="result-box">
                <p>Punto numérico evaluado: x = {result.x}</p>
                <p>Paso: h = {result.h}</p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}