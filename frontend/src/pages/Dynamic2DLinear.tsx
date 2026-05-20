import React, { useMemo, useState } from 'react';
import PlotlyGraph from '../components/PlotlyGraph';
import FormulaDisplay from '../components/FormulaDisplay';
import { dynamic2DLinearService } from '../services/api';
import '../styles/Method.css';

type AutoTrajectory = { x: number[]; y: number[] };
type Autovalor = { real: number; imag: number };
type Autovector = { vx: number; vy: number };

type SolveResponse = {
  matrix_a: number[][];
  vector_b: number[];
  traza: number;
  determinante: number;
  discriminante: number;
  clasificacion: string;
  comportamiento: string;
  solucion_analitica: string;
  solucion_analitica_latex: string[];
  equilibrio: { x: number; y: number } | null;
  equilibrio_unico: boolean;
  autovalores: Autovalor[];
  autovectores: Autovector[];
  nulclina_x: { puntos: number[][]; ecuacion_despejada: string };
  nulclina_y: { puntos: number[][]; ecuacion_despejada: string };
  principal_trajectory: { t: number[]; x: number[]; y: number[]; dxdt: number[]; dydt: number[] };
  automatic_trajectories: AutoTrajectory[];
  real_eigenvectors_lines: number[][][];
};

export default function Dynamic2DLinear() {
  const [a, setA] = useState('3');
  const [b, setB] = useState('1');
  const [c, setC] = useState('1');
  const [d, setD] = useState('3');
  const [e_val, setE] = useState('0');
  const [f_val, setF] = useState('0');
  const [x0, setX0] = useState('1');
  const [y0, setY0] = useState('1');
  const [tFin, setTFin] = useState('10');
  const [hStep, setHStep] = useState('0.01');
  
  const [resultado, setResultado] = useState<SolveResponse | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSolve = async () => {
    setError('');
    setResultado(null);
    setLoading(true);
    try {
      const payload = {
        a: parseFloat(a), b: parseFloat(b), c: parseFloat(c), d: parseFloat(d),
        e: parseFloat(e_val), f: parseFloat(f_val), x0: parseFloat(x0), y0: parseFloat(y0),
        t_fin: parseFloat(tFin), h: parseFloat(hStep),
        x_min: -5, x_max: 5, y_min: -5, y_max: 5, cantidad_trayectorias: 16
      };
      const res = await dynamic2DLinearService.solve(payload);
      setResultado(res.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al resolver el sistema 2D');
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
        line: { color: 'rgba(160, 160, 160, 0.3)', width: 1 },
        showlegend: idx === 0, name: 'Flujo del espacio'
      });
    });

    resultado.real_eigenvectors_lines.forEach((line, idx) => {
      traces.push({
        x: [line[0][0], line[1][0]], y: [line[0][1], line[1][1]],
        type: 'scatter', mode: 'lines', line: { color: '#dc2626', width: 1.5, dash: 'dashdot' },
        showlegend: idx === 0, name: 'Autovectores'
      });
    });

    if (resultado.nulclina_x.puntos.length > 0) {
      traces.push({
        x: resultado.nulclina_x.puntos.map(p => p[0]), y: resultado.nulclina_x.puntos.map(p => p[1]),
        type: 'scatter', mode: 'lines', line: { color: '#2563eb', width: 2, dash: 'dash' }, name: 'Nulclina dx/dt=0'
      });
    }
    if (resultado.nulclina_y.puntos.length > 0) {
      traces.push({
        x: resultado.nulclina_y.puntos.map(p => p[0]), y: resultado.nulclina_y.puntos.map(p => p[1]),
        type: 'scatter', mode: 'lines', line: { color: '#d97706', width: 2, dash: 'dash' }, name: 'Nulclina dy/dt=0'
      });
    }

    traces.push({
      x: resultado.principal_trajectory.x, y: resultado.principal_trajectory.y,
      type: 'scatter', mode: 'lines', line: { color: '#111827', width: 2 }, name: 'Trayectoria Principal'
    });

    traces.push({
      x: [parseFloat(x0)], y: [parseFloat(y0)], type: 'scatter', mode: 'markers',
      marker: { color: '#059669', size: 10 }, name: 'Condición Inicial'
    });

    if (resultado.equilibrio_unico && resultado.equilibrio) {
      traces.push({
        x: [resultado.equilibrio.x], y: [resultado.equilibrio.y], type: 'scatter', mode: 'markers',
        marker: { color: '#dc2626', size: 12, symbol: 'x' }, name: 'Punto de Equilibrio'
      });
    }

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
      <h1>Sistemas Dinámicos 2D Lineales</h1>

        <div className="theory-section">
        <h3>Ecuaciones del Sistema</h3>

        <FormulaDisplay
            formula={"\\left\\{\\begin{array}{l} x' = ax + by + e \\\\ y' = cx + dy + f \\end{array}\\right."}
        />
        </div>

      <div className="method-container">
        <div className="form-section">
          <h2>Parámetros de Entrada</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <div className="form-group"><label>a:</label><input type="number" value={a} onChange={e => setA(e.target.value)} /></div>
            <div className="form-group"><label>b:</label><input type="number" value={b} onChange={e => setB(e.target.value)} /></div>
            <div className="form-group"><label>c:</label><input type="number" value={c} onChange={e => setC(e.target.value)} /></div>
            <div className="form-group"><label>d:</label><input type="number" value={d} onChange={e => setD(e.target.value)} /></div>
            <div className="form-group"><label>e (constante):</label><input type="number" value={e_val} onChange={e => setE(e.target.value)} /></div>
            <div className="form-group"><label>f (constante):</label><input type="number" value={f_val} onChange={e => setF(e.target.value)} /></div>
          </div>

          <h3>Condiciones Iniciales</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <div className="form-group"><label>x(0):</label><input type="number" value={x0} onChange={e => setX0(e.target.value)} /></div>
            <div className="form-group"><label>y(0):</label><input type="number" value={y0} onChange={e => setY0(e.target.value)} /></div>
          </div>

          <h3>Simulación</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <div className="form-group"><label>Tiempo Fin:</label><input type="number" value={tFin} onChange={e => setTFin(e.target.value)} /></div>
            <div className="form-group"><label>Paso h:</label><input type="number" value={hStep} onChange={e => setHStep(e.target.value)} /></div>
          </div>

          <button type="button" className="btn-primary" style={{ marginTop: '14px', width: '100%' }} onClick={handleSolve} disabled={loading}>
            {loading ? 'Simulando...' : 'Calcular y Graficar'}
          </button>
        </div>

        <div className="result-section">
          <h2>Resultados del Sistema</h2>
          {error && <div className="error-box">{error}</div>}

          {resultado && (
            <>
              {/* Bloque de Matriz Estructural */}
              <div className="result-box">
                <div className="validation-title">Matriz Estructural (A) y Vector Coeficientes (B)</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '32px', padding: '12px', background: '#fff', border: '1px solid #ccc', marginTop: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'monospace', fontSize: '15px' }}>
                    <span style={{ fontWeight: 'bold' }}>A =</span>
                    <div style={{ borderLeft: '2px solid #111827', borderRight: '2px solid #111827', padding: '0 10px', textAlign: 'center', lineHeight: '1.5' }}>
                      <div>{resultado.matrix_a[0][0]} &nbsp;&nbsp; {resultado.matrix_a[0][1]}</div>
                      <div>{resultado.matrix_a[1][0]} &nbsp;&nbsp; {resultado.matrix_a[1][1]}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'monospace', fontSize: '15px' }}>
                    <span style={{ fontWeight: 'bold' }}>B =</span>
                    <div style={{ borderLeft: '2px solid #111827', borderRight: '2px solid #111827', padding: '0 10px', textAlign: 'center', lineHeight: '1.5' }}>
                      <div>{resultado.vector_b[0]}</div>
                      <div>{resultado.vector_b[1]}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Caja de Estabilidad */}
              <div className="result-box">
                <div className="validation-title">Equilibrio y Clasificación de Estabilidad</div>
                <div className="validation-box">
                  <div className="validation-row">
                    <span className="validation-label">Punto (x*, y*):</span>
                    <span>{resultado.equilibrio_unico && resultado.equilibrio ? `(${resultado.equilibrio.x.toFixed(4)}, ${resultado.equilibrio.y.toFixed(4)})` : 'No posee equilibrio único o existen infinitos'}</span>
                  </div>
                  <div className="validation-row">
                    <span className="validation-label">Traza (τ):</span>
                    <span>{resultado.traza.toFixed(4)}</span>
                  </div>
                  <div className="validation-row">
                    <span className="validation-label">Determinante (Δ):</span>
                    <span>{resultado.determinante.toFixed(4)}</span>
                  </div>
                  <div className="validation-row">
                    <span className="validation-label">Discriminante:</span>
                    <span>{resultado.discriminante.toFixed(4)}</span>
                  </div>
                  <div className="validation-row">
                    <span className="validation-label">Clasificación:</span>
                    <span>{resultado.clasificacion}</span>
                  </div>
                  <div className="validation-row">
                    <span className="validation-label">Conclusión Analítica:</span>
                    <span>El sistema presenta un equilibrio en su retrato de fase clasificado como {resultado.clasificacion}. {resultado.comportamiento}</span>
                  </div>
                </div>
              </div>

              {/* Propiedades de Espectro y Nulclinas (Ahora Despejadas) */}
              <div className="result-box">
                <div className="validation-title">Espectro y Ecuaciones de las Nulclinas</div>
                <div className="validation-box">
                  {resultado.autovalores.map((av, idx) => (
                    <div key={`av-${idx}`} className="validation-row" style={{ fontFamily: 'monospace' }}>
                      <span className="validation-label">Autovalor λ_{idx+1}:</span>
                      <span>{av.real.toFixed(4)} {av.imag >= 0 ? `+ ${av.imag.toFixed(4)}` : `- ${Math.abs(av.imag).toFixed(4)}`}i</span>
                    </div>
                  ))}
                  {resultado.autovectores.map((v, idx) => (
                    <div key={`v-${idx}`} className="validation-row" style={{ fontFamily: 'monospace' }}>
                      <span className="validation-label">Autovector v_{idx+1}:</span>
                      <span>[{v.vx.toFixed(4)}, {v.vy.toFixed(4)}]^T</span>
                    </div>
                  ))}
                  <div className="validation-row">
                    <span className="validation-label">Nulclina dx/dt = 0:</span>
                    <span>{resultado.nulclina_x.ecuacion_despejada}</span>
                  </div>
                  <div className="validation-row">
                    <span className="validation-label">Nulclina dy/dt = 0:</span>
                    <span>{resultado.nulclina_y.ecuacion_despejada}</span>
                  </div>
                </div>
              </div>

              {/* Solución Analítica */}
              <div className="result-box">
                <div className="validation-title">Solución Analítica Exacta</div>
                {resultado.solucion_analitica_latex && resultado.solucion_analitica_latex.length > 0 ? (
                  <div className="validation-box" style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {resultado.solucion_analitica_latex.map((eq, idx) => (
                      <FormulaDisplay key={idx} formula={eq} />
                    ))}
                  </div>
                ) : (
                  <div className="error-box" style={{ marginTop: '8px' }}>
                    {resultado.solucion_analitica}
                  </div>
                )}
              </div>

              {/* Secciones de Gráficos de Plotly */}
              {phasePlotData && (
                <div style={{ marginBottom: '16px' }}>
                  <PlotlyGraph data={phasePlotData} title="Retrato de Fase 2D" layout={{ xaxis: { title: 'Variable X', range: [-5, 5] }, yaxis: { title: 'Variable Y', range: [-5, 5] } }} />
                </div>
              )}

              {timePlotData && (
                <PlotlyGraph data={timePlotData} title="Evolución Temporal" layout={{ xaxis: { title: 'Tiempo (t)' }, yaxis: { title: 'Estado de las Variables' } }} />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}