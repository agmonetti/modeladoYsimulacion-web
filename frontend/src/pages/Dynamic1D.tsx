import React, { useEffect, useMemo, useRef, useState } from 'react'
import PlotlyGraph from '../components/PlotlyGraph'
import FormulaDisplay from '../components/FormulaDisplay'
import MathKeyboard from '../components/MathKeyboard'
import { dynamic1DService } from '../services/api'
import '../styles/Method.css'

type Equilibrium = {
  x: number
  fprime: number | null
  stability: string
}

type PhaseResponse = {
  x: number[]
  fx: number[]
  flow: { x: number; dir: number }[]
}

type TimeResponse = {
  t: number[]
  series: { x0: number; x: number[] }[]
}

type SolveResponse = {
  model: string
  equation: string
  params: Record<string, number>
  equilibria: Equilibrium[]
  phase: PhaseResponse
  time: TimeResponse
}

const modelDefaults: Record<string, any> = {
  custom: {
    func_str: 'x*(1-x)',
    params: {},
    x_min: -1,
    x_max: 3,
    t_max: 10,
    initial_conditions: '-0.5, 0.5, 1.5, 2.5'
  },
  malthus: {
    func_str: 'r*x',
    params: { r: 0.5 },
    x_min: 0,
    x_max: 120,
    t_max: 10,
    initial_conditions: '10, 40, 80'
  },
  verhulst: {
    func_str: 'mu*x*(1 - x/K)',
    params: { mu: 0.5, K: 100, h: 5 },
    x_min: 0,
    x_max: 120,
    t_max: 30,
    initial_conditions: '10, 50, 80'
  },
  newton: {
    func_str: '-k*(x - Ta)',
    params: { k: 0.1155, Ta: 20 },
    x_min: 0,
    x_max: 50,
    t_max: 18,
    initial_conditions: '40, 30'
  }
}

const paramRanges: Record<string, { min: number; max: number; step: number }> = {
  r: { min: 0, max: 2, step: 0.01 },
  mu: { min: 0, max: 2, step: 0.01 },
  K: { min: 1, max: 500, step: 1 },
  h: { min: 0, max: 50, step: 0.5 },
  k: { min: 0.01, max: 1, step: 0.001 },
  Ta: { min: -50, max: 100, step: 0.5 }
}

const parseMathExpr = (expr: string): number => {
  if (!expr || expr.trim() === '') return NaN
  try {
    const safeExpr = expr
      .replace(/\bpi\b/gi, 'Math.PI')
      .replace(/\be\b/gi, 'Math.E')
      .replace(/\^/g, '**')
    const res = new Function(`return ${safeExpr}`)()
    return Number(res)
  } catch {
    return NaN
  }
}

const parseNumberList = (raw: string): number[] => {
  const parts = raw.split(',').map((s) => s.trim()).filter(Boolean)
  const values = parts.map(parseMathExpr)
  if (values.some((v) => !Number.isFinite(v))) {
    return []
  }
  return values
}

