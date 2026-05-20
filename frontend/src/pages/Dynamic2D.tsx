import { useState } from 'react'
import PlotlyGraph from '../components/PlotlyGraph'
import FormulaDisplay from '../components/FormulaDisplay'
import { dynamic2DService } from '../services/api'
import '../styles/Method.css'

export default function Dynamic2D() {
  const [a, setA] = useState('3')
  const [b, setB] = useState('1')
  const [c, setC] = useState('1')
  const [d, setD] = useState('3')
  
  const [eVal, setEVal] = useState('0')
  const [fVal, setFVal] = useState('0')

  const [xMin, setXMin] = useState('-5')
  const [xMax, setXMax] = useState('5')
  const [yMin, setYMin] = useState('-5')
  const [yMax, setYMax] = useState('5')
  const [x0, setX0] = useState('1')
  const [y0, setY0] = useState('1')
  const [t0, setT0] = useState('0')
  const [tFin, setTFin] = useState('10')
  const [qtyTrajectories, setQtyTrajectories] = useState('16')

  const [resultado, setResultado] = useState<any>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const parseOrDie = (val: string, name: string) => {
    const num = Number(val)
    if (isNaN(num)) throw new Error(`${name} debe ser un numero válido.`)
    return num
  }

  const handleSolve = async () => {
    if (loading) return
    setError('')
    setResultado(null)
    setLoading(true)

    try {
      const payload = {
        a: parseOrDie(a, 'a'),
        b: parseOrDie(b, 'b'),
        c: parseOrDie(c, 'c'),
        d: parseOrDie(d, 'd'),
        e: parseOrDie(eVal, 'e'),
        f: parseOrDie(fVal, 'f'),
        x_min: parseOrDie(xMin, 'x_min'),
        x_max: parseOrDie(xMax, 'x_max'),
        y_min: parseOrDie(yMin, 'y_min'),
        y_max: parseOrDie(yMax, 'y_max'),
        x0: parseOrDie(x0, 'x0'),
        y0: parseOrDie(y0, 'y0'),
        t0: parseOrDie(t0, 't0'),
        t_fin: parseOrDie(tFin, 't_fin'),
        cantidad_trayectorias: parseOrDie(qtyTrajectories, 'cantidad_trayectorias')
      }

      const res = await dynamic2DService.solve(payload)
      setResultado(res.data)
    } catch (err: any) {
      setError(err.message || 'Error al resolver el sistema 2D')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="method-container max-w-7xl mx-auto py-8 px-4">
      <div className="mb-8 p-6 bg-white rounded-xl shadow-sm border border-slate-100">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
          Sistemas Dinámicos 2D (Sistemas Lineales)
        </h1>
        <p className="text-slate-600 border-l-4 border-blue-500 pl-4">
          Análisis de sistemas lineales de la forma <br/>
          <strong>x' = a x + b y + e</strong><br/>
          <strong>y' = c x + d y + f</strong>
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <h3 className="text-lg font-semibold text-slate-800 mb-4 pb-2 border-b">Configuración</h3>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1">Matriz A</label>
                <div className="grid grid-cols-2 gap-2">
                  <div className="input-group">
                    <label className="input-label">a</label>
                    <input type="number" className="input-field" value={a} onChange={e => setA(e.target.value)} />
                  </div>
                  <div className="input-group">
                    <label className="input-label">b</label>
                    <input type="number" className="input-field" value={b} onChange={e => setB(e.target.value)} />
                  </div>
                  <div className="input-group">
                    <label className="input-label">c</label>
                    <input type="number" className="input-field" value={c} onChange={e => setC(e.target.value)} />
                  </div>
                  <div className="input-group">
                    <label className="input-label">d</label>
                    <input type="number" className="input-field" value={d} onChange={e => setD(e.target.value)} />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1">Vector B</label>
                <div className="grid grid-cols-2 gap-2">
                  <div className="input-group">
                    <label className="input-label">e</label>
                    <input type="number" className="input-field" value={eVal} onChange={e => setEVal(e.target.value)} />
                  </div>
                  <div className="input-group">
                    <label className="input-label">f</label>
                    <input type="number" className="input-field" value={fVal} onChange={e => setFVal(e.target.value)} />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1">Condición Inicial (Principal)</label>
                <div className="grid grid-cols-2 gap-2">
                  <div className="input-group">
                    <label className="input-label">x0</label>
                    <input type="number" className="input-field" value={x0} onChange={e => setX0(e.target.value)} />
                  </div>
                  <div className="input-group">
                    <label className="input-label">y0</label>
                    <input type="number" className="input-field" value={y0} onChange={e => setY0(e.target.value)} />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1">Tiempo (RK4)</label>
                <div className="grid grid-cols-2 gap-2">
                  <div className="input-group">
                    <label className="input-label">t0</label>
                    <input type="number" className="input-field" value={t0} onChange={e => setT0(e.target.value)} />
                  </div>
                  <div className="input-group">
                    <label className="input-label">t_fin</label>
                    <input type="number" className="input-field" value={tFin} onChange={e => setTFin(e.target.value)} />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1">Rango del Plano de Fase</label>
                <div className="grid grid-cols-2 gap-2">
                  <div className="input-group">
                    <label className="input-label">x min</label>
                    <input type="number" className="input-field" value={xMin} onChange={e => setXMin(e.target.value)} />
                  </div>
                  <div className="input-group">
                    <label className="input-label">x max</label>
                    <input type="number" className="input-field" value={xMax} onChange={e => setXMax(e.target.value)} />
                  </div>
                  <div className="input-group">
                    <label className="input-label">y min</label>
                    <input type="number" className="input-field" value={yMin} onChange={e => setYMin(e.target.value)} />
                  </div>
                  <div className="input-group">
                    <label className="input-label">y max</label>
                    <input type="number" className="input-field" value={yMax} onChange={e => setYMax(e.target.value)} />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1">Cant. de trayectorias (campo)</label>
                <input type="number" className="input-field w-full" value={qtyTrajectories} onChange={e => setQtyTrajectories(e.target.value)} />
              </div>

              <div className="pt-4 border-t border-slate-100 flex gap-3">
                <button
                  className="btn btn-primary flex-1"
                  onClick={handleSolve}
                  disabled={loading}
                >
                  {loading ? 'Calculando...' : 'Resolver y Graficar'}
                </button>
              </div>

              {error && (
                <div className="p-4 bg-red-50 text-red-700 rounded-lg text-sm border border-red-200">
                  {error}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-8 space-y-6">
          {resultado && (
            <>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 mb-6">
                <h3 className="text-lg font-bold text-slate-800 border-b pb-2 mb-4">Resumen del Sistema</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <span className="text-xs text-slate-500 font-medium block">Clasificación</span>
                    <span className="text-slate-800 font-semibold">{resultado.resumen.clasificacion}</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <span className="text-xs text-slate-500 font-medium block">Traza / Determinante</span>
                    <span className="text-slate-800 font-semibold">{resultado.resumen.traza.toFixed(4)} / {resultado.resumen.determinante.toFixed(4)}</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <span className="text-xs text-slate-500 font-medium block">Discriminante</span>
                    <span className="text-slate-800 font-semibold">{resultado.resumen.discriminante.toFixed(4)}</span>
                  </div>
                </div>
                <div className="mt-4 p-4 bg-blue-50 border border-blue-100 rounded-lg">
                  <p className="text-blue-800 text-sm">{resultado.resumen.comportamiento}</p>
                </div>
                
                {resultado.resumen.equilibrio && (
                  <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <span className="text-xs text-slate-500 font-medium block">Equilibrio</span>
                    <span className="text-slate-800 font-semibold">({resultado.resumen.equilibrio.x.toFixed(4)}, {resultado.resumen.equilibrio.y.toFixed(4)})</span>
                  </div>
                )}

                <div className="mt-4">
                  <span className="text-xs text-slate-500 font-medium block">Solución Analítica</span>
                  <FormulaDisplay formula={resultado.resumen.solucion_analitica_latex || resultado.resumen.solucion_analitica_str} block />
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 relative">
                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center justify-between">
                  Retrato de Fase
                </h3>
                <div className="h-[500px]">
                  <PlotlyGraph 
                    data={[
                      // Vector field (quiver approximation)
                      {
                        type: 'scatter',
                        x: resultado.vector_field.x,
                        y: resultado.vector_field.y,
                        mode: 'markers',
                        marker: {
                          symbol: 'arrow',
                          angle: resultado.vector_field.u.map((u: number, i: number) => {
                            const v = resultado.vector_field.v[i];
                            return -Math.atan2(v, u) * 180 / Math.PI; // Plotly angle convention
                          }),
                          size: 10,
                          color: 'rgba(0,0,0,0.2)'
                        },
                        name: 'Campo Vectorial',
                        hoverinfo: 'skip'
                      },
                      // Initial Condition trajectories
                      ...resultado.trayectorias.map((tr: any, i: number) => ({
                        type: 'scatter',
                        x: tr.x,
                        y: tr.y,
                        mode: 'lines',
                        line: { color: 'rgba(0,100,200,0.3)', width: 1 },
                        name: `Trayectoria ${i}`,
                        showlegend: false
                      })),
                      // Nullclines
                      ...(resultado.nulclinas.dx_dt_0.x.length > 0 ? [{
                        type: 'scatter',
                        x: resultado.nulclinas.dx_dt_0.x,
                        y: resultado.nulclinas.dx_dt_0.y,
                        mode: 'lines',
                        line: { dash: 'dash', color: 'red' },
                        name: `dx/dt = 0`
                      }] : []),
                      ...(resultado.nulclinas.dy_dt_0.x.length > 0 ? [{
                        type: 'scatter',
                        x: resultado.nulclinas.dy_dt_0.x,
                        y: resultado.nulclinas.dy_dt_0.y,
                        mode: 'lines',
                        line: { dash: 'dash', color: 'orange' },
                        name: `dy/dt = 0`
                      }] : []),
                      // Principal Trajectory
                      {
                        type: 'scatter',
                        x: resultado.rk4_data.x,
                        y: resultado.rk4_data.y,
                        mode: 'lines',
                        line: { color: 'black', width: 2 },
                        name: 'Trayectoria Principal'
                      },
                      // Initial Principal Point
                      {
                        type: 'scatter',
                        x: [parseOrDie(x0, 'x0')],
                        y: [parseOrDie(y0, 'y0')],
                        mode: 'markers',
                        marker: { size: 10, color: 'green' },
                        name: 'Condición Inicial'
                      },
                      // Equilibrium Point
                      ...(resultado.resumen.equilibrio ? [{
                        type: 'scatter',
                        x: [resultado.resumen.equilibrio.x],
                        y: [resultado.resumen.equilibrio.y],
                        mode: 'markers',
                        marker: { symbol: 'x', size: 12, color: 'purple' },
                        name: 'Equilibrio'
                      }] : [])
                    ]}
                    layout={{
                      xaxis: { title: 'x', range: [parseOrDie(xMin, 'x_min'), parseOrDie(xMax, 'x_max')] },
                      yaxis: { title: 'y', range: [parseOrDie(yMin, 'y_min'), parseOrDie(yMax, 'y_max')] },
                    }}
                    title=""
                  />
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 relative">
                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center justify-between">
                  Series Temporales
                </h3>
                <div className="h-[400px]">
                  <PlotlyGraph 
                    data={[
                      {
                        x: resultado.rk4_data.t,
                        y: resultado.rk4_data.x,
                        mode: 'lines',
                        name: 'x(t)'
                      },
                      {
                        x: resultado.rk4_data.t,
                        y: resultado.rk4_data.y,
                        mode: 'lines',
                        name: 'y(t)'
                      }
                    ]}
                    layout={{
                      xaxis: { title: 't' },
                      yaxis: { title: 'Valor' },
                    }}
                    title=""
                  />
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 relative">
                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center justify-between">
                  Derivadas Principales
                </h3>
                <div className="h-[400px]">
                  <PlotlyGraph 
                    data={[
                      {
                        x: resultado.rk4_data.t,
                        y: resultado.rk4_data.dx_dt,
                        mode: 'lines',
                        name: 'dx/dt'
                      },
                      {
                        x: resultado.rk4_data.t,
                        y: resultado.rk4_data.dy_dt,
                        mode: 'lines',
                        name: 'dy/dt'
                      }
                    ]}
                    layout={{
                      xaxis: { title: 't' },
                      yaxis: { title: 'Derivada' },
                    }}
                    title=""
                  />
                </div>
              </div>
            </>
          )}

          {!resultado && !loading && !error && (
            <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl p-12 text-center text-slate-500">
              <svg className="w-16 h-16 mx-auto mb-4 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <p className="text-lg">Configura el sistema y presiona <strong>Resolver</strong></p>
              <p className="text-sm mt-2 opacity-75">Soporta retrato de fase, series temporales, clasificación lineal y comportamiento.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}