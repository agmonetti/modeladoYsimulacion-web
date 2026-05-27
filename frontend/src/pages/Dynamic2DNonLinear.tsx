// frontend/src/pages/Dynamic2DNonLinear.tsx
import React, { useMemo, useState } from 'react';
import PlotlyGraph from '../components/PlotlyGraph';
import FormulaDisplay from '../components/FormulaDisplay';
import { dynamic2DNonLinearService } from '../services/api';
import '../styles/Method.css';

type Autovalor = { real: number; imag: number };

type AnalisisPunto = {
  x: number;
  y: number;
  traza: number;
  determinante: number;
  discriminante: number;
  clasificacion: string;
  comportamiento: string;
  autovalores: Autovalor[];
  jacobiano_local: number[][];
};

type SolveResponse = {
  ecuacion_latex_x: string;
  ecuacion_latex_y: string;
  jacobiano_latex: string;
  puntos_analizados: AnalisisPunto[];
  principal_trajectory: { t: number[]; x: number[]; y: number[] };
  automatic_trajectories: { x: number[]; y: number[] }[];
  contour_data: { x_axis: number[]; y_axis: number[]; z_x_nul: number[][]; z_y_nul: number[][] };
};

export default function Dynamic2DNonLinear() {
  const [eqX, setEqX] = useState('y - x');
  const [eqY, setEqY] = useState('x^2 - 1');
  const [x0, setX0] = useState('0.5');
  const [y0, setY0] = useState('0.5');
  const [tFin, setTFin] = useState('10');
  const [hStep, setHStep] = useState('0.02');
  const [domain, setDomain] = useState('3');
  
  const [resultado, setResultado] = useState<SolveResponse | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSolve = async () => {
    setError('');
    setResultado(null);
    setLoading(true);
    try {
      const d = parseFloat(domain);
      const payload = {
        eq_x: eqX, eq_y: eqY, 
        x0: parseFloat(x0), y0: parseFloat(y0),
        t_fin: parseFloat(tFin), h: parseFloat(hStep),
        x_min: -d, x_max: d, y_min: -d, y_max: d, 
        cantidad_trayectorias: 25
      };
      const res = await dynamic2DNonLinearService.solve(payload);
      setResultado(res.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al resolver el sistema no lineal');
    } finally {
      setLoading(false);
    }
  };

  const phasePlotData = useMemo(() => {
    if (!resultado) return null;
    const traces: any[] = [];

    resultado.automatic_trajectories.forEach((traj, idx) => {
      traces.push({
        x: traj.x, y: traj.y, type: 'scatter', mode: 'lines',
        line: { color: 'rgba(180, 180, 180, 0.4)', width: 1 },
        hoverinfo: 'none',
        showlegend: idx === 0, name: 'Flujo del espacio (RK4)'
      });
    });

    traces.push({
      x: resultado.contour_data.x_axis, y: resultado.contour_data.y_axis, z: resultado.contour_data.z_x_nul,
      type: 'contour', coloring: 'none',
      contours: { coloring: 'none', showlines: true, start: 0, end: 0 },
      line: { color: '#2563eb', width: 2, dash: 'dash' },
      showscale: false, name: 'Nulclina dx/dt=0', hoverinfo: 'none'
    });

    traces.push({
      x: resultado.contour_data.x_axis, y: resultado.contour_data.y_axis, z: resultado.contour_data.z_y_nul,
      type: 'contour', coloring: 'none',
      contours: { coloring: 'none', showlines: true, start: 0, end: 0 },
      line: { color: '#d97706', width: 2, dash: 'dash' },
      showscale: false, name: 'Nulclina dy/dt=0', hoverinfo: 'none'
    });

    traces.push({
      x: resultado.principal_trajectory.x, y: resultado.principal_trajectory.y,
      type: 'scatter', mode: 'lines', line: { color: '#111827', width: 2.5 }, name: 'Trayectoria Principal'
    });

    traces.push({
      x: [parseFloat(x0)], y: [parseFloat(y0)], type: 'scatter', mode: 'markers',
      marker: { color: '#059669', size: 10, line: { color: '#fff', width: 1.5 } }, name: 'Condición Inicial'
    });

    resultado.puntos_analizados.forEach((pto, idx) => {
      traces.push({
        x: [pto.x], y: [pto.y], type: 'scatter', mode: 'markers',
        marker: { color: '#dc2626', size: 12, symbol: 'x', line: { color: '#fff', width: 2 } }, 
        showlegend: idx === 0, name: 'Puntos de Equilibrio (X*)'
      });
    });

    return traces;
  }, [resultado, x0, y0]);

  const timePlotData = useMemo(() => {
    if (!resultado) return null;
    return [
      { x: resultado.principal_trajectory.t, y: resultado.principal_trajectory.x, type: 'scatter', mode: 'lines', name: 'x(t)', line: { color: '#2563eb' } },
      { x: resultado.principal_trajectory.t, y: resultado.principal_trajectory.y, type: 'scatter', mode: 'lines', name: 'y(t)', line: { color: '#dc2626' } }
    ];
  }, [resultado]);

  return (
    <div className="method-page">
      <h1>Sistemas Dinámicos 2D No Lineales</h1>

      <div className="theory-section">
        <h3>Análisis Local (Teorema de Hartman-Grobman)</h3>
        <p>Determinación de estabilidad cualitativa mediante la linealización de la Matriz Jacobiana en vecindades de equilibrios aislados.</p>
      </div>

      <div className="method-container">
        <div className="form-section">
          <h2>Expresiones Matemáticas</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px' }}>
            <div className="form-group">
              <label>dx/dt = f(x,y)</label>
              <input type="text" value={eqX} onChange={e => setEqX(e.target.value)} placeholder="Ej: x*y" />
            </div>
            <div className="form-group">
              <label>dy/dt = g(x,y)</label>
              <input type="text" value={eqY} onChange={e => setEqY(e.target.value)} placeholder="Ej: x^2 + y^2 - 1" />
            </div>
            <small style={{ color: '#666', marginTop: '-4px', fontSize: '11px', lineHeight: '1.2' }}>Usa <strong>*</strong> para multiplicar (x*y) y <strong>^</strong> para potencias (x^2).</small>
          </div>

          <h3 style={{ marginTop: '16px' }}>Condiciones Iniciales</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <div className="form-group"><label>x(0):</label><input type="number" step="0.1" value={x0} onChange={e => setX0(e.target.value)} /></div>
            <div className="form-group"><label>y(0):</label><input type="number" step="0.1" value={y0} onChange={e => setY0(e.target.value)} /></div>
          </div>

          <h3 style={{ marginTop: '16px' }}>Simulación y Visualización</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
            <div className="form-group"><label>T Final:</label><input type="number" value={tFin} onChange={e => setTFin(e.target.value)} /></div>
            <div className="form-group"><label>Paso h:</label><input type="number" step="0.005" value={hStep} onChange={e => setHStep(e.target.value)} /></div>
            <div className="form-group"><label>Dominio (±):</label><input type="number" step="1" value={domain} onChange={e => setDomain(e.target.value)} /></div>
          </div>

          <button type="button" className="btn-primary" style={{ marginTop: '14px', width: '100%' }} onClick={handleSolve} disabled={loading}>
            {loading ? 'Analizando...' : 'Linealizar y Graficar'}
          </button>
        </div>

        <div className="result-section">
          <h2>Análisis Local y Espectral</h2>
          {error && <div className="error-box">{error}</div>}

          {resultado && (
            <>
              {/* Ecuaciones Simbólicas */}
              <div className="result-box">
                <div className="validation-title">Sistemas Ecuaciones Original (Parseado SymPy)</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '10px 0' }}>
                  <FormulaDisplay formula={`\\begin{cases} x' = ${resultado.ecuacion_latex_x} \\\\ y' = ${resultado.ecuacion_latex_y} \\end{cases}`} />
                </div>
              </div>

              {/* Jacobiano Simbólico General */}
              <div className="result-box">
                <div className="validation-title">Matriz Jacobiana General Symbolic J(x,y)</div>
                <div style={{ padding: '10px 0' }}>
                  <FormulaDisplay formula={`J(x,y) = ${resultado.jacobiano_latex}`} />
                </div>
              </div>

              {/* NUEVA SECCIÓN: Listado de Puntos Encontrados vía Nulclinas */}
              <div className="result-box">
                <div className="validation-title">Puntos de Equilibrio Encontrados (f(x,y) = 0 ∩ g(x,y) = 0)</div>
                <div className="validation-box">
                  {resultado.puntos_analizados.length === 0 ? (
                    <div className="validation-row">
                      <span style={{ color: '#dc2626', fontWeight: 'bold' }}>No se interceptan las nulclinas en el plano real.</span>
                    </div>
                  ) : (
                    resultado.puntos_analizados.map((pto, idx) => (
                      <div key={`summary-${idx}`} className="validation-row" style={{ fontFamily: 'monospace', fontSize: '14px' }}>
                        <span className="validation-label">Punto P_{idx + 1}^*:</span>
                        <span>x* = {pto.x.toFixed(4)}, &nbsp; y* = {pto.y.toFixed(4)}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Bloques de Análisis Cualitativo Individual por Punto */}
              {resultado.puntos_analizados.map((pto, idx) => (
                <div key={idx} className="result-box" style={{ borderColor: '#818cf8', borderWidth: '2px' }}>
                  <div className="validation-title" style={{ background: '#e0e7ff', color: '#3730a3', borderBottom: '1px solid #c7d2fe', fontWeight: 'bold' }}>
                    Análisis Cualitativo Local en P_{idx + 1}^*: ({pto.x.toFixed(4)}, {pto.y.toFixed(4)})
                  </div>
                  <div className="validation-box">
                    <div className="validation-row" style={{ alignItems: 'center', marginBottom: '8px' }}>
                      <span className="validation-label">J local evaluado:</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'monospace', fontSize: '15px', color: '#111827' }}>
                        <span style={{ fontWeight: 'bold' }}>J =</span>
                        <div style={{ borderLeft: '2px solid #111827', borderRight: '2px solid #111827', padding: '0 10px', textAlign: 'center', lineHeight: '1.4' }}>
                          <div>{pto.jacobiano_local[0][0].toFixed(2)} &nbsp;&nbsp; {pto.jacobiano_local[0][1].toFixed(2)}</div>
                          <div>{pto.jacobiano_local[1][0].toFixed(2)} &nbsp;&nbsp; {pto.jacobiano_local[1][1].toFixed(2)}</div>
                        </div>
                      </div>
                    </div>

                    <div className="validation-row">
                      <span className="validation-label">Traza (¼):</span>
                      <span>{pto.traza.toFixed(4)}</span>
                    </div>
                    <div className="validation-row">
                      <span className="validation-label">Determinante (Δ):</span>
                      <span>{pto.determinante.toFixed(4)}</span>
                    </div>
                    <div className="validation-row">
                      <span className="validation-label">Discriminante (τ² - 4Δ):</span>
                      <span>{pto.discriminante.toFixed(4)}</span>
                    </div>
                    <div className="validation-row">
                      <span className="validation-label">Clasificación Lineal:</span>
                      <span style={{ fontWeight: 'bold', color: pto.clasificacion.includes('estable') ? '#059669' : '#dc2626' }}>{pto.clasificacion}</span>
                    </div>
                    <div className="validation-row">
                      <span className="validation-label">Conclusión:</span>
                      <span>El sistema presenta un equilibrio indexado como {pto.clasificacion}. {pto.comportamiento}</span>
                    </div>
                    <div className="validation-row">
                      <span className="validation-label">Espectro (λ):</span>
                      <span style={{ fontFamily: 'monospace', background: '#f1f5f9', padding: '4px 6px', borderRadius: '4px' }}>
                        λ_1 = {pto.autovalores[0].real.toFixed(4)} {pto.autovalores[0].imag >= 0 ? `+ ${pto.autovalores[0].imag.toFixed(4)}` : `- ${Math.abs(pto.autovalores[0].imag).toFixed(4)}`}i<br/>
                        λ_2 = {pto.autovalores[1].real.toFixed(4)} {pto.autovalores[1].imag >= 0 ? `+ ${pto.autovalores[1].imag.toFixed(4)}` : `- ${Math.abs(pto.autovalores[1].imag).toFixed(4)}`}i
                      </span>
                    </div>
                  </div>
                </div>
              ))}

              {/* Retrato de Fase */}
              {phasePlotData && (
                <div style={{ marginBottom: '16px', border: '1px solid #ccc', borderRadius: '4px', overflow: 'hidden' }}>
                  <PlotlyGraph 
                    data={phasePlotData} 
                    title="Retrato de Fase Completo (Nullclines curvas + RK4 Flow)" 
                    layout={{ 
                      xaxis: { title: 'Variable X', range: [-parseFloat(domain), parseFloat(domain)] }, 
                      yaxis: { title: 'Variable Y', range: [-parseFloat(domain), parseFloat(domain)] },
                      showlegend: true
                    }} 
                  />
                </div>
              )}

              {timePlotData && (
                <div style={{ marginBottom: '16px', border: '1px solid #ccc', borderRadius: '4px', overflow: 'hidden' }}>
                  <PlotlyGraph 
                    data={timePlotData} 
                    title="Evolución Temporal" 
                    layout={{ xaxis: { title: 'Tiempo (t)' }, yaxis: { title: 'Estado' } }} 
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}