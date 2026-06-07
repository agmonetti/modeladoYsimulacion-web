import React, { useMemo, useState } from "react";
import PlotlyGraph from "../components/PlotlyGraph";
import FormulaDisplay from "../components/FormulaDisplay";
import { dynamic1DService, dynamic2DNonLinearService } from "../services/api";
import "../styles/Method.css";

type Equilibrium = {
  x: number;
  fprime: number | null;
  stability: string;
  stability_reason?: string;
};

type PhaseResponse = {
  x: number[];
  fx: number[];
  flow: { x: number; dir: number }[];
};

type TimeResponse = {
  t: number[];
  series: { x0: number; x: number[] }[];
};

type Solve1DResponse = {
  model: string;
  equation: string;
  params: Record<string, number>;
  equilibria: Equilibrium[];
  phase: PhaseResponse;
  time: TimeResponse;
};

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

type Solve2DResponse = {
  ecuacion_latex_x: string;
  ecuacion_latex_y: string;
  jacobiano_latex: string;
  puntos_analizados: AnalisisPunto[];
  principal_trajectory: { t: number[]; x: number[]; y: number[] };
  automatic_trajectories: { x: number[]; y: number[] }[];
  contour_data: {
    x_axis: number[];
    y_axis: number[];
    z_x_nul: number[][];
    z_y_nul: number[][];
  };
  nulclina_x_desp: string;
  nulclina_y_desp: string;
};

const parseMathExpr = (expr: string): number => {
  if (!expr || expr.trim() === "") return NaN;
  try {
    const safeExpr = expr
      .replace(/\bpi\b/gi, "Math.PI")
      .replace(/\be\b/gi, "Math.E")
      .replace(/\^/g, "**");
    const res = new Function(`return ${safeExpr}`)();
    return Number(res);
  } catch {
    return NaN;
  }
};

const parseNumberList = (raw: string): number[] => {
  const parts = raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const values = parts.map(parseMathExpr);
  if (values.some((v) => !Number.isFinite(v))) {
    return [];
  }
  return values;
};

const parseParams = (raw: string): Record<string, number> => {
  if (!raw || raw.trim() === "") return {};
  const entries = raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const params: Record<string, number> = {};
  for (const entry of entries) {
    const [keyRaw, valueRaw] = entry.split("=");
    const key = (keyRaw || "").trim();
    const value = (valueRaw || "").trim();
    if (!key || value === "") {
      throw new Error("Parámetros inválidos. Usa formato a=1, b=2.");
    }
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(key)) {
      throw new Error(`Nombre de parámetro inválido: ${key}`);
    }
    const num = parseMathExpr(value);
    if (!Number.isFinite(num)) {
      throw new Error(`Valor inválido para ${key}: ${value}`);
    }
    params[key] = num;
  }
  return params;
};

