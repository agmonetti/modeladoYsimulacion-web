import { useState, useMemo } from 'react'
import PlotlyGraph from '../components/PlotlyGraph'
import FormulaDisplay from '../components/FormulaDisplay'
import '../styles/Method.css'

type SystemParams = {
  dx_dt: string
  dy_dt: string
  x_min: number | string
  x_max: number | string
  y_min: number | string
  y_max: number | string
  auto_trajectories: boolean
}

type SolveResponse = {
  formulas: {
    dx_dt: string
    dy_dt: string
  }
  parameters: {
    x_min: number
    x_max: number
    y_min: number
    y_max: number
    t0: number
    t_fin: number
    h: number
  }
  vector_field: {
    x: number[]
    y: number[]
    u: number[]
    v: number[]
  }
  trajectories: Array<{
    x: number[]
    y: number[]
    color: string
  }>
  equilibrium: {
    x: number | null
    y: number | null
  }
}

const defaultParams: SystemParams = {
  dx_dt: '-y',
  dy_dt: 'x',
  x_min: -3,
  x_max: 3,
  y_min: -3,
  y_max: 3,
  auto_trajectories: true,
}

const exampleSystems: Record<string, Partial<SystemParams>> = {
  lotka_volterra: { dx_dt: 'x - x*y', dy_dt: '-y + x*y', x_min: 0, x_max: 3, y_min: 0, y_max: 3 },
  van_der_pol: { dx_dt: 'y', dy_dt: '(1 - x**2)*y - x', x_min: -3, x_max: 3, y_min: -3, y_max: 3 },
  centro: { dx_dt: '-y', dy_dt: 'x', x_min: -3, x_max: 3, y_min: -3, y_max: 3 },
  silla: { dx_dt: 'x', dy_dt: '-y', x_min: -3, x_max: 3, y_min: -3, y_max: 3 },
  nodo_estable: { dx_dt: '-x', dy_dt: '-y', x_min: -3, x_max: 3, y_min: -3, y_max: 3 },
  foco_inestable: { dx_dt: 'x - 2*y', dy_dt: 'x + y', x_min: -2, x_max: 2, y_min: -2, y_max: 2 },
}

