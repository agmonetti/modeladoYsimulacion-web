// frontend/src/pages/Dynamic2DLanchester.tsx
import React, { useMemo, useState } from "react";
import PlotlyGraph from "../components/PlotlyGraph";
import FormulaDisplay from "../components/FormulaDisplay";
import LanchesterKeyboard from "../components/LanchesterKeyboard";
import api from "../services/api";
import "../styles/Method.css";

type SolveResponse = {
  ecuacion_latex_x: string;
  ecuacion_latex_y: string;
  dx_dt_0: number;
  dy_dt_0: number;
  is_classic: boolean;
  C_val: number;
  state_eq_latex: string;
  winner_analytic: string;
  survivors_analytic: number;
  t_end_analytic: number;
  t_end_numeric_str: string;
  winner_numeric: string;
  final_x: number;
  final_y: number;
  principal_trajectory: { t: number[]; x: number[]; y: number[] };
  automatic_trajectories: { x: number[]; y: number[] }[];
};

export default function Dynamic2DLanchester() {
  const [eqX, setEqX] = useState("-α * y");
  const [eqY, setEqY] = useState("-β * x");

  const [alpha, setAlpha] = useState("1");
  const [beta, setBeta] = useState("2");
  const [gamma, setGamma] = useState("0");
  const [epsilon, setEpsilon] = useState("0");
  const [mu, setMu] = useState("0");
  const [delta, setDelta] = useState("0");

  const [x0, setX0] = useState("100");
  const [y0, setY0] = useState("80");
  const [tFin, setTFin] = useState("5");
  const [hStep, setHStep] = useState("0.01");

  const [showKeyboardX, setShowKeyboardX] = useState(false);
  const [showKeyboardY, setShowKeyboardY] = useState(false);

  const [resultado, setResultado] = useState<SolveResponse | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const parseInput = (value: string, defaultVal: number) => {
    if (value.trim() === "") return defaultVal;
    const parsed = parseFloat(value);
    return isNaN(parsed) ? defaultVal : parsed;
  };

  const handleSolve = async () => {
    setError("");
    setResultado(null);
    setLoading(true);
    try {
      const payload = {
        eq_x: eqX,
        eq_y: eqY,
        alpha: parseInput(alpha, 1),
        beta: parseInput(beta, 2),
        gamma: parseInput(gamma, 0),
        epsilon: parseInput(epsilon, 0),
        mu: parseInput(mu, 0),
        delta: parseInput(delta, 0),
        x0: parseInput(x0, 100),
        y0: parseInput(y0, 80),
        t0: 0,
        t_fin: parseInput(tFin, 5),
        h: parseInput(hStep, 0.01),
      };
      const res = await api.post("/dynamic-2d-lanchester/solve", payload);
      setResultado(res.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Error al simular el combate");
    } finally {
      setLoading(false);
    }
  };

  const phasePlotData = useMemo(() => {
    if (!resultado) return null;
    const traces: any[] = [];

    resultado.automatic_trajectories.forEach((traj, idx) => {
      traces.push({
        x: traj.x,
        y: traj.y,
        type: "scatter",
        mode: "lines",
        line: { color: "rgba(180, 180, 180, 0.3)", width: 1.5 },
        hoverinfo: "none",
        showlegend: idx === 0,
        name: "Posibles Combates (Hipérbolas)",
      });
    });

    traces.push({
      x: resultado.principal_trajectory.x,
      y: resultado.principal_trajectory.y,
      type: "scatter",
      mode: "lines",
      line: { color: "#dc2626", width: 3 },
      name: "Combate Principal",
    });

    traces.push({
      x: [parseInput(x0, 100)],
      y: [parseInput(y0, 80)],
      type: "scatter",
      mode: "markers",
      marker: { color: "#059669", size: 12, symbol: "circle" },
      name: "Fuerzas Iniciales",
    });

    traces.push({
      x: [resultado.final_x],
      y: [resultado.final_y],
      type: "scatter",
      mode: "markers",
      marker: { color: "#111827", size: 14, symbol: "x" },
      name: "Fin del Combate",
    });

    return traces;
  }, [resultado, x0, y0]);

  const timePlotData = useMemo(() => {
    if (!resultado) return null;
    return [
      {
        x: resultado.principal_trajectory.t,
        y: resultado.principal_trajectory.x,
        type: "scatter",
        mode: "lines",
        name: "Ejército X (Rojo)",
        line: { color: "#dc2626", width: 2 },
      },
      {
        x: resultado.principal_trajectory.t,
        y: resultado.principal_trajectory.y,
        type: "scatter",
        mode: "lines",
        name: "Ejército Y (Azul)",
        line: { color: "#2563eb", width: 2 },
      },
    ];
  }, [resultado]);

  return (
    <div className="method-page">
      <h1>Modelos de Combate (Lanchester) y Parametrización</h1>

      <div className="theory-section">
        <h3>Eliminación del Tiempo y Ecuación de Estado</h3>
        <p>
          Mediante la sustitución dy/dx = g(x, y) / f(x, y) eliminamos el tiempo
          t para hallar la trayectoria paramétrica del combate. En el modelo
          clásico de Lanchester, esto genera hipérbolas definidas por una
          constante C que predice al ganador absoluto sin necesidad de simular
          el tiempo.
        </p>
      </div>

      <div className="method-container">
        <div className="form-section">
          <h2>Tasas de Bajas / Dinámica</h2>
          <div className="form-group">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <label>dx/dt (Pérdidas Ejército Rojo):</label>
              <button
                type="button"
                onClick={() => setShowKeyboardX(!showKeyboardX)}
              >
                {showKeyboardX ? "✖ Cerrar" : "⌨ Teclado"}
              </button>
            </div>
            <input
              type="text"
              value={eqX}
              onChange={(e) => setEqX(e.target.value)}
            />
            {showKeyboardX && (
              <LanchesterKeyboard
                onInsert={(text) => setEqX(eqX + text)}
                onClear={() => setEqX("")}
              />
            )}
          </div>

          <div className="form-group">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <label>dy/dt (Pérdidas Ejército Azul):</label>
              <button
                type="button"
                onClick={() => setShowKeyboardY(!showKeyboardY)}
              >
                {showKeyboardY ? "✖ Cerrar" : "⌨ Teclado"}
              </button>
            </div>
            <input
              type="text"
              value={eqY}
              onChange={(e) => setEqY(e.target.value)}
            />
            {showKeyboardY && (
              <LanchesterKeyboard
                onInsert={(text) => setEqY(eqY + text)}
                onClear={() => setEqY("")}
              />
            )}
          </div>

          <h3>Parámetros</h3>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: "10px",
            }}
          >
            <div className="form-group">
              <label>α:</label>
              <input
                type="number"
                step="0.01"
                value={alpha}
                onChange={(e) => setAlpha(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>β:</label>
              <input
                type="number"
                step="0.01"
                value={beta}
                onChange={(e) => setBeta(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>γ:</label>
              <input
                type="number"
                step="0.01"
                value={gamma}
                onChange={(e) => setGamma(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>ε:</label>
              <input
                type="number"
                step="0.01"
                value={epsilon}
                onChange={(e) => setEpsilon(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>μ:</label>
              <input
                type="number"
                step="0.01"
                value={mu}
                onChange={(e) => setMu(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>δ:</label>
              <input
                type="number"
                step="0.01"
                value={delta}
                onChange={(e) => setDelta(e.target.value)}
              />
            </div>
          </div>

          <h3>Tropas Iniciales</h3>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "8px",
            }}
          >
            <div className="form-group">
              <label>x(0) Rojo:</label>
              <input
                type="number"
                value={x0}
                onChange={(e) => setX0(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>y(0) Azul:</label>
              <input
                type="number"
                value={y0}
                onChange={(e) => setY0(e.target.value)}
              />
            </div>
          </div>

          <h3>Simulación</h3>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "8px",
            }}
          >
            <div className="form-group">
              <label>T Máximo:</label>
              <input
                type="number"
                value={tFin}
                onChange={(e) => setTFin(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Paso RK4 h:</label>
              <input
                type="number"
                step="0.01"
                value={hStep}
                onChange={(e) => setHStep(e.target.value)}
              />
            </div>
          </div>

          <button
            type="button"
            className="btn-primary"
            style={{ marginTop: "14px", width: "100%" }}
            onClick={handleSolve}
            disabled={loading}
          >
            {loading ? "Simulando..." : "Iniciar Combate"}
          </button>
        </div>

        <div className="result-section">
          <h2>Análisis y Reporte del Combate</h2>
          {error && <div className="error-box">{error}</div>}

          {resultado && (
            <>
              <div className="result-box">
                <div className="validation-title">
                  Sistemas Ecuaciones Original
                </div>
                <FormulaDisplay
                  formula={`\\begin{cases} \\dot{x} = ${resultado.ecuacion_latex_x} \\\\ \\dot{y} = ${resultado.ecuacion_latex_y} \\end{cases}`}
                />
              </div>

              <div className="result-box">
                <div className="validation-title">Velocidad Inicial (t=0)</div>
                <div className="validation-box">
                  <div className="validation-row">
                    <span className="validation-label">dx/dt:</span>
                    <span>{resultado.dx_dt_0.toFixed(2)}</span>
                  </div>
                  <div className="validation-row">
                    <span className="validation-label">dy/dt:</span>
                    <span>{resultado.dy_dt_0.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {resultado.is_classic ? (
                <div className="result-box">
                  <div className="validation-title">Análisis Analítico</div>
                  <div className="validation-box">
                    <div
                      style={{
                        textAlign: "center",
                        padding: "6px",
                        background: "#f0f0f0",
                        border: "1px inset #808080",
                        margin: "8px 0",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "14px",
                          fontWeight: "bold",
                          fontFamily: "monospace",
                        }}
                      >
                        C = {resultado.C_val.toFixed(2)}
                      </span>
                    </div>
                    <div className="validation-row">
                      <span className="validation-label">Eq. de Fase:</span>
                      <FormulaDisplay formula={resultado.state_eq_latex} />
                    </div>
                    <div className="validation-row">
                      <span className="validation-label">Ganador Teórico:</span>
                      <strong>{resultado.winner_analytic}</strong>
                    </div>
                    {resultado.t_end_analytic > 0 && (
                      <div className="validation-row">
                        <span className="validation-label">
                          Tiempo Teórico Final:
                        </span>
                        <span>t = {resultado.t_end_analytic.toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div
                  className="result-box"
                  style={{ borderColor: "#f59e0b", borderWidth: "2px" }}
                >
                  <div
                    className="validation-title"
                    style={{
                      background: "#fef3c7",
                      color: "#b45309",
                      borderBottom: "1px solid #fde68a",
                    }}
                  >
                    Análisis Analítico (Modelo Modificado)
                  </div>
                  <div className="validation-box">
                    <p
                      style={{
                        fontSize: "13px",
                        margin: "0 0 8px 0",
                        color: "#4b5563",
                      }}
                    >
                      El sistema ingresado (ej. fuego no dirigido o variables
                      extra) rompe la <strong>Ley Cuadrática Clásica</strong> de
                      Lanchester.
                    </p>
                    <div
                      style={{
                        background: "#fffbeb",
                        padding: "10px",
                        borderRadius: "4px",
                        border: "1px dashed #fcd34d",
                        fontSize: "13px",
                        marginBottom: "8px",
                      }}
                    >
                      <span style={{ fontWeight: "bold", color: "#b45309" }}>
                        Justificación Matemática:
                      </span>
                      <br />
                      Al plantear la eliminación del tiempo dy/dx, las diferenciales no generan cuadrados (y²,
                      x²), sino relaciones logarítmicas o exponenciales
                      complejas. Por lo tanto,{" "}
                      <strong>es matemáticamente incorrecto</strong> intentar
                      calcular una constante de combate C = α y² - β
                      x².
                    </div>
                    <span style={{ fontSize: "13px", color: "#4b5563" }}>
                      La predicción analítica se desactiva por seguridad
                      matemática. El ganador, los sobrevivientes y el tiempo de
                      finalización exacto se determinan a continuación mediante
                      el simulador numérico RK4 extendido.
                    </span>
                  </div>
                </div>
              )}

              <div className="result-box">
                <div className="validation-title">
                  Resultado de la Simulación
                </div>
                <div className="validation-box">
                  <div className="validation-row">
                    <span className="validation-label">Estado:</span>
                    <strong>{resultado.winner_numeric}</strong>
                  </div>
                  <div className="validation-row">
                    <span className="validation-label">
                      Tiempo final/proyectado:
                    </span>
                    <span>{resultado.t_end_numeric_str}</span>
                  </div>
                  <div className="validation-row">
                    <span className="validation-label">Final X:</span>
                    <span>{Math.max(0, resultado.final_x).toFixed(2)}</span>
                  </div>
                  <div className="validation-row">
                    <span className="validation-label">Final Y:</span>
                    <span>{Math.max(0, resultado.final_y).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {phasePlotData && (
                <div className="result-box">
                  <PlotlyGraph data={phasePlotData} title="Diagrama de Fase" />
                </div>
              )}
              {timePlotData && (
                <div className="result-box">
                  <PlotlyGraph data={timePlotData} title="Desgaste Temporal" />
                </div>
              )}

              <div className="result-box">
                <div className="validation-title">Tabla de Evolución</div>
                <div
                  className="iterations-table"
                  style={{ maxHeight: "250px", overflowY: "auto" }}
                >
                  <table>
                    <thead>
                      <tr>
                        <th>t</th>
                        <th>x(t)</th>
                        <th>y(t)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {resultado.principal_trajectory.t.map((tVal, idx) => (
                        <tr key={idx}>
                          <td>{tVal.toFixed(2)}</td>
                          <td>
                            {resultado.principal_trajectory.x[idx].toFixed(2)}
                          </td>
                          <td>
                            {resultado.principal_trajectory.y[idx].toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