const formatToLatex = (str: string) => {
  if (!str) return "";
  return str
    .toLowerCase()
    .replace(/\*\*/g, "^")
    .replace(/\*/g, " \\cdot ")
    .replace(/exp\(([^)]+)\)/g, "e^{$1}")
    .replace(/sqrt\(([^)]+)\)/g, "\\sqrt{$1}")
    .replace(/\bpi\b/g, "\\pi")
    .replace(/\be\b/g, "e")
    .replace(/\bmu\b/g, "\\mu")
    .replace(/sen\(/g, "\\sin(")
    .replace(/sin\(/g, "\\sin(")
    .replace(/cos\(/g, "\\cos(")
    .replace(/tan\(/g, "\\tan(")
    .replace(/log\(/g, "\\ln(")
    .replace(/ln\(/g, "\\ln(");
};

export default function DynamicGeneral() {
  const [dimension, setDimension] = useState<"1d" | "2d">("1d");

  const [eq1D, setEq1D] = useState("x*(1-x)");
  const [params1D, setParams1D] = useState("");
  const [xMin, setXMin] = useState("-1");
  const [xMax, setXMax] = useState("3");
  const [tMax, setTMax] = useState("10");
  const [initials, setInitials] = useState("0.5, 1.5");

  const [eqX, setEqX] = useState("y - x*(mu - x^2 - y^2)");
  const [eqY, setEqY] = useState("-x + y*(mu - x^2 - y^2)");
  const [muParam, setMuParam] = useState("1");
  const [params2D, setParams2D] = useState("");
  const [x0, setX0] = useState("0.1");
  const [y0, setY0] = useState("0.1");
  const [tFin, setTFin] = useState("20");
  const [hStep, setHStep] = useState("0.02");
  const [domain, setDomain] = useState("3");

  const [result1D, setResult1D] = useState<Solve1DResponse | null>(null);
  const [result2D, setResult2D] = useState<Solve2DResponse | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSolve = async () => {
    setError("");
    setLoading(true);
    try {
      if (dimension === "1d") {
        const xMinVal = parseMathExpr(xMin);
        const xMaxVal = parseMathExpr(xMax);
        const tMaxVal = parseMathExpr(tMax);
        const initialsList = parseNumberList(initials);
        if (
          !Number.isFinite(xMinVal) ||
          !Number.isFinite(xMaxVal) ||
          !Number.isFinite(tMaxVal)
        ) {
          throw new Error("Rangos inválidos en x_min, x_max o t_max.");
        }
        if (initialsList.length === 0) {
          throw new Error(
            "Condiciones iniciales inválidas. Usa valores separados por coma.",
          );
        }
        const params = parseParams(params1D);

        const res = await dynamic1DService.solve({
          model: "custom",
          func_str: eq1D,
          params,
          control_enabled: false,
          x_min: xMinVal,
          x_max: xMaxVal,
          t_max: tMaxVal,
          initial_conditions: initialsList,
          n_phase: 400,
          n_time: 200,
        });
        setResult1D(res.data);
        setResult2D(null);
      } else {
        const d = parseMathExpr(domain);
        const muVal = muParam.trim() === "" ? 0 : parseMathExpr(muParam);
        const x0Val = parseMathExpr(x0);
        const y0Val = parseMathExpr(y0);
        const tFinVal = parseMathExpr(tFin);
        const hVal = parseMathExpr(hStep);
        if (
          !Number.isFinite(d) ||
          !Number.isFinite(muVal) ||
          !Number.isFinite(x0Val) ||
          !Number.isFinite(y0Val) ||
          !Number.isFinite(tFinVal) ||
          !Number.isFinite(hVal)
        ) {
          throw new Error("Parámetros numéricos inválidos.");
        }
        const params = parseParams(params2D);

        const res = await dynamic2DNonLinearService.solve({
          eq_x: eqX,
          eq_y: eqY,
          mu: muVal,
          params,
          x0: x0Val,
          y0: y0Val,
          t_fin: tFinVal,
          h: hVal,
          x_min: -d,
          x_max: d,
          y_min: -d,
          y_max: d,
          cantidad_trayectorias: 25,
        });
        setResult2D(res.data);
        setResult1D(null);
      }
    } catch (err: any) {
      setError(
        err.message || err.response?.data?.detail || "Error al resolver",
      );
    } finally {
      setLoading(false);
    }
  };

  const phasePlot1D = useMemo(() => {
    if (!result1D) return null;
    const phase = result1D.phase;
    const eqPoints = result1D.equilibria || [];

    const eqStable = eqPoints.filter((p) => p.stability === "estable");
    const eqUnstable = eqPoints.filter((p) => p.stability === "inestable");
    const eqSemi = eqPoints.filter((p) => p.stability === "semiestable");

    const flowRight = phase.flow.filter((f) => f.dir > 0);
    const flowLeft = phase.flow.filter((f) => f.dir < 0);

    return {
      data: [
        {
          x: phase.x,
          y: phase.fx,
          type: "scatter",
          mode: "lines",
          name: "f(x)",
        },
        {
          x: eqStable.map((p) => p.x),
          y: eqStable.map(() => 0),
          type: "scatter",
          mode: "markers",
          name: "Estable",
          marker: { color: "green", size: 10 },
        },
        {
          x: eqUnstable.map((p) => p.x),
          y: eqUnstable.map(() => 0),
          type: "scatter",
          mode: "markers",
          name: "Inestable",
          marker: { color: "red", size: 10, symbol: "circle-open" },
        },
        {
          x: eqSemi.map((p) => p.x),
          y: eqSemi.map(() => 0),
          type: "scatter",
          mode: "markers",
          name: "Semiestable",
          marker: { color: "orange", size: 10 },
        },
        {
          x: flowRight.map((p) => p.x),
          y: flowRight.map(() => 0),
          type: "scatter",
          mode: "markers",
          name: "Flujo +",
          marker: { color: "#2b6cb0", size: 8, symbol: "triangle-right" },
          hoverinfo: "skip",
        },
        {
          x: flowLeft.map((p) => p.x),
          y: flowLeft.map(() => 0),
          type: "scatter",
          mode: "markers",
          name: "Flujo -",
          marker: { color: "#2b6cb0", size: 8, symbol: "triangle-left" },
          hoverinfo: "skip",
        },
      ],
    };
  }, [result1D]);

  const timePlot1D = useMemo(() => {
    if (!result1D) return null;
    const time = result1D.time;
    const series = time.series || [];

    return {
      data: series.map((s) => ({
        x: time.t,
        y: s.x,
        type: "scatter",
        mode: "lines",
        name: `x0 = ${s.x0}`,
      })),
    };
  }, [result1D]);

  const phasePlot2D = useMemo(() => {
    if (!result2D) return null;
    const domainVal = Number.isFinite(parseMathExpr(domain))
      ? parseMathExpr(domain)
      : 3;
    const traces: any[] = [];

    result2D.automatic_trajectories.forEach((traj, idx) => {
      traces.push({
        x: traj.x,
        y: traj.y,
        type: "scatter",
        mode: "lines",
        line: { color: "rgba(180, 180, 180, 0.4)", width: 1 },
        hoverinfo: "none",
        showlegend: idx === 0,
        name: "Flujo del espacio (RK4)",
      });
    });

    traces.push({
      x: result2D.contour_data.x_axis,
      y: result2D.contour_data.y_axis,
      z: result2D.contour_data.z_x_nul,
      type: "contour",
      coloring: "none",
      contours: { coloring: "none", showlines: true, start: 0, end: 0 },
      line: { color: "#2563eb", width: 2, dash: "dash", smoothing: 1.3 },
      showscale: false,
      name: "Nulclina dx/dt=0",
      hoverinfo: "none",
    });

    traces.push({
      x: result2D.contour_data.x_axis,
      y: result2D.contour_data.y_axis,
      z: result2D.contour_data.z_y_nul,
      type: "contour",
      coloring: "none",
      contours: { coloring: "none", showlines: true, start: 0, end: 0 },
      line: { color: "#f59e0b", width: 2, dash: "dash", smoothing: 1.3 },
      showscale: false,
      name: "Nulclina dy/dt=0",
      hoverinfo: "none",
    });

    traces.push({
      x: result2D.principal_trajectory.x,
      y: result2D.principal_trajectory.y,
      type: "scatter",
      mode: "lines",
      line: { color: "#111827", width: 2 },
      name: "Trayectoria principal",
    });

    traces.push({
      x: [parseMathExpr(x0)],
      y: [parseMathExpr(y0)],
      type: "scatter",
      mode: "markers",
      marker: { color: "#16a34a", size: 10 },
      name: "Condición inicial",
    });

    result2D.puntos_analizados.forEach((pto, idx) => {
      traces.push({
        x: [pto.x],
        y: [pto.y],
        type: "scatter",
        mode: "markers",
        marker: {
          color: "#dc2626",
          size: 12,
          symbol: "x",
          line: { color: "#fff", width: 2 },
        },
        showlegend: idx === 0,
        name: "Puntos de equilibrio (X*)",
      });
    });

    return traces;
    return { traces, domainVal };
  }, [result2D, x0, y0, domain]);

  const timePlot2D = useMemo(() => {
    if (!result2D) return null;
    return [
      {
        x: result2D.principal_trajectory.t,
        y: result2D.principal_trajectory.x,
        type: "scatter",
        mode: "lines",
        name: "x(t)",
        line: { color: "#2563eb" },
      },
      {
        x: result2D.principal_trajectory.t,
        y: result2D.principal_trajectory.y,
        type: "scatter",
        mode: "lines",
        name: "y(t)",
        line: { color: "#dc2626" },
      },
    ];
  }, [result2D]);

  return (
    <div className="method-page">
      <h1>Sistemas Dinámicos - Resolución General</h1>

      <div className="method-container">
        <div className="form-section">
          <h2>Definición del sistema</h2>

          <div className="method-selector">
            <label>Dimensión:</label>
            <select
              value={dimension}
              onChange={(e) => setDimension(e.target.value as "1d" | "2d")}
            >
              <option value="1d">Autónomo 1D (x' = f(x))</option>
              <option value="2d">Autónomo 2D (x', y')</option>
            </select>
          </div>

          {dimension === "1d" ? (
            <>
              <div className="form-group">
                <label>Ecuación f(x):</label>
                <input
                  type="text"
                  value={eq1D}
                  onChange={(e) => setEq1D(e.target.value)}
                  placeholder="Ej: x*(1-x)"
                />
                {eq1D && (
                  <div style={{ marginTop: "6px" }}>
                    <FormulaDisplay formula={`x' = ${formatToLatex(eq1D)}`} />
                  </div>
                )}
              </div>

              <div className="form-group">
                <label>Parámetros (opcional):</label>
                <input
                  type="text"
                  value={params1D}
                  onChange={(e) => setParams1D(e.target.value)}
                  placeholder="Ej: r=0.5, K=100"
                />
              </div>

              <div
                style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}
              >
                <div className="form-group">
                  <label>x_min:</label>
                  <input
                    type="text"
                    value={xMin}
                    onChange={(e) => setXMin(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>x_max:</label>
                  <input
                    type="text"
                    value={xMax}
                    onChange={(e) => setXMax(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>t_max:</label>
                <input
                  type="text"
                  value={tMax}
                  onChange={(e) => setTMax(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Condiciones iniciales:</label>
                <input
                  type="text"
                  value={initials}
                  onChange={(e) => setInitials(e.target.value)}
                  placeholder="Ej: -0.5, 0.5, 1.5"
                />
              </div>
            </>
          ) : (
            <>
              <div className="form-group">
                <label>Ecuación x' = f(x,y):</label>
                <input
                  type="text"
                  value={eqX}
                  onChange={(e) => setEqX(e.target.value)}
                  placeholder="Ej: y - x"
                />
              </div>
              <div className="form-group">
                <label>Ecuación y' = g(x,y):</label>
                <input
                  type="text"
                  value={eqY}
                  onChange={(e) => setEqY(e.target.value)}
                  placeholder="Ej: x^2 - 1"
                />
                {(eqX || eqY) && (
                  <div style={{ marginTop: "6px" }}>
                    <FormulaDisplay
                      formula={`\\begin{cases} x' = ${formatToLatex(
                        eqX || "0",
                      )} \\\\ y' = ${formatToLatex(eqY || "0")} \\end{cases}`}
                    />
                  </div>
                )}
              </div>

              <div className="form-group">
                <label>Parámetro μ (opcional):</label>
                <input
                  type="text"
                  value={muParam}
                  onChange={(e) => setMuParam(e.target.value)}
                  placeholder="Ej: 1"
                />
              </div>

              <div className="form-group">
                <label>Parámetros adicionales (opcional):</label>
                <input
                  type="text"
                  value={params2D}
                  onChange={(e) => setParams2D(e.target.value)}
                  placeholder="Ej: a=1, b=2"
                />
              </div>

              <div
                style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}
              >
                <div className="form-group">
                  <label>x₀:</label>
                  <input
                    type="text"
                    value={x0}
                    onChange={(e) => setX0(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>y₀:</label>
                  <input
                    type="text"
                    value={y0}
                    onChange={(e) => setY0(e.target.value)}
                  />
                </div>
              </div>

              <div
                style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}
              >
                <div className="form-group">
                  <label>t_fin:</label>
                  <input
                    type="text"
                    value={tFin}
                    onChange={(e) => setTFin(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Paso h:</label>
                  <input
                    type="text"
                    value={hStep}
                    onChange={(e) => setHStep(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Dominio (±):</label>
                <input
                  type="text"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                />
              </div>
            </>
          )}

          <button
            type="button"
            className="btn-primary"
            style={{ marginTop: "14px", width: "100%" }}
            onClick={handleSolve}
            disabled={loading}
          >
            {loading ? "Resolviendo..." : "Resolver sistema"}
          </button>
        </div>

        <div className="result-section">
          <h2>Resultados</h2>
          {error && <div className="error-box">{error}</div>}

          {dimension === "1d" && result1D && (
            <>
              <div className="result-box">
                <div className="validation-title">Ecuación usada:</div>
                <FormulaDisplay formula={`x' = ${formatToLatex(result1D.equation)}`} />
              </div>

              {result1D.equilibria && result1D.equilibria.length > 0 && (
                <div className="result-box">
                  <div className="validation-title">Puntos de equilibrio</div>
                  <div className="validation-box">
                    {result1D.equilibria.map((eq, idx) => (
                      <div key={idx} className="validation-row">
                        <span className="validation-label">
                          x* = {eq.x.toFixed(4)}
                        </span>
                        <span>{eq.stability}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {phasePlot1D && (
                <div style={{ marginBottom: "10px" }}>
                  <PlotlyGraph
                    data={phasePlot1D.data}
                    title="Diagrama de fase 1D"
                    layout={{ xaxis: { title: "x" }, yaxis: { title: "f(x)" } }}
                  />
                </div>
              )}

              {timePlot1D && (
                <PlotlyGraph
                  data={timePlot1D.data}
                  title="Evolución temporal"
                  layout={{ xaxis: { title: "t" }, yaxis: { title: "x(t)" } }}
                />
              )}
            </>
          )}

          {dimension === "2d" && result2D && (
            <>
              <div className="result-box">
                <div className="validation-title">Sistema analizado</div>
                <FormulaDisplay
                  formula={`\\begin{cases} x' = ${result2D.ecuacion_latex_x} \\\\ y' = ${result2D.ecuacion_latex_y} \\end{cases}`}
                />
              </div>

              <div className="result-box">
                <div className="validation-title">Jacobiano general</div>
                <FormulaDisplay formula={`J(x,y) = ${result2D.jacobiano_latex}`} />
              </div>

              <div className="result-box">
                <div className="validation-title">Nulclinas</div>
                <div className="validation-box">
                  <div className="validation-row">
                    <span className="validation-label">dx/dt = 0:</span>
                    <span>{result2D.nulclina_x_desp}</span>
                  </div>
                  <div className="validation-row">
                    <span className="validation-label">dy/dt = 0:</span>
                    <span>{result2D.nulclina_y_desp}</span>
                  </div>
                </div>
              </div>

              {phasePlot2D && (
                <div
                  style={{
                    marginBottom: "16px",
                    border: "1px solid #ccc",
                    borderRadius: "4px",
                    overflow: "hidden",
                  }}
                >
                  <PlotlyGraph
                    data={phasePlot2D.traces}
                    title="Retrato de fase (autónomo 2D)"
                    layout={{
                      xaxis: {
                        title: "Variable X",
                        range: [-phasePlot2D.domainVal, phasePlot2D.domainVal],
                      },
                      yaxis: {
                        title: "Variable Y",
                        range: [-phasePlot2D.domainVal, phasePlot2D.domainVal],
                      },
                      showlegend: true,
                    }}
                  />
                </div>
              )}

              {timePlot2D && (
                <div
                  style={{
                    marginBottom: "16px",
                    border: "1px solid #ccc",
                    borderRadius: "4px",
                    overflow: "hidden",
                  }}
                >
                  <PlotlyGraph
                    data={timePlot2D}
                    title="Evolución temporal"
                    layout={{
                      xaxis: { title: "Tiempo (t)" },
                      yaxis: { title: "Estado" },
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