export default function Dynamic2D() {
  const [params, setParams] = useState<SystemParams>(defaultParams)
  const [resultado, setResultado] = useState<SolveResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showTheory, setShowTheory] = useState(false)

  const handleParamChange = (key: keyof SystemParams, value: any) => {
    setParams({ ...params, [key]: value })
    setError('')
  }

  const handleLoadExample = (exampleKey: string) => {
    const example = exampleSystems[exampleKey]
    if (example) {
      setParams({ ...params, ...example } as SystemParams)
      setError('')
    }
  }

  const handleSolve = async () => {
    setLoading(true)
    setError('')
    try {
      // Convertir parámetros a números
      const payload = {
        ...params,
        x_min: parseFloat(String(params.x_min)),
        x_max: parseFloat(String(params.x_max)),
        y_min: parseFloat(String(params.y_min)),
        y_max: parseFloat(String(params.y_max)),
      }
      
      if (isNaN(payload.x_min) || isNaN(payload.x_max) || isNaN(payload.y_min) || isNaN(payload.y_max)) {
        setError('Los parámetros de visualización deben ser números válidos')
        setLoading(false)
        return
      }
      
      const { dynamic2DFormulaService } = await import('../services/api')
      const res = await dynamic2DFormulaService.solve(payload)
      setResultado(res)
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Error al resolver el sistema')
    } finally {
      setLoading(false)
    }
  }

  const phasePlot = useMemo(() => {
    if (!resultado) return null
    const { vector_field, trajectories, equilibrium } = resultado
    const traces: any[] = []

    // Campo vectorial
    traces.push({
      x: vector_field.x,
      y: vector_field.y,
      mode: 'markers',
      type: 'scatter',
      marker: { size: 3, color: 'rgba(100, 150, 200, 0.4)' },
      name: 'Campo',
      hoverinfo: 'skip',
    })

    // Trayectorias
    trajectories.forEach((traj, idx) => {
      traces.push({
        x: traj.x,
        y: traj.y,
        mode: 'lines',
        type: 'scatter',
        name: `Trayectoria ${idx + 1}`,
        line: { color: traj.color, width: 1.5 },
      })
    })

    // Equilibrio
    if (equilibrium.x !== null && equilibrium.y !== null) {
      traces.push({
        x: [equilibrium.x],
        y: [equilibrium.y],
        mode: 'markers',
        type: 'scatter',
        marker: { size: 12, color: 'red', symbol: 'x' },
        name: 'Equilibrio',
      })
    }

    return {
      data: traces,
      layout: {
        title: 'Diagrama de Fase',
        xaxis: { title: 'x' },
        yaxis: { title: 'y' },
        hovermode: 'closest',
      },
    }
  }, [resultado])

  const timePlot = useMemo(() => {
    if (!resultado || resultado.trajectories.length === 0) return null
    const traces = resultado.trajectories.map((traj, idx) => ({
      x: Array.from({ length: traj.x.length }, (_, i) => i * resultado.parameters.h),
      y: traj.x,
      mode: 'lines',
      type: 'scatter',
      name: `x(t) - Tray. ${idx + 1}`,
    }))
    return {
      data: traces,
      layout: {
        title: 'Evolución en el tiempo: x(t)',
        xaxis: { title: 't' },
        yaxis: { title: 'x(t)' },
      },
    }
  }, [resultado])

  const systemGeneralLatex = `\\begin{cases} \\dot{x} = f(x,y) \\\\ \\dot{y} = g(x,y) \\end{cases}`

  return (
    <div className="method-page">
      <h1>Sistemas Dinámicos 2D Lineales Homogéneos</h1>

      <div className="theory-section">
        <h3>Teoría: Sistema Lineal 2D Autónomo Homogéneo</h3>
        <p>
          <strong>Forma General:</strong>
        </p>
        <FormulaDisplay formula={systemGeneralLatex} title="" />
        <p>
          donde a, b, c, d son constantes reales. En forma matricial: <strong>Ẋ = AX</strong> con <strong>A = [a, b; c, d]</strong> y <strong>X = [x, y]<sup>T</sup></strong>
        </p>

        <button
          onClick={() => setShowTheory(!showTheory)}
          style={{
            marginTop: '12px',
            padding: '4px 12px',
            backgroundColor: '#c0c0c0',
            border: '2px solid',
            borderColor: showTheory ? '#808080 #dfdfdf #dfdfdf #808080' : '#dfdfdf #808080 #808080 #dfdfdf',
            color: '#000',
            fontWeight: 'bold',
            fontSize: '12px',
            cursor: 'pointer',
            fontFamily: 'MS Sans Serif, Arial',
            userSelect: 'none',
          }}
        >
          {showTheory ? '▼' : '►'} Detalles teóricos (Polinomio, Invariantes, Clasificación, Soluciones)
        </button>

        {showTheory && (
          <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #999' }}>
            <p style={{ marginTop: '12px' }}>
              <strong>Polinomio Característico:</strong>
            </p>
            <p style={{ fontSize: '12px', marginLeft: '12px' }}>
              det(A - λI) = 0, donde λ son los autovalores
            </p>
            <p style={{ fontSize: '12px', marginLeft: '12px', marginTop: '4px' }}>
              (a-λ)(d-λ) - bc = 0 → λ² - (a+d)λ + (ad-bc) = 0
            </p>

            <p style={{ marginTop: '12px' }}>
              <strong>Invariantes del Sistema:</strong>
            </p>
            <ul style={{ margin: '8px 0', paddingLeft: '20px', fontSize: '12px' }}>
              <li><strong>Traza (τ) = a + d:</strong> suma de diagonal. τ &lt; 0 → sistema estable; τ &gt; 0 → inestable</li>
              <li><strong>Determinante (ρ) = ad - bc:</strong> determina tipo de equilibrio</li>
              <li><strong>Discriminante (Δ) = τ² - 4ρ:</strong> determina si λ son reales o complejos</li>
            </ul>

            <p style={{ marginTop: '12px' }}>
              <strong>Autovalores y Autovectores:</strong>
            </p>
            <p style={{ fontSize: '12px', marginLeft: '12px' }}>
              Los autovalores λ representan <strong>qué tanto crece/decrece</strong> el sistema en ciertas direcciones. Los autovectores v indican esas <strong>direcciones principales</strong> de comportamiento.
            </p>

            <p style={{ marginTop: '12px' }}>
              <strong style={{ color: '#000080' }}>Dos Soluciones Analíticas Distintas:</strong>
            </p>
            <ul style={{ margin: '8px 0', paddingLeft: '20px', fontSize: '12px', lineHeight: '1.8' }}>
              <li><strong>Si λ₁, λ₂ son números REALES (Δ ≥ 0):</strong>
                <div style={{ marginLeft: '12px', marginTop: '4px', fontFamily: 'monospace', fontSize: '11px' }}>
                  X(t) = c₁e^(λ₁t)v₁ + c₂e^(λ₂t)v₂
                </div>
                <div style={{ marginLeft: '12px', fontSize: '11px', marginTop: '2px', color: '#666' }}>Suma de dos exponenciales con direcciones v₁ y v₂</div>
              </li>
              <li style={{ marginTop: '6px' }}><strong>Si λ = α ± βi son números COMPLEJOS (Δ &lt; 0):</strong>
                <div style={{ marginLeft: '12px', marginTop: '4px', fontFamily: 'monospace', fontSize: '11px' }}>
                  X(t) = e^(αt)[c₁(a cos(βt) - b sin(βt)) + c₂(a sin(βt) + b cos(βt))]
                </div>
                <div style={{ marginLeft: '12px', fontSize: '11px', marginTop: '2px', color: '#666' }}>Oscilación con envolvente exponencial (espiral o centro)</div>
              </li>
            </ul>

            <p style={{ marginTop: '12px' }}>
              <strong>Clasificación por Autovalores:</strong>
            </p>
            <ul style={{ margin: '8px 0', paddingLeft: '20px', fontSize: '12px', lineHeight: '1.6' }}>
              <li><strong>Nodo Estable:</strong> λ₁, λ₂ reales, distintos, ambos &lt; 0. Todas las trayectorias convergen al equilibrio.</li>
              <li><strong>Nodo Inestable:</strong> λ₁, λ₂ reales, distintos, ambos &gt; 0. Todas las trayectorias divergen del equilibrio.</li>
              <li><strong>Punto Silla:</strong> λ₁, λ₂ reales, con signos opuestos (ρ &lt; 0). Por una dirección se acerca, por la otra se aleja.</li>
              <li><strong>Nodo Degenerado:</strong> λ₁ = λ₂ (autovalor repetido). Puede haber una o dos direcciones principales.</li>
              <li><strong>Foco Estable:</strong> λ = α ± βi con α &lt; 0. Las trayectorias giran en espiral hacia el equilibrio.</li>
              <li><strong>Foco Inestable:</strong> λ = α ± βi con α &gt; 0. Las trayectorias giran en espiral lejos del equilibrio.</li>
              <li><strong>Centro:</strong> λ = ±βi (α = 0, parte real nula). Las trayectorias son órbitas cerradas, ni estable ni inestable.</li>
            </ul>

            <p style={{ marginTop: '12px' }}>
              <strong>Herramientas de Visualización:</strong>
            </p>
            <ul style={{ margin: '8px 0', paddingLeft: '20px', fontSize: '12px' }}>
              <li><strong>Nullclines:</strong> rectas donde dx/dt=0 (verde) y dy/dt=0 (naranja). El equilibrio es su intersección.</li>
              <li><strong>Campo Vectorial:</strong> flechas que muestran la dirección de movimiento en cada punto.</li>
              <li><strong>Autovectores (reales):</strong> direcciones principales del sistema (en rojo si existen reales).</li>
              <li><strong>Trayectorias:</strong> soluciones desde diferentes condiciones iniciales.</li>
            </ul>
          </div>
        )}
      </div>

      <div className="method-container">
        <div className="form-section">
          <h2>Parámetros del Sistema: Fórmulas Personalizadas</h2>
          <p style={{ fontSize: '11px', color: '#666', marginBottom: '8px' }}>
            Ingresa expresiones matemáticas para dx/dt = f(x,y) y dy/dt = g(x,y). 
            Usa <code>*</code> para multiplicación, <code>**</code> para potencias, y paréntesis según necesites.
          </p>

          <div className="method-selector">
            <label><strong>Ejemplos predefinidos:</strong></label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px' }}>
              {Object.entries(exampleSystems).map(([key, example]) => (
                <button
                  key={key}
                  className="btn-primary"
                  onClick={() => handleLoadExample(key)}
                  style={{ fontSize: '11px', padding: '6px' }}
                  title={`dx/dt = ${example.dx_dt}, dy/dt = ${example.dy_dt}`}
                >
                  {key.replace(/_/g, ' ')}
                </button>
              ))}
            </div>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleSolve()
            }}
            className="param-form"
          >
            {/* Fórmulas */}
            <div className="form-group" style={{ marginBottom: '12px' }}>
              <label><strong>dx/dt =</strong></label>
              <input
                type="text"
                value={params.dx_dt}
                onChange={(e) => handleParamChange('dx_dt', e.target.value)}
                placeholder="Ej: x - y"
                style={{
                  width: '100%',
                  padding: '6px',
                  fontSize: '12px',
                  border: '1px solid #999',
                  fontFamily: 'monospace',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div className="form-group" style={{ marginBottom: '12px' }}>
              <label><strong>dy/dt =</strong></label>
              <input
                type="text"
                value={params.dy_dt}
                onChange={(e) => handleParamChange('dy_dt', e.target.value)}
                placeholder="Ej: x + y"
                style={{
                  width: '100%',
                  padding: '6px',
                  fontSize: '12px',
                  border: '1px solid #999',
                  fontFamily: 'monospace',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Parámetros de Visualización */}
            <div style={{ marginTop: '12px', paddingTop: '8px', borderTop: '1px solid #999' }}>
              <p style={{ fontWeight: 'bold', marginBottom: '6px' }}>Parámetros Útiles para Graficar:</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div className="form-group">
                  <label>x_min:</label>
                  <input
                    type="text"
                    value={params.x_min}
                    onChange={(e) => handleParamChange('x_min', e.target.value)}
                    placeholder="-5"
                  />
                </div>
                <div className="form-group">
                  <label>x_max:</label>
                  <input
                    type="text"
                    value={params.x_max}
                    onChange={(e) => handleParamChange('x_max', e.target.value)}
                    placeholder="5"
                  />
                </div>
                <div className="form-group">
                  <label>y_min:</label>
                  <input
                    type="text"
                    value={params.y_min}
                    onChange={(e) => handleParamChange('y_min', e.target.value)}
                    placeholder="-5"
                  />
                </div>
                <div className="form-group">
                  <label>y_max:</label>
                  <input
                    type="text"
                    value={params.y_max}
                    onChange={(e) => handleParamChange('y_max', e.target.value)}
                    placeholder="5"
                  />
                </div>
              </div>
            </div>

            {/* Checkbox */}
            <div style={{ marginTop: '12px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  checked={params.auto_trajectories}
                  onChange={(e) => handleParamChange('auto_trajectories', e.target.checked)}
                />
                <span>Generar trayectorias automáticas</span>
              </label>
            </div>

            <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: '12px', width: '100%' }}>
              {loading ? 'Resolviendo...' : 'Resolver Sistema'}
            </button>
          </form>

          {error && <div className="error-box" style={{ marginTop: '8px' }}>{error}</div>}

          {resultado && (
            <div className="result-box" style={{ marginTop: '8px' }}>
              <div className="validation-title">Sistema Ingresado</div>
              <div style={{ fontSize: '11px', marginTop: '6px', fontFamily: 'monospace' }}>
                <p>dx/dt = {resultado.formulas.dx_dt}</p>
                <p>dy/dt = {resultado.formulas.dy_dt}</p>
              </div>
              {resultado.equilibrium.x !== null && resultado.equilibrium.y !== null && (
                <div style={{ fontSize: '11px', marginTop: '8px' }}>
                  <p><strong>Punto de equilibrio (aproximado):</strong></p>
                  <p>x* = {resultado.equilibrium.x.toFixed(4)}, y* = {resultado.equilibrium.y.toFixed(4)}</p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="result-section">
          <h2>Resultados</h2>

          {resultado && phasePlot && (
            <div style={{ marginBottom: '12px' }}>
              <PlotlyGraph data={phasePlot.data} layout={phasePlot.layout} title={phasePlot.layout.title} />
            </div>
          )}

          {resultado && timePlot && (
            <div style={{ marginBottom: '12px' }}>
              <PlotlyGraph data={timePlot.data} layout={timePlot.layout} title={timePlot.layout.title} />
            </div>
          )}

          {!resultado && !loading && (
            <div className="result-box">
              <p style={{ textAlign: 'center', color: '#666', margin: '20px 0' }}>
                Carga un ejemplo o ingresa tus propias fórmulas y haz clic en "Resolver Sistema"
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
