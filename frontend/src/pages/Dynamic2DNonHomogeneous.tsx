import React, { useMemo, useState } from 'react';
import PlotlyGraph from '../components/PlotlyGraph';
import FormulaDisplay from '../components/FormulaDisplay';
import { dynamic2DNonHomogeneousService } from '../services/api';
import '../styles/Method.css';

type AutoTrajectory = { x: number[]; y: number[] };
type Autovalor = { real: number; imag: number };
type Autovector = { vx: number; vy: number };

type SolveResponse = {
  matrix_a: number[][];
  vector_b: number[];
  traza: number;
  determinante: number;
  clasificacion_homogenea: string;
  comportamiento: string;
  equilibrio: { x: number; y: number } | null;
  autovalores: Autovalor[];
  autovectores: Autovector[];
  solucion_homogenea_latex: string[];
  solucion_particular_latex: string[];
  solucion_general_latex: string[];
  principal_trajectory: { t: number[]; x: number[]; y: number[] };
  automatic_trajectories: AutoTrajectory[];
  real_eigenvectors_lines: number[][][];
};

export default function Dynamic2DNonHomogeneous() {
  const [a, setA] = useState('0');
  const [b, setB] = useState('-1');
  const [c, setC] = useState('-9');
  const [d, setD] = useState('0');
  const [e_val, setE] = useState('1');
  const [f_val, setF] = useState('9');
  const [x0, setX0] = useState('2');
  const [y0, setY0] = useState('2');
  const [tFin, setTFin] = useState('5');
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
        x_min: -5, x_max: 5, y_min: -5, y_max: 5, cantidad_trayectorias: 20
      };
      const res = await dynamic2DNonHomogeneousService.solve(payload);
      setResultado(res.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al resolver el sistema');
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
        showlegend: false, name: 'Flujo'
      });
    });

    resultado.real_eigenvectors_lines.forEach((line, idx) => {
        traces.push({
          x: [line[0][0], line[1][0]], y: [line[0][1], line[1][1]],
          type: 'scatter', mode: 'lines', line: { color: '#ef4444', width: 1.5, dash: 'dot' },
          showlegend: idx === 0, name: 'Dirección Autovectores'
        });
      });

    traces.push({
      x: resultado.principal_trajectory.x, y: resultado.principal_trajectory.y,
      type: 'scatter', mode: 'lines', line: { color: '#1e3a8a', width: 2.5 }, name: 'Trayectoria Principal'
    });

    traces.push({
      x: [parseFloat(x0)], y: [parseFloat(y0)], type: 'scatter', mode: 'markers',
      marker: { color: '#16a34a', size: 10, symbol: 'circle' }, name: 'Condición Inicial'
    });

    if (resultado.equilibrio) {
      traces.push({
        x: [resultado.equilibrio.x], y: [resultado.equilibrio.y], type: 'scatter', mode: 'markers',
        marker: { color: '#ca8a04', size: 12, symbol: 'x' }, name: 'Punto de Equilibrio (Xp)'
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
      <h1>Sistemas Dinámicos 2D No Homogéneos</h1>
      <div className="theory-section">
        <p>Análisis de sistemas de la forma <strong>X' = AX + B</strong>, donde <strong>B</strong> es un vector constante.</p>
        <FormulaDisplay formula={"\\mathbf{X}(t) = \\mathbf{X}_h(t) + \\mathbf{X}_p"} />
        <p>La solución general es la suma de la solución homogénea y una solución particular (el punto de equilibrio del sistema no homogéneo).</p>
      </div>

      <div className="method-container">
        <div className="form-section">
          <h2>Parámetros del Sistema</h2>
          <div className="matrix-input-grid">
            <div className="form-group"><label>a:</label><input type="number" value={a} onChange={e => setA(e.target.value)} /></div>
            <div className="form-group"><label>b:</label><input type="number" value={b} onChange={e => setB(e.target.value)} /></div>
            <div className="form-group"><label>c:</label><input type="number" value={c} onChange={e => setC(e.target.value)} /></div>
            <div className="form-group"><label>d:</label><input type="number" value={d} onChange={e => setD(e.target.value)} /></div>
          </div>
          
          <h2>Vector de Forzamiento (B)</h2>
          <div className="vector-input-grid">
            <div className="form-group"><label>e:</label><input type="number" value={e_val} onChange={e => setE(e.target.value)} /></div>
            <div className="form-group"><label>f:</label><input type="number" value={f_val} onChange={e => setF(e.target.value)} /></div>
          </div>

          <h2>Condiciones Iniciales y Simulación</h2>
          <div className="initial-conditions-grid">
            <div className="form-group"><label>x(0):</label><input type="number" value={x0} onChange={e => setX0(e.target.value)} /></div>
            <div className="form-group"><label>y(0):</label><input type="number" value={y0} onChange={e => setY0(e.target.value)} /></div>
            <div className="form-group"><label>T Fin:</label><input type="number" value={tFin} onChange={e => setTFin(e.target.value)} /></div>
            <div className="form-group"><label>Paso (h):</label><input type="number" value={hStep} onChange={e => setHStep(e.target.value)} /></div>
          </div>

          <button type="button" className="btn-primary" onClick={handleSolve} disabled={loading}>
            {loading ? 'Calculando...' : 'Resolver Sistema'}
          </button>
        </div>

        <div className="result-section">
          <h2>Resultados del Análisis</h2>
          {error && <div className="error-box">{error}</div>}

          {resultado && (
            <>
              <div className="result-box">
                <div className="validation-title">1. Análisis del Sistema Homogéneo (X' = AX)</div>
                <div className="validation-box">
                  <div className="validation-row"><span>Clasificación:</span> <span>{resultado.clasificacion_homogenea}</span></div>
                  <div className="validation-row"><span>Traza (τ):</span> <span>{resultado.traza.toFixed(4)}</span></div>
                  <div className="validation-row"><span>Determinante (Δ):</span> <span>{resultado.determinante.toFixed(4)}</span></div>
                  <div className="validation-row"><span>Comportamiento:</span> <span>{resultado.comportamiento}</span></div>
                </div>
              </div>

              <div className="result-box">
                <div className="validation-title">2. Autovalores y Autovectores de A</div>
                <div className="validation-box">
                  {resultado.autovalores.map((av, idx) => (
                    <div key={idx} className="validation-row"><span>λ_{idx+1}:</span> <span>{av.real.toFixed(4)} {av.imag >= 0 ? '+' : '-'} {Math.abs(av.imag).toFixed(4)}i</span></div>
                  ))}
                  {resultado.autovectores.map((v, idx) => (
                    <div key={idx} className="validation-row"><span>v_{idx+1}:</span> <span>[{v.vx.toFixed(4)}, {v.vy.toFixed(4)}]</span></div>
                  ))}
                </div>
              </div>

              <div className="result-box">
                <div className="validation-title">3. Solución Homogénea (Xh)</div>
                <div className="validation-box">
                  {resultado.solucion_homogenea_latex.map((eq, idx) => <FormulaDisplay key={idx} formula={eq} />)}
                </div>
              </div>

              <div className="result-box">
                <div className="validation-title">4. Solución Particular (Xp)</div>
                <div className="validation-box">
                  {resultado.solucion_particular_latex.map((eq, idx) => <p key={idx}>{eq}</p>)}
                </div>
              </div>

              <div className="result-box">
                <div className="validation-title">5. Solución General (X = Xh + Xp)</div>
                <div className="validation-box">
                  {resultado.solucion_general_latex.map((eq, idx) => <FormulaDisplay key={idx} formula={eq} />)}
                </div>
              </div>

              {phasePlotData && (
                <PlotlyGraph data={phasePlotData} title="Retrato de Fase" layout={{ xaxis: { title: 'x' }, yaxis: { title: 'y' } }} />
              )}

              {timePlotData && (
                <PlotlyGraph data={timePlotData} title="Evolución Temporal" layout={{ xaxis: { title: 'Tiempo (t)' }, yaxis: { title: 'Valor' } }} />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