export default function Dynamic1D() {
  const [model, setModel] = useState('verhulst')
  const [funcStr, setFuncStr] = useState('')
  const [params, setParams] = useState<Record<string, number>>({})
  const [controlEnabled, setControlEnabled] = useState(false)

  const [xMin, setXMin] = useState('')
  const [xMax, setXMax] = useState('')
  const [tMax, setTMax] = useState('')
  const [initials, setInitials] = useState('')

  const [autoPlot, setAutoPlot] = useState(true)
  const [showKeyboard, setShowKeyboard] = useState(false)

  const [resultado, setResultado] = useState<SolveResponse | null>(null)
  const [validacion, setValidacion] = useState<{ ok: boolean; equation?: string; reason?: string } | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [hasExampleLoaded, setHasExampleLoaded] = useState(false)

  const debounceRef = useRef<number | null>(null)

  const applyModelDefaults = (selected: string) => {
    const defaults = modelDefaults[selected]
    if (!defaults) return
    setFuncStr(defaults.func_str)
    setParams(defaults.params)
    setXMin(String(defaults.x_min))
    setXMax(String(defaults.x_max))
    setTMax(String(defaults.t_max))
    setInitials(defaults.initial_conditions)
    setControlEnabled(false)
    setHasExampleLoaded(true)
  }

  const clearForm = () => {
    setFuncStr('')
    setParams({})
    setXMin('')
    setXMax('')
    setTMax('')
    setInitials('')
    setControlEnabled(false)
    setHasExampleLoaded(false)
  }

  const buildPayload = () => {
    const xMinVal = parseMathExpr(xMin)
    const xMaxVal = parseMathExpr(xMax)
    const tMaxVal = parseMathExpr(tMax)
    const initialsList = parseNumberList(initials)

    if (!Number.isFinite(xMinVal) || !Number.isFinite(xMaxVal) || !Number.isFinite(tMaxVal)) {
      throw new Error('Rangos invalidos en x_min, x_max o t_max.')
    }

    if (initialsList.length === 0) {
      throw new Error('Condiciones iniciales invalidas. Usa valores separados por coma.')
    }

    const defaults = modelDefaults[model]?.params || {}
    const mergedParams = { ...defaults, ...params }

    return {
      model,
      func_str: funcStr,
      params: mergedParams,
      control_enabled: controlEnabled,
      x_min: xMinVal,
      x_max: xMaxVal,
      t_max: tMaxVal,
      initial_conditions: initialsList,
      n_phase: 400,
      n_time: 200
    }
  }

  const handleSolve = async (silent = false) => {
    if (loading) return
    setError('')
    setValidacion(null)
    if (!silent) {
      setResultado(null)
    }

    try {
      const payload = buildPayload()
      setLoading(true)
      const res = await dynamic1DService.solve(payload)
      setResultado(res.data)
    } catch (err: any) {
      setError(err.message || err.response?.data?.detail || 'Error al resolver el sistema')
    } finally {
      setLoading(false)
    }
  }

  const handleValidate = async () => {
    setError('')
    setValidacion(null)

    try {
      const payload = buildPayload()
      const res = await dynamic1DService.validate(payload)
      setValidacion({ ok: true, equation: res.data.equation })
    } catch (err: any) {
      const reason = err.message || err.response?.data?.detail || 'Error al validar la funcion'
      setValidacion({ ok: false, reason })
    }
  }

  const handleEquilibria = async () => {
    setError('')
    setValidacion(null)

    try {
      const payload = buildPayload()
      setLoading(true)
      const res = await dynamic1DService.equilibria(payload)
      setResultado({
        model: res.data.model,
        equation: res.data.equation,
        params: res.data.params,
        equilibria: res.data.equilibria,
        phase: res.data.phase,
        time: resultado?.time || { t: [], series: [] }
      })
    } catch (err: any) {
      setError(err.message || err.response?.data?.detail || 'Error al buscar equilibrios')
    } finally {
      setLoading(false)
    }
  }

  const handleClear = () => {
    setResultado(null)
    setError('')
    setValidacion(null)
  }

  useEffect(() => {
    if (!autoPlot || !hasExampleLoaded) return
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }
    debounceRef.current = window.setTimeout(() => {
      handleSolve(true)
    }, 500)

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [model, funcStr, params, controlEnabled, xMin, xMax, tMax, initials, autoPlot])

  const phasePlot = useMemo(() => {
    if (!resultado) return null
    const phase = resultado.phase
    const eqPoints = resultado.equilibria || []

    const eqStable = eqPoints.filter((p) => p.stability === 'estable')
    const eqUnstable = eqPoints.filter((p) => p.stability === 'inestable')
    const eqSemi = eqPoints.filter((p) => p.stability === 'semiestable')

    const flowRight = phase.flow.filter((f) => f.dir > 0)
    const flowLeft = phase.flow.filter((f) => f.dir < 0)

    return {
      data: [
        {
          x: phase.x,
          y: phase.fx,
          type: 'scatter',
          mode: 'lines',
          name: 'f(x)'
        },
        {
          x: eqStable.map((p) => p.x),
          y: eqStable.map(() => 0),
          type: 'scatter',
          mode: 'markers',
          name: 'Estable',
          marker: { color: 'green', size: 10 }
        },
        {
          x: eqUnstable.map((p) => p.x),
          y: eqUnstable.map(() => 0),
          type: 'scatter',
          mode: 'markers',
          name: 'Inestable',
          marker: { color: 'red', size: 10, symbol: 'circle-open' }
        },
        {
          x: eqSemi.map((p) => p.x),
          y: eqSemi.map(() => 0),
          type: 'scatter',
          mode: 'markers',
          name: 'Semiestable',
          marker: { color: 'orange', size: 10 }
        },
        {
          x: flowRight.map((p) => p.x),
          y: flowRight.map(() => 0),
          type: 'scatter',
          mode: 'markers',
          name: 'Flujo +',
          marker: { color: '#2b6cb0', size: 8, symbol: 'triangle-right' },
          hoverinfo: 'skip'
        },
        {
          x: flowLeft.map((p) => p.x),
          y: flowLeft.map(() => 0),
          type: 'scatter',
          mode: 'markers',
          name: 'Flujo -',
          marker: { color: '#2b6cb0', size: 8, symbol: 'triangle-left' },
          hoverinfo: 'skip'
        }
      ]
    }
  }, [resultado])

  const timePlot = useMemo(() => {
    if (!resultado) return null
    const time = resultado.time
    const series = time.series || []

    return {
      data: series.map((s) => ({
        x: time.t,
        y: s.x,
        type: 'scatter',
        mode: 'lines',
        name: `x0 = ${s.x0}`
      }))
    }
  }, [resultado])

  const renderParamControl = (key: string, label: string, disabled = false) => {
    const range = paramRanges[key]
    const value = params[key] ?? 0

    return (
      <div className="form-group" key={key}>
        <label>{label}:</label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px', gap: '8px', alignItems: 'center' }}>
          <input
            type="range"
            min={range.min}
            max={range.max}
            step={range.step}
            value={value}
            onChange={(e) => setParams({ ...params, [key]: parseFloat(e.target.value) })}
            disabled={disabled}
          />
          <input
            type="number"
            value={value}
            step={range.step}
            onChange={(e) => setParams({ ...params, [key]: parseMathExpr(e.target.value) })}
            disabled={disabled}
          />
        </div>
      </div>
    )
  }

  const selectedFormula = useMemo(() => {
    if (!hasExampleLoaded && !funcStr) return "x' = f(x)"
    if (model === 'malthus') return "x' = r x"
    if (model === 'verhulst') {
      return controlEnabled ? "x' = \\mu x(1 - x/K) - h" : "x' = \\mu x(1 - x/K)"
    }
    if (model === 'newton') return "x' = -k(x - T_a)"
    return "x' = f(x)"
  }, [model, controlEnabled, hasExampleLoaded, funcStr])

  const parameterInfo = useMemo(() => {
    const info: string[] = []
    if (model === 'malthus') {
      info.push('r: tasa de crecimiento poblacional')
    }
    if (model === 'verhulst') {
      info.push('\\mu: tasa de crecimiento')
      info.push('K: capacidad de carga')
      if (controlEnabled) {
        info.push('h: cosecha/control (termino que reduce la poblacion)')
      }
    }
    if (model === 'newton') {
      info.push('k: constante de enfriamiento')
      info.push('T_a: temperatura ambiente')
    }
    if (model === 'custom') {
      info.push('x*: punto de equilibrio (f(x*) = 0)')
    }
    if (model !== 'custom') {
      info.push('x*: punto de equilibrio (f(x*) = 0)')
    }
    return info
  }, [model, controlEnabled])

  return (
    <div className="method-page">
      <h1>Sistemas Dinamicos 1D (Autonomos)</h1>

      <div className="theory-section">
        <h3>Modo y Ecuacion</h3>
        <p><strong>Forma general:</strong> dx/dt = f(x). Selecciona un modelo o ingresa tu propia funcion.</p>
        <FormulaDisplay formula={selectedFormula} title="Modelo seleccionado" />
        <div className="result-box" style={{ marginTop: '6px' }}>
          <div className="validation-title">Parametros del modelo</div>
          <ul style={{ margin: 0, paddingLeft: '18px' }}>
            {parameterInfo.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="method-container">
        <div className="form-section">
          <h2>Parametros</h2>

          <div className="method-selector">
            <label>Modo:</label>
            <select value="1d" onChange={() => undefined}>
              <option value="1d">1D - una variable</option>
              <option value="2d" disabled>2D - dos variables (proximamente)</option>
            </select>
          </div>

          <div className="method-selector">
            <label>Modelos predefinidos:</label>
            <select
              value={model}
              onChange={(e) => {
                const selected = e.target.value
                setModel(selected)
                clearForm()
                setResultado(null)
                setError('')
                setValidacion(null)
              }}
            >
              <option value="verhulst">Verhulst (Logistico)</option>
              <option value="malthus">Malthus</option>
              <option value="newton">Enfriamiento de Newton</option>
              <option value="custom">Personalizado</option>
            </select>
            <button
              type="button"
              className="btn-primary"
              style={{ marginTop: '6px' }}
              onClick={() => {
                applyModelDefaults(model)
                setTimeout(() => handleSolve(), 0)
              }}
            >
              Cargar ejemplo y graficar
            </button>
          </div>

          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label>Ecuacion (dx/dt = f(x)):</label>
              <button
                type="button"
                onClick={() => setShowKeyboard(!showKeyboard)}
                className="btn-keyboard-toggle"
                style={{ fontSize: '11px', padding: '2px 8px', cursor: 'pointer', borderRadius: '4px', border: '1px solid #ccc' }}
              >
                {showKeyboard ? '✖ Cerrar' : '⌨ Teclado'}
              </button>
            </div>
            <input
              type="text"
              value={funcStr}
              onChange={(e) => setFuncStr(e.target.value)}
              placeholder="Ej: mu*x*(1 - x/K)"
            />
            {showKeyboard && (
              <MathKeyboard
                onInsert={(text) => setFuncStr(funcStr + text)}
                onClear={() => setFuncStr('')}
              />
            )}
            <div style={{ marginTop: '8px', padding: '8px', backgroundColor: '#f1f8ff', border: '1px dashed #b6d4fe', borderRadius: '4px' }}>
              <FormulaDisplay formula={`x' = ${funcStr || 'f(x)'}`} />
            </div>
          </div>

          {(model === 'verhulst' || model === 'custom') && (
            <div className="form-group">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <label style={{ marginBottom: 0 }}>Control (opcional):</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <select
                    value={controlEnabled ? 'on' : 'off'}
                    onChange={(e) => setControlEnabled(e.target.value === 'on')}
                    style={{ minWidth: '120px' }}
                  >
                    <option value="off">Desactivado</option>
                    <option value="on">Activado</option>
                  </select>
                  <span>Termino de control h</span>
                </div>
              </div>
              <small>Si esta activado, se agrega el termino -h al modelo.</small>
            </div>
          )}

          <div className="form-group">
            <label>Parametros del modelo:</label>
            {model === 'malthus' && renderParamControl('r', 'r (crecimiento)')}
            {model === 'verhulst' && (
              <>
                {renderParamControl('mu', 'mu (crecimiento)')}
                {renderParamControl('K', 'K (capacidad)')}
                <div style={{ opacity: controlEnabled ? 1 : 0.5 }}>
                  {renderParamControl('h', 'h (cosecha/control)', !controlEnabled)}
                </div>
              </>
            )}
            {model === 'newton' && (
              <>
                {renderParamControl('k', 'k (enfriamiento)')}
                {renderParamControl('Ta', 'Ta (ambiente)')}
              </>
            )}
          </div>

          <div className="form-group" style={{ marginTop: '8px' }}>
            <label>Condiciones iniciales (x0):</label>
            <input
              type="text"
              value={initials}
              onChange={(e) => setInitials(e.target.value)}
              placeholder="Ej: 10, 40, 80"
            />
            <small>Valores separados por coma.</small>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '8px' }}>
            <div className="form-group">
              <label>Rango x (min):</label>
              <input type="text" value={xMin} onChange={(e) => setXMin(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Rango x (max):</label>
              <input type="text" value={xMax} onChange={(e) => setXMax(e.target.value)} />
            </div>
          </div>

          <div className="form-group" style={{ marginTop: '8px' }}>
            <label>Tiempo final (t):</label>
            <input type="text" value={tMax} onChange={(e) => setTMax(e.target.value)} />
          </div>

          <div className="form-group" style={{ marginTop: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <label style={{ marginBottom: 0 }}>Auto-graficar:</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <select
                  value={autoPlot ? 'on' : 'off'}
                  onChange={(e) => setAutoPlot(e.target.value === 'on')}
                  style={{ minWidth: '120px' }}
                >
                  <option value="off">Manual</option>
                  <option value="on">Actualizar en vivo</option>
                </select>
              </div>
            </div>
          </div>

          <div className="form-group">
            <label>Acciones:</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <button type="button" className="btn-primary" onClick={() => handleSolve()} disabled={loading}>
                {loading ? 'Graficando...' : 'Graficar'}
              </button>
              <button type="button" className="btn-primary" onClick={handleEquilibria} disabled={loading}>
                Buscar y clasificar equilibrios
              </button>
              <button type="button" className="btn-primary" onClick={handleValidate}>
                Validar funcion
              </button>
              <button type="button" className="btn-primary" onClick={handleClear}>
                Limpiar graficos
              </button>
            </div>
            {validacion && (
              <div className="result-box" style={{ marginTop: '8px' }}>
                <div className="validation-title">Validacion de funcion</div>
                <div style={{ background: '#f8f8f8', border: '1px solid #c0c0c0', padding: '6px' }}>
                  {validacion.ok ? (
                    <>
                      <div style={{ marginBottom: '6px', fontWeight: 'bold', color: '#006400' }}>Funcion valida</div>
                      <div style={{ fontFamily: 'Courier New', marginBottom: '6px' }}>f(x) = {validacion.equation}</div>
                      <ul style={{ margin: 0, paddingLeft: '18px' }}>
                        <li>La expresion se puede parsear sin errores.</li>
                        <li>Los parametros requeridos estan definidos.</li>
                        <li>Se puede evaluar en x = 0 sin indeterminaciones.</li>
                      </ul>
                    </>
                  ) : (
                    <>
                      <div style={{ marginBottom: '6px', fontWeight: 'bold', color: '#8b0000' }}>Funcion no valida</div>
                      <div style={{ fontFamily: 'Courier New', marginBottom: '6px' }}>{validacion.reason}</div>
                      <ul style={{ margin: 0, paddingLeft: '18px' }}>
                        <li>Revisa la sintaxis y los operadores.</li>
                        <li>Asegura que todos los parametros esten definidos.</li>
                      </ul>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="result-section">
          <h2>Resultados</h2>

          {error && <div className="error-box">Error: {error}</div>}

          {resultado && (
            <div className="result-box">
              <div className="validation-title">Equacion usada:</div>
              <FormulaDisplay formula={`x' = ${resultado.equation}`} />
            </div>
          )}

          {resultado && resultado.equilibria && resultado.equilibria.length > 0 && (
            <div className="result-box">
              <div className="validation-title">Puntos de equilibrio</div>
              <div className="validation-box">
                {resultado.equilibria.map((eq, idx) => (
                  <div key={idx} className="validation-row">
                    <span className="validation-label">x* = {eq.x.toFixed(4)}</span>
                    <span>{eq.stability}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {phasePlot && (
            <div style={{ marginBottom: '10px' }}>
              <PlotlyGraph
                data={phasePlot.data}
                title="Diagrama de fase 1D"
                layout={{ xaxis: { title: 'x' }, yaxis: { title: "f(x)" } }}
              />
            </div>
          )}

          {timePlot && (
            <PlotlyGraph
              data={timePlot.data}
              title="Evolucion temporal"
              layout={{ xaxis: { title: 't' }, yaxis: { title: 'x(t)' } }}
            />
          )}
        </div>
      </div>
    </div>
  )
}
