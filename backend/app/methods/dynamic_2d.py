import numpy as np
import pandas as pd
import scipy.integrate
import sympy as sp
import math

class Dynamic2DService:
    @staticmethod
    def truncar(num: float, decimales: int = 10) -> float | None:
        if num is None:
            return None
        if isinstance(num, (float, np.floating)):
            if np.isnan(num) or np.isinf(num):
                return None
        factor = 10 ** decimales
        return math.trunc(num * factor) / factor

    @staticmethod
    def clasificar_sistema(A: np.ndarray) -> str:
        traza = np.trace(A)
        determinante = np.linalg.det(A)
        discriminante = traza**2 - 4 * determinante
        autovalores = np.linalg.eigvals(A)

        if abs(determinante) < 1e-10:
            return "Caso degenerado / determinante cero"

        if determinante < 0:
            return "Silla"

        if discriminante > 1e-10:
            if traza < 0:
                return "Nodo estable"
            elif traza > 0:
                return "Nodo inestable"
            else:
                return "Nodo con traza cero / caso especial"
        elif abs(discriminante) <= 1e-10:
            if traza < 0:
                return "Nodo degenerado estable"
            elif traza > 0:
                return "Nodo degenerado inestable"
            else:
                return "Caso no hiperbolico"
        else:
            parte_real = np.real(autovalores[0])
            if abs(parte_real) < 1e-10:
                return "Centro"
            elif parte_real < 0:
                return "Foco estable"
            else:
                return "Foco inestable"

    @staticmethod
    def descripcion_comportamiento(clasificacion: str) -> str:
        if "Silla" in clasificacion:
            return "Las trayectorias se acercan en una direccion y se alejan en otra."
        if "Nodo estable" in clasificacion:
            return "Todas las trayectorias cercanas tienden al equilibrio sin oscilar."
        if "Nodo inestable" in clasificacion:
            return "Las trayectorias se alejan del equilibrio sin oscilar."
        if "Foco estable" in clasificacion:
            return "Las trayectorias giran en espiral hacia el equilibrio."
        if "Foco inestable" in clasificacion:
            return "Las trayectorias giran en espiral alejandose del equilibrio."
        if "Centro" in clasificacion:
            return "Las trayectorias cerradas rodean el equilibrio."
        if "degenerado" in clasificacion:
            return "El sistema tiene autovalores repetidos; puede requerir analizar autovectores."
        return "Caso especial; requiere analisis adicional."

    @staticmethod
    def solve(payload: dict) -> dict:
        a = float(payload.get("a", 3))
        b = float(payload.get("b", 1))
        c = float(payload.get("c", 1))
        d = float(payload.get("d", 3))
        e = float(payload.get("e", 0))
        f = float(payload.get("f", 0))
        
        x0 = float(payload.get("x0", 1))
        y0 = float(payload.get("y0", 1))
        t0 = float(payload.get("t0", 0))
        t_fin = float(payload.get("t_fin", 10))
        h = float(payload.get("h", 0.01))
        
        x_min = float(payload.get("x_min", -5))
        x_max = float(payload.get("x_max", 5))
        y_min = float(payload.get("y_min", -5))
        y_max = float(payload.get("y_max", 5))
        cantidad_trayectorias = int(payload.get("cantidad_trayectorias", 16))

        A = np.array([[a, b], [c, d]], dtype=float)
        B_vec = np.array([e, f], dtype=float)

        det_A = np.linalg.det(A)
        if abs(det_A) > 1e-12:
            equilibrio = -np.linalg.solve(A, B_vec)
            equilibrio_dict = {"x": float(equilibrio[0]), "y": float(equilibrio[1])}
        else:
            equilibrio = None
            equilibrio_dict = None

        autovalores, autovectores = np.linalg.eig(A)
        traza = np.trace(A)
        discriminante = traza**2 - 4 * det_A
        clasificacion = Dynamic2DService.clasificar_sistema(A)
        comportamiento = Dynamic2DService.descripcion_comportamiento(clasificacion)

        # Build autovalores/vectores lists to serialize
        autovalores_list = [
            {"real": float(np.real(val)), "imag": float(np.imag(val))}
            for val in autovalores
        ]
        autovectores_list = [
            {"x": float(np.real(autovectores[0, i])), "y": float(np.real(autovectores[1, i]))}
            for i in range(len(autovalores))
        ]

        def sistema(t, X):
            return A @ X + B_vec

        def rk4_sistema(X0, t0, t_fin, h):
            t_vals = np.arange(t0, t_fin + h, h)
            X_vals = np.zeros((len(t_vals), 2))
            X_vals[0] = X0
            for i in range(len(t_vals) - 1):
                ti = t_vals[i]
                Xi = X_vals[i]
                h_loc = t_vals[i + 1] - ti
                k1 = sistema(ti, Xi)
                k2 = sistema(ti + h_loc / 2, Xi + h_loc * k1 / 2)
                k3 = sistema(ti + h_loc / 2, Xi + h_loc * k2 / 2)
                k4 = sistema(ti + h_loc, Xi + h_loc * k3)
                X_vals[i + 1] = Xi + (h_loc / 6) * (k1 + 2 * k2 + 2 * k3 + k4)
            return t_vals, X_vals

        X0 = np.array([x0, y0], dtype=float)
        t_vals, X_vals = rk4_sistema(X0, t0, t_fin, h)

        # Derivatives over time
        dxdt_vals, dydt_vals = [], []
        for Xi in X_vals:
            deriv = sistema(0, Xi)
            dxdt_vals.append(float(deriv[0]))
            dydt_vals.append(float(deriv[1]))

        rk4_data = {
            "t": t_vals.tolist(),
            "x": X_vals[:, 0].tolist(),
            "y": X_vals[:, 1].tolist(),
            "dx_dt": dxdt_vals,
            "dy_dt": dydt_vals
        }

        # Sympy Analitica
        t_sym = sp.symbols('t', real=True)
        xs = sp.Function('x')
        ys = sp.Function('y')
        eq1 = sp.Eq(sp.diff(xs(t_sym), t_sym), a * xs(t_sym) + b * ys(t_sym) + e)
        eq2 = sp.Eq(sp.diff(ys(t_sym), t_sym), c * xs(t_sym) + d * ys(t_sym) + f)
        
        try:
            sol_analitica = sp.dsolve([eq1, eq2], ics={xs(t0): x0, ys(t0): y0})
            sol_str = str(sol_analitica)
            # LaTeX optional: sp.latex(sol_analitica)
            sol_latex = sp.latex(sol_analitica)
        except Exception:
            sol_str = "No se pudo obtener"
            sol_latex = ""

        # Nulclinas
        x_sym, y_sym = sp.symbols('x y', real=True)
        nul_x_expr = sp.Eq(a * x_sym + b * y_sym + e, 0)
        nul_y_expr = sp.Eq(c * x_sym + d * y_sym + f, 0)
        
        try:
            nul_x_sol = sp.solve(nul_x_expr, y_sym)
        except Exception:
            nul_x_sol = []
        try:
            nul_y_sol = sp.solve(nul_y_expr, y_sym)
        except Exception:
            nul_y_sol = []

        x_plot = np.linspace(x_min, x_max, 100)
        nul_x_data = {"x": [], "y": []}
        if len(nul_x_sol) > 0:
            y_nul_x_func = sp.lambdify(x_sym, nul_x_sol[0], "numpy")
            y_nul_x = y_nul_x_func(x_plot)
            if not isinstance(y_nul_x, np.ndarray):
                y_nul_x = np.full_like(x_plot, y_nul_x)
            nul_x_data = {"x": x_plot.tolist(), "y": y_nul_x.tolist(), "expr": str(nul_x_expr)}
        
        nul_y_data = {"x": [], "y": []}
        if len(nul_y_sol) > 0:
            y_nul_y_func = sp.lambdify(x_sym, nul_y_sol[0], "numpy")
            y_nul_y = y_nul_y_func(x_plot)
            if not isinstance(y_nul_y, np.ndarray):
                y_nul_y = np.full_like(x_plot, y_nul_y)
            nul_y_data = {"x": x_plot.tolist(), "y": y_nul_y.tolist(), "expr": str(nul_y_expr)}

        # Vector Field
        X_grid, Y_grid = np.meshgrid(np.linspace(x_min, x_max, 25), np.linspace(y_min, y_max, 25))
        U = a * X_grid + b * Y_grid + e
        V = c * X_grid + d * Y_grid + f
        norma = np.sqrt(U**2 + V**2)
        norma[norma == 0] = 1
        U_norm = U / norma
        V_norm = V / norma

        vector_field = {
            "x": X_grid.flatten().tolist(),
            "y": Y_grid.flatten().tolist(),
            "u": U_norm.flatten().tolist(),
            "v": V_norm.flatten().tolist()
        }

        # Automatic trajectories
        side = int(np.sqrt(cantidad_trayectorias))
        if side < 1: side = 1
        x0_auto = np.linspace(x_min, x_max, side)
        y0_auto = np.linspace(y_min, y_max, side)
        
        trayectorias = []
        for xi in x0_auto:
            for yi in y0_auto:
                _, X_auto = rk4_sistema(np.array([xi, yi]), t0, t_fin, h)
                trayectorias.append({
                    "x": X_auto[:, 0].tolist(),
                    "y": X_auto[:, 1].tolist()
                })

        return {
            "resumen": {
                "traza": traza,
                "determinante": det_A,
                "discriminante": discriminante,
                "clasificacion": clasificacion,
                "comportamiento": comportamiento,
                "equilibrio": equilibrio_dict,
                "autovalores": autovalores_list,
                "autovectores": autovectores_list,
                "solucion_analitica_str": sol_str,
                "solucion_analitica_latex": sol_latex
            },
            "rk4_data": rk4_data,
            "nulclinas": {
                "dx_dt_0": nul_x_data,
                "dy_dt_0": nul_y_data
            },
            "vector_field": vector_field,
            "trayectorias": trayectorias
        }
