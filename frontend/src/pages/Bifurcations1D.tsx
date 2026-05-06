import React, { useMemo, useState } from 'react'
import PlotlyGraph from '../components/PlotlyGraph'
import FormulaDisplay from '../components/FormulaDisplay'
import MathKeyboard from '../components/MathKeyboard'
import { dynamic1DService } from '../services/api'
import '../styles/Method.css'

type Equilibrium = {
  x: number
  fprime: number | null
  stability: string
  stability_reason?: string
}

type PhaseResponse = {
  x: number[]
  fx: number[]
  flow: { x: number; dir: number }[]
}

type BifurcationEquilibrium = {
  param: number
  x: number
  fprime: number | null
  stability: string
  stability_reason?: string
}

type BifurcationResponse = {
  model: string
  equation: string
  bif_param: string
  bifurcation: {
    param_values: number[]
    equilibria: BifurcationEquilibrium[]
  }
  phase_slices: { param: number; equilibria: Equilibrium[]; phase: PhaseResponse }[]
}

const bifurcationDefaults: Record<string, {
  func_str: string
  param: string
  min: number
  max: number
  steps: number
  phase: string
  x_min: number
  x_max: number
}> = {
  saddle_node_pos: {
    func_str: 'r + x^2',
    param: 'r',
    min: -2,
    max: 2,
    steps: 80,
    phase: '-1, 0, 1',
    x_min: -2,
    x_max: 2
  },
  saddle_node_neg: {
    func_str: 'r - x^2',
    param: 'r',
    min: -2,
    max: 2,
    steps: 80,
    phase: '-1, 0, 1',
    x_min: -2,
    x_max: 2
  },
  pitchfork: {
    func_str: 'r*x - x^3',
    param: 'r',
    min: -2,
    max: 2,
    steps: 80,
    phase: '-1, 0, 1',
    x_min: -2,
    x_max: 2
  },
  transcritical: {
    func_str: 'r*x - x^2',
    param: 'r',
    min: -2,
    max: 2,
    steps: 80,
    phase: '-1, 0, 1',
    x_min: -2,
    x_max: 2
  },
  transcritical_shift: {
    func_str: '(r-2)*x - x^2',
    param: 'r',
    min: -1,
    max: 4,
    steps: 80,
    phase: '0, 2, 3',
    x_min: -2,
    x_max: 3
  },
  custom: {
    func_str: 'r*x - x^3',
    param: 'r',
    min: -2,
    max: 2,
    steps: 80,
    phase: '-1, 0, 1',
    x_min: -2,
    x_max: 2
  }
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

export default function Bifurcations1D() {
  const [bifModel, setBifModel] = useState('saddle_node_pos')
  const [bifFuncStr, setBifFuncStr] = useState('r + x^2')
  const [bifXMin, setBifXMin] = useState('-2')
  const [bifXMax, setBifXMax] = useState('2')
  const [showBifKeyboard, setShowBifKeyboard] = useState(false)

  const [bifParam, setBifParam] = useState('r')
  const [bifMin, setBifMin] = useState('-2')
  const [bifMax, setBifMax] = useState('2')
  const [bifSteps, setBifSteps] = useState('80')
  const [phaseParams, setPhaseParams] = useState('-1, 0, 1')

  const [bifResult, setBifResult] = useState<BifurcationResponse | null>(null)
  const [bifError, setBifError] = useState('')
  const [bifLoading, setBifLoading] = useState(false)

  const applyBifurcationDefaults = (selected: string) => {
    const defaults = bifurcationDefaults[selected]
    if (!defaults) return
    setBifFuncStr(defaults.func_str)
    setBifParam(defaults.param)
    setBifMin(String(defaults.min))
    setBifMax(String(defaults.max))
    setBifSteps(String(defaults.steps))
    setPhaseParams(defaults.phase)
    setBifXMin(String(defaults.x_min))
    setBifXMax(String(defaults.x_max))
  }

  const buildBifurcationPayload = () => {
    if (!bifFuncStr || bifFuncStr.trim() === '') {
      throw new Error('La ecuacion de bifurcacion es obligatoria.')
    }
    const xMinVal = parseMathExpr(bifXMin)
    const xMaxVal = parseMathExpr(bifXMax)
    const bifMinVal = parseMathExpr(bifMin)
    const bifMaxVal = parseMathExpr(bifMax)
    const bifStepsVal = parseInt(bifSteps, 10)
    const phaseList = parseNumberList(phaseParams)

    if (!Number.isFinite(xMinVal) || !Number.isFinite(xMaxVal)) {
      throw new Error('Rangos invalidos en x_min o x_max.')
    }
    if (!Number.isFinite(bifMinVal) || !Number.isFinite(bifMaxVal) || !Number.isFinite(bifStepsVal)) {
      throw new Error('Rangos invalidos para el parametro de bifurcacion.')
    }
    if (bifStepsVal < 2) {
      throw new Error('El numero de pasos debe ser mayor o igual a 2.')
    }
    if (!bifParam || bifParam.trim() === '') {
      throw new Error('El nombre del parametro de bifurcacion es obligatorio.')
    }

    return {
      model: 'custom',
      func_str: bifFuncStr,
      params: {},
      control_enabled: false,
      x_min: xMinVal,
      x_max: xMaxVal,
      n_phase: 400,
      bif_param: bifParam.trim(),
      bif_min: bifMinVal,
      bif_max: bifMaxVal,
      bif_steps: bifStepsVal,
      phase_params: phaseList
    }
  }

  const handleBifurcation = async () => {
    if (bifLoading) return
    setBifError('')
    setBifResult(null)

    try {
      const payload = buildBifurcationPayload()
      setBifLoading(true)
      const res = await dynamic1DService.bifurcation(payload)
      setBifResult(res.data)
    } catch (err: any) {
      setBifError(err.message || err.response?.data?.detail || 'Error al calcular bifurcaciones')
    } finally {
      setBifLoading(false)
    }
  }

  const buildPhasePlot = (phase: PhaseResponse, eqPoints: Equilibrium[]) => {
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
  }

  const bifPlot = useMemo(() => {
    if (!bifResult) return null
    const points = bifResult.bifurcation.equilibria || []

    const stable = points.filter((p) => p.stability === 'estable')
    const unstable = points.filter((p) => p.stability === 'inestable')
    const semi = points.filter((p) => p.stability === 'semiestable')

    const sortByParam = (items: BifurcationEquilibrium[]) => (
      [...items].sort((a, b) => (a.param - b.param) || (a.x - b.x))
    )

    const stableSorted = sortByParam(stable)
    const unstableSorted = sortByParam(unstable)
    const semiSorted = sortByParam(semi)

    const buildHover = (p: BifurcationEquilibrium) => (
      `param=${p.param}<br>x*=${p.x.toFixed(6)}<br>${p.stability}<br>${p.stability_reason || ''}`
    )

    return {
      data: [
        {
          x: stableSorted.map((p) => p.param),
          y: stableSorted.map((p) => p.x),
          type: 'scatter',
          mode: 'lines+markers',
          name: 'Estable',
          marker: { color: 'green', size: 6 },
          line: { color: 'green', width: 2 },
          hovertext: stableSorted.map(buildHover),
          hoverinfo: 'text'
        },
        {
          x: unstableSorted.map((p) => p.param),
          y: unstableSorted.map((p) => p.x),
          type: 'scatter',
          mode: 'lines+markers',
          name: 'Inestable',
          marker: { color: 'red', size: 6, symbol: 'circle-open' },
          line: { color: 'red', width: 2, dash: 'dash' },
          hovertext: unstableSorted.map(buildHover),
          hoverinfo: 'text'
        },
        {
          x: semiSorted.map((p) => p.param),
          y: semiSorted.map((p) => p.x),
          type: 'scatter',
          mode: 'lines+markers',
          name: 'Semiestable',
          marker: { color: 'orange', size: 6 },
          line: { color: 'orange', width: 2, dash: 'dot' },
          hovertext: semiSorted.map(buildHover),
          hoverinfo: 'text'
        }
      ]
    }
  }, [bifResult])

  return (
    <div className="method-page">
      <h1>Bifurcaciones 1D</h1>

      <div className="theory-section">
        <h3>Forma general</h3>
        <p><strong>Autonomo 1D:</strong> dx/dt = f(x, r). Selecciona un modelo o ingresa tu propia funcion.</p>
      </div>

      <div className="method-container">
        <div className="form-section">
          <h2>Parametros</h2>

          <div className="method-selector">
            <label>Modelos de bifurcacion:</label>
            <select
              value={bifModel}
              onChange={(e) => {
                const selected = e.target.value
                setBifModel(selected)
                setBifResult(null)
                setBifError('')
              }}
            >
              <option value="saddle_node_pos">Silla nodo (+): x' = r + x^2</option>
              <option value="saddle_node_neg">Silla nodo (-): x' = r - x^2</option>
              <option value="pitchfork">Pitchfork (tridente): x' = r x - x^3</option>
              <option value="transcritical">Transcrita: x' = r x - x^2</option>
              <option value="transcritical_shift">Transcrita desplazada: x' = (r-2)x - x^2</option>
              <option value="custom">Personalizado</option>
            </select>
            <button
              type="button"
              className="btn-primary"
              style={{ marginTop: '6px' }}
              onClick={() => applyBifurcationDefaults(bifModel)}
            >
              Cargar modelo
            </button>
          </div>

          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label>Ecuacion (dx/dt = f(x)):</label>
              <button
                type="button"
                onClick={() => setShowBifKeyboard(!showBifKeyboard)}
                className="btn-keyboard-toggle"
                style={{ fontSize: '11px', padding: '2px 8px', cursor: 'pointer', borderRadius: '4px', border: '1px solid #ccc' }}
              >
                {showBifKeyboard ? '✖ Cerrar' : '⌨ Teclado'}
              </button>
            </div>
            <input
              type="text"
              value={bifFuncStr}
              onChange={(e) => setBifFuncStr(e.target.value)}
              placeholder="Ej: r + x^2"
            />
            {showBifKeyboard && (
              <MathKeyboard
                onInsert={(text) => setBifFuncStr(bifFuncStr + text)}
                onClear={() => setBifFuncStr('')}
              />
            )}
            <div style={{ marginTop: '8px', padding: '8px', backgroundColor: '#f1f8ff', border: '1px dashed #b6d4fe', borderRadius: '4px' }}>
              <FormulaDisplay formula={`x' = ${bifFuncStr || 'f(x)'}`} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div className="form-group">
              <label>Parametro:</label>
              <input type="text" value={bifParam} onChange={(e) => setBifParam(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Puntos de muestreo:</label>
              <input type="text" value={bifSteps} onChange={(e) => setBifSteps(e.target.value)} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '6px' }}>
            <div className="form-group">
              <label>Dominio x (min):</label>
              <input type="text" value={bifXMin} onChange={(e) => setBifXMin(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Dominio x (max):</label>
              <input type="text" value={bifXMax} onChange={(e) => setBifXMax(e.target.value)} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '6px' }}>
            <div className="form-group">
              <label>Rango del parametro (min):</label>
              <input type="text" value={bifMin} onChange={(e) => setBifMin(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Rango del parametro (max):</label>
              <input type="text" value={bifMax} onChange={(e) => setBifMax(e.target.value)} />
            </div>
          </div>

          <div className="form-group" style={{ marginTop: '6px' }}>
            <label>Valores para diagrama de fase:</label>
            <input
              type="text"
              value={phaseParams}
              onChange={(e) => setPhaseParams(e.target.value)}
              placeholder="Ej: -1, 0, 1"
            />
            <small>Valores separados por coma para evaluar fase.</small>
          </div>

          <button type="button" className="btn-primary" onClick={handleBifurcation} disabled={bifLoading}>
            {bifLoading ? 'Calculando...' : 'Calcular bifurcacion'}
          </button>
        </div>

        <div className="result-section">
          <h2>Resultados</h2>

          {bifError && <div className="error-box">Error: {bifError}</div>}

          {bifResult && (
            <div className="result-box" style={{ marginTop: '12px' }}>
              <div className="validation-title">Bifurcacion</div>
              <div style={{ marginBottom: '6px' }}>
                <FormulaDisplay formula={`x' = ${bifResult.equation}`} />
              </div>
              <div style={{ fontSize: '13px' }}>
                Parametro: <strong>{bifResult.bif_param}</strong>
              </div>
            </div>
          )}

          {bifPlot && (
            <div style={{ marginBottom: '10px' }}>
              <PlotlyGraph
                data={bifPlot.data}
                title="Diagrama de bifurcacion"
                layout={{ xaxis: { title: bifResult?.bif_param || 'parametro' }, yaxis: { title: 'x*' } }}
              />
            </div>
          )}

          {bifResult && bifResult.phase_slices && bifResult.phase_slices.length > 0 && (
            <div>
              {bifResult.phase_slices.map((slice, idx) => {
                const plot = buildPhasePlot(slice.phase, slice.equilibria)
                return (
                  <div key={`${slice.param}-${idx}`} style={{ marginBottom: '10px' }}>
                    <PlotlyGraph
                      data={plot.data}
                      title={`Diagrama de fase (${bifResult.bif_param} = ${slice.param})`}
                      layout={{ xaxis: { title: 'x' }, yaxis: { title: 'f(x)' } }}
                    />
                    {slice.equilibria.length > 0 && (
                      <div className="result-box" style={{ marginTop: '6px' }}>
                        <div className="validation-title">Justificacion de estabilidad</div>
                        <div className="validation-box">
                          {slice.equilibria.map((eq, eidx) => (
                            <div key={`${slice.param}-${eidx}`} className="validation-row">
                              <span className="validation-label">x* = {eq.x.toFixed(4)}</span>
                              <span>{eq.stability}</span>
                              <span style={{ marginLeft: '8px', fontSize: '12px' }}>
                                {eq.stability_reason || 'sin justificacion'}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
