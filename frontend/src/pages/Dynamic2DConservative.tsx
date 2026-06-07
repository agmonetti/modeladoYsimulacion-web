// frontend/src/pages/Dynamic2DConservative.tsx
import React, { useMemo, useState } from "react";
import PlotlyGraph from "../components/PlotlyGraph";
import FormulaDisplay from "../components/FormulaDisplay";
import { dynamic2DConservativeService } from "../services/api";
import "../styles/Method.css";

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
  divergencia_latex: string;
  es_conservativo: boolean;
  hamiltoniano_latex: string;
  dh_dx_latex: string;
  dh_dy_latex: string;
  dh_dt_raw_latex: string;
  dh_dt_simplified_latex: string;
  saddle_energies: number[];
  puntos_analizados: AnalisisPunto[];
  principal_trajectory: { t: number[]; x: number[]; y: number[] };
  automatic_trajectories: { x: number[]; y: number[] }[];
  contour_data: { x_axis: number[]; y_axis: number[]; z_H: number[][] };
};

export default function Dynamic2DConservative() {
  const [eqX, setEqX] = useState("y");
  const [eqY, setEqY] = useState("x - x^3");
  const [muParam, setMuParam] = useState("");
  const [x0, setX0] = useState("0.1");
  const [y0, setY0] = useState("0.0");
  const [tFin, setTFin] = useState("15");
  const [hStep, setHStep] = useState("0.02");
  const [domain, setDomain] = useState("2.5");

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
      const d = parseInput(domain, 2.5);
      const payload = {
        eq_x: eqX,
        eq_y: eqY,
        mu: parseInput(muParam, 0),
        x0: parseInput(x0, 0.1),
        y0: parseInput(y0, 0.0),
        t_fin: parseInput(tFin, 15),
        h: parseInput(hStep, 0.02),
        x_min: -d,
        x_max: d,
        y_min: -d,
        y_max: d,
        cantidad_trayectorias: 25,
      };
      const res = await dynamic2DConservativeService.solve(payload);
      setResultado(res.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Error al procesar el sistema");
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
        line: { color: "rgba(160, 160, 160, 0.4)", width: 1.5 },
        hoverinfo: "none",
        showlegend: idx === 0,
        name: "Órbitas (Flujo RK4)",
      });
    });

    if (resultado.es_conservativo && resultado.saddle_energies.length > 0) {
      resultado.saddle_energies.forEach((energy, idx) => {
        traces.push({
          x: resultado.contour_data.x_axis,
          y: resultado.contour_data.y_axis,
          z: resultado.contour_data.z_H,
          type: "contour",
          coloring: "none",
          contours: {
            coloring: "none",
            showlines: true,
            start: energy,
            end: energy,
            size: 1,
          },
          line: { color: "#dc2626", width: 3 },
          showscale: false,
          name: idx === 0 ? "Separatriz Exacta H(x,y)" : "",
          hoverinfo: "none",
          showlegend: idx === 0,
        });
      });
    }

    traces.push({
      x: resultado.principal_trajectory.x,
      y: resultado.principal_trajectory.y,
      type: "scatter",
      mode: "lines",
      line: { color: "#111827", width: 2.5 },
      name: "Partícula Principal",
    });

    traces.push({
      x: [parseInput(x0, 0.1)],
      y: [parseInput(y0, 0.0)],
      type: "scatter",
      mode: "markers",
      marker: {
        color: "#059669",
        size: 10,
        line: { color: "#fff", width: 1.5 },
      },
      name: "Condición Inicial",
    });

    resultado.puntos_analizados.forEach((pto, idx) => {
      traces.push({
        x: [pto.x],
        y: [pto.y],
        type: "scatter",
        mode: "markers",
        marker: {
          color: pto.clasificacion === "Silla" ? "#d97706" : "#2563eb",
          size: 12,
          symbol: pto.clasificacion === "Silla" ? "cross" : "circle",
          line: { color: "#fff", width: 2 },
        },
        showlegend: false,
        hovertext: `${pto.clasificacion} en (${pto.x.toFixed(2)}, ${pto.y.toFixed(2)})`,
      });
    });

    return traces;
  }, [resultado, x0, y0]);

  return (
    <div className="method-page">
      <h1>Sistemas Dinámicos Conservativos (Energía)</h1>

      <div className="theory-section">
        <h3>Sistemas sin Disipación</h3>
        <p>
          Un sistema es conservativo si su divergencia es cero (∇ · F = 0). Solo
          admiten Sillas y Centros, formando estructuras unidas por{" "}
          <strong>Separatrices</strong> que delimitan las órbitas cerradas
          (Energía Potencial).
        </p>
      </div>

      <div className="method-container">
        <div className="form-section">
          <h2>Mecánica Newtoniana & Hamiltoniana</h2>
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr", gap: "8px" }}
          >
            <div className="form-group">
              <label>Velocidad: dx/dt = f(x,y)</label>
              <input
                type="text"
                value={eqX}
                onChange={(e) => setEqX(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Aceleración/Fuerza: dy/dt = g(x,y)</label>
              <input
                type="text"
                value={eqY}
                onChange={(e) => setEqY(e.target.value)}
              />
            </div>
          </div>

          <h3 style={{ marginTop: "16px" }}>Variables Iniciales</h3>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "8px",
            }}
          >
            <div className="form-group">
              <label>Posición x(0):</label>
              <input
                type="number"
                step="0.1"
                value={x0}
                onChange={(e) => setX0(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Momentum y(0):</label>
              <input
                type="number"
                step="0.1"
                value={y0}
                onChange={(e) => setY0(e.target.value)}
              />
            </div>
          </div>

          <h3 style={{ marginTop: "16px" }}>Controles</h3>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: "8px",
            }}
          >
            <div className="form-group">
              <label>T Final:</label>
              <input
                type="number"
                value={tFin}
                onChange={(e) => setTFin(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Paso h:</label>
              <input
                type="number"
                step="0.01"
                value={hStep}
                onChange={(e) => setHStep(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Dominio ±:</label>
              <input
                type="number"
                step="0.5"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
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
            {loading ? "Calculando Energía..." : "Analizar Sistema"}
          </button>
        </div>

        <div className="result-section">
          <h2>Validación y Conservación</h2>
          {error && <div className="error-box">{error}</div>}

          {resultado && (
            <>
              {/* Divergencia y Energia */}
              <div className="result-box">
                <div className="validation-title">
                  1. Propiedades del Campo Vectorial
                </div>
                <div className="validation-box">
                  <div
                    className="validation-row"
                    style={{ alignItems: "center" }}
                  >
                    <span className="validation-label">Divergencia (∇·F):</span>
                    <FormulaDisplay
                      formula={`\\frac{\\partial f}{\\partial x} + \\frac{\\partial g}{\\partial y} = ${resultado.divergencia_latex}`}
                    />
                  </div>
                  <div className="validation-row">
                    <span className="validation-label">Estado Físico:</span>
                    <span
                      style={{
                        fontWeight: "bold",
                        color: resultado.es_conservativo
                          ? "#059669"
                          : "#dc2626",
                      }}
                    >
                      {resultado.es_conservativo
                        ? "SISTEMA CONSERVATIVO (Volumen Constante)"
                        : "SISTEMA DISIPATIVO (Existe Fricción)-> El sistema no es conservativo"}
                    </span>
                  </div>
                  {resultado.es_conservativo && (
                    <div
                      className="validation-row"
                      style={{
                        alignItems: "center",
                        marginTop: "8px",
                        paddingTop: "8px",
                        borderTop: "1px solid #ccc",
                      }}
                    >
                      <span
                        className="validation-label"
                        style={{ color: "#4f46e5" }}
                      >
                        Hamiltoniano H(x,y):
                      </span>
                      <FormulaDisplay
                        formula={`H(x,y) = ${resultado.hamiltoniano_latex}`}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Demostracion dH/dt */}
              {resultado.es_conservativo && (
                <div
                  className="result-box"
                  style={{ borderColor: "#10b981", borderWidth: "2px" }}
                >
                  <div
                    className="validation-title"
                    style={{
                      background: "#d1fae5",
                      color: "#047857",
                      borderBottom: "1px solid #a7f3d0",
                    }}
                  >
                    2. Demostración Matemática (Conservación de la Energía)
                  </div>
                  <div
                    className="validation-box"
                    style={{ background: "#f8fafc", padding: "16px" }}
                  >
                    <p
                      style={{
                        margin: "0 0 12px 0",
                        fontSize: "13px",
                        color: "#475569",
                      }}
                    >
                      Aplicando la regla de la cadena para evaluar la variación
                      de la energía total respecto al tiempo:
                    </p>

                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "12px",
                        alignItems: "center",
                      }}
                    >
                      <FormulaDisplay
                        formula={`\\frac{dH}{dt} = \\frac{\\partial H}{\\partial x}\\dot{x} + \\frac{\\partial H}{\\partial y}\\dot{y}`}
                      />

                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        <span style={{ fontWeight: "bold", fontSize: "18px" }}>
                          =
                        </span>
                        <FormulaDisplay
                          formula={`\\left( ${resultado.dh_dx_latex} \\right) \\cdot \\left( ${resultado.ecuacion_latex_x} \\right) + \\left( ${resultado.dh_dy_latex} \\right) \\cdot \\left( ${resultado.ecuacion_latex_y} \\right)`}
                        />
                      </div>

                      {resultado.dh_dt_raw_latex !==
                        resultado.dh_dt_simplified_latex && (
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                          }}
                        >
                          <span
                            style={{ fontWeight: "bold", fontSize: "18px" }}
                          >
                            =
                          </span>
                          <FormulaDisplay formula={resultado.dh_dt_raw_latex} />
                        </div>
                      )}

                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          background: "#dcfce7",
                          padding: "4px 12px",
                          border: "1px solid #86efac",
                          borderRadius: "4px",
                        }}
                      >
                        <span
                          style={{
                            fontWeight: "bold",
                            fontSize: "18px",
                            color: "#15803d",
                          }}
                        >
                          =
                        </span>
                        <span
                          style={{
                            fontWeight: "bold",
                            fontSize: "20px",
                            color: "#15803d",
                          }}
                        >
                          {resultado.dh_dt_simplified_latex}
                        </span>
                      </div>
                    </div>
                    <p
                      style={{
                        margin: "12px 0 0 0",
                        textAlign: "center",
                        fontWeight: "bold",
                        color: "#15803d",
                      }}
                    >
                      El sistema no pierde energía a lo largo de sus
                      trayectorias
                    </p>
                  </div>
                </div>
              )}

              {/* Analisis Topologico */}
              <div className="result-box">
                <div className="validation-title">
                  3. Puntos Críticos y Estabilidad
                </div>
                <div className="validation-box">
                  {resultado.puntos_analizados.length === 0 && (
                    <span>No se detectaron puntos de equilibrio.</span>
                  )}
                  {resultado.puntos_analizados.map((pto, idx) => (
                    <div
                      key={idx}
                      style={{
                        marginBottom:
                          idx < resultado.puntos_analizados.length - 1
                            ? "12px"
                            : "0",
                        paddingBottom:
                          idx < resultado.puntos_analizados.length - 1
                            ? "12px"
                            : "0",
                        borderBottom:
                          idx < resultado.puntos_analizados.length - 1
                            ? "1px solid #e5e7eb"
                            : "none",
                      }}
                    >
                      <div className="validation-row">
                        <span className="validation-label">
                          P_{idx + 1}: ({pto.x.toFixed(2)}, {pto.y.toFixed(2)})
                        </span>
                        <span
                          style={{
                            fontWeight: "bold",
                            color:
                              pto.clasificacion === "Silla"
                                ? "#d97706"
                                : "#2563eb",
                          }}
                        >
                          {pto.clasificacion}
                        </span>
                      </div>
                      <div className="validation-row">
                        <span
                          className="validation-label"
                          style={{ fontSize: "12px", color: "#6b7280" }}
                        >
                          Det(J): {pto.determinante.toFixed(2)}
                        </span>
                        <span style={{ fontSize: "13px" }}>
                          {pto.comportamiento}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Graficos */}
              {phasePlotData && (
                <div
                  style={{
                    marginBottom: "16px",
                    border: "1px solid #ccc",
                    borderRadius: "4px",
                    overflow: "hidden",
                  }}
                >
                  <PlotlyGraph
                    data={phasePlotData}
                    title="Retrato de Fase (Separatriz en Rojo)"
                    layout={{
                      xaxis: {
                        title: "Posición (x)",
                        range: [-parseFloat(domain), parseFloat(domain)],
                      },
                      yaxis: {
                        title: "Velocidad (y)",
                        range: [-parseFloat(domain), parseFloat(domain)],
                      },
                      showlegend: true,
                    }}
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
