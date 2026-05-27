# backend/app/methods/dynamic_2d_nonlinear.py
import numpy as np
import sympy as sp
from sympy.parsing.sympy_parser import parse_expr, standard_transformations, implicit_multiplication_application
import math
from typing import Dict, Any

class Dynamic2DNonLinearService:
    @staticmethod
    def clasificar_punto(traza, determinante, discriminante, autovalores) -> tuple:
        if abs(determinante) < 1e-10:
            clasif = "Caso degenerado / determinante cero"
        elif determinante < 0:
            clasif = "Silla"
        elif discriminante > 1e-10:
            if traza < 0:
                clasif = "Nodo estable"
            elif traza > 0:
                clasif = "Nodo inestable"
            else:
                clasif = "Nodo con traza cero / caso especial"
        elif abs(discriminante) <= 1e-10:
            if traza < 0:
                clasif = "Nodo degenerado estable"
            elif traza > 0:
                clasif = "Nodo degenerado inestable"
            else:
                clasif = "Caso no hiperbolico"
        else:
            parte_real = float(np.real(autovalores[0]))
            if abs(parte_real) < 1e-10:
                clasif = "Centro (No Hiperbolico)"
            elif parte_real < 0:
                clasif = "Foco estable"
            else:
                clasif = "Foco inestable"

        if "Silla" in clasif:
            comp = "Trayectorias se acercan por una direccion y se alejan por otra."
        elif "Nodo estable" in clasif:
            comp = "Trayectorias tienden al equilibrio sin oscilar (sumidero)."
        elif "Nodo inestable" in clasif:
            comp = "Trayectorias se alejan del equilibrio sin oscilar (fuente)."
        elif "Foco estable" in clasif:
            comp = "Trayectorias giran en espiral hacia el equilibrio (atractor)."
        elif "Foco inestable" in clasif:
            comp = "Trayectorias giran en espiral alejandose del equilibrio."
        elif "Centro" in clasif:
            comp = "Posibles orbitas cerradas (ciclos limite o centros). Se requiere Lyapunov o Poincaré-Bendixson."
        else:
            comp = "Requiere analisis topologico de orden superior."

        return clasif, comp

    @staticmethod
    def solve(payload: Dict[str, Any]) -> Dict[str, Any]:
        eq_x_str = payload.get('eq_x', 'y - x')
        eq_y_str = payload.get('eq_y', 'x**2 - 1')
        x0 = float(payload.get('x0', 0.5))
        y0 = float(payload.get('y0', 0.5))
        t0 = float(payload.get('t0', 0.0))
        t_fin = float(payload.get('t_fin', 10.0))
        h = float(payload.get('h', 0.02)) # Default h más pequeño para mejor simulación
        x_min = float(payload.get('x_min', -4.0))
        x_max = float(payload.get('x_max', 4.0))
        y_min = float(payload.get('y_min', -4.0))
        y_max = float(payload.get('y_max', 4.0))
        cantidad_trayectorias = int(payload.get('cantidad_trayectorias', 25)) # Más trayectorias default

        x, y = sp.symbols('x y', real=True)
        transformations = (standard_transformations + (implicit_multiplication_application,))
        
        try:
            f = parse_expr(eq_x_str.replace('^', '**'), local_dict={'x': x, 'y': y}, transformations=transformations)
            g = parse_expr(eq_y_str.replace('^', '**'), local_dict={'x': x, 'y': y}, transformations=transformations)
        except Exception as e:
            raise ValueError(f"Error de sintaxis en las ecuaciones: {str(e)}")

        # 1. Matriz Jacobiana Analitica
        J = sp.Matrix([
            [sp.diff(f, x), sp.diff(f, y)],
            [sp.diff(g, x), sp.diff(g, y)]
        ])

        # 2. Puntos de Equilibrio (solucion de f=0 y g=0)
        sols = sp.nonlinsolve([f, g], [x, y])
        puntos_equilibrio = []
        
        if isinstance(sols, sp.FiniteSet):
            for sol in sols:
                try:
                    # Filtrar solo raices reales
                    x_val = complex(sol[0])
                    y_val = complex(sol[1])
                    if abs(x_val.imag) < 1e-9 and abs(y_val.imag) < 1e-9:
                        puntos_equilibrio.append((x_val.real, y_val.real))
                except:
                    pass

        # 3. Analisis Cualitativo por punto (Hartman-Grobman)
        analisis_puntos = []
        for pto in puntos_equilibrio:
            px, py = pto[0], pto[1]
            J_eval = J.subs({x: px, y: py})
            J_num = np.array(J_eval.tolist(), dtype=float)
            
            traza = float(np.trace(J_num))
            determinante = float(np.linalg.det(J_num))
            discriminante = traza**2 - 4 * determinante
            autovalores, autovectores = np.linalg.eig(J_num)
            
            clasif, comp = Dynamic2DNonLinearService.clasificar_punto(traza, determinante, discriminante, autovalores)
            
            autos_formateados = [{"real": float(np.real(av)), "imag": float(np.imag(av))} for av in autovalores]
            
            # Formatear el Jacobiano Numérico local con redondeo para que se vea limpio en el front
            j_local_formateado = [
                [round(float(J_num[0][0]), 4), round(float(J_num[0][1]), 4)],
                [round(float(J_num[1][0]), 4), round(float(J_num[1][1]), 4)]
            ]

            analisis_puntos.append({
                "x": px, "y": py,
                "traza": traza, "determinante": determinante, "discriminante": discriminante,
                "clasificacion": clasif, "comportamiento": comp,
                "autovalores": autos_formateados,
                "jacobiano_local": j_local_formateado
            })

        # 4. Solucion Numerica RK4 (Trayectorias)
        # Usamos lambdify para mayor velocidad numérica
        f_num = sp.lambdify((x, y), f, "numpy")
        g_num = sp.lambdify((x, y), g, "numpy")

        def rk4_step(X_curr, step_h):
            try:
                v_x, v_y = float(X_curr[0]), float(X_curr[1])
                k1_x = f_num(v_x, v_y)
                k1_y = g_num(v_x, v_y)
                
                k2_x = f_num(v_x + step_h * k1_x / 2, v_y + step_h * k1_y / 2)
                k2_y = g_num(v_x + step_h * k1_x / 2, v_y + step_h * k1_y / 2)
                
                k3_x = f_num(v_x + step_h * k2_x / 2, v_y + step_h * k2_y / 2)
                k3_y = g_num(v_x + step_h * k2_x / 2, v_y + step_h * k2_y / 2)
                
                k4_x = f_num(v_x + step_h * k3_x, v_y + step_h * k3_y)
                k4_y = g_num(v_x + step_h * k3_x, v_y + step_h * k3_y)
                
                new_x = v_x + (step_h / 6) * (k1_x + 2*k2_x + 2*k3_x + k4_x)
                new_y = v_y + (step_h / 6) * (k1_y + 2*k2_y + 2*k3_y + k4_y)
                
                if math.isnan(new_x) or math.isnan(new_y) or abs(new_x) > 1e10 or abs(new_y) > 1e10:
                    return None # Detener simulacion si diverge
                return np.array([new_x, new_y])
            except:
                return None

        # Trayectoria principal
        t_vals = np.arange(t0, t_fin + h, h)
        X_main = [np.array([x0, y0])]
        for _ in range(len(t_vals) - 1):
            curr = X_main[-1]
            if curr is None: break
            next_p = rk4_step(curr, h)
            X_main.append(next_p)
        
        # Filtrar None finales y convertir a lista para JSON
        X_main_final = np.array([p for p in X_main if p is not None])

        # Trayectorias del campo (automáticas)
        automatic_trajectories = []
        n_side = int(math.sqrt(cantidad_trayectorias))
        if n_side > 1:
            x0_auto = np.linspace(x_min, x_max, n_side)
            y0_auto = np.linspace(y_min, y_max, n_side)
            for xi in x0_auto:
                for yi in y0_auto:
                    # Simulaciones más cortas para el campo flow
                    t_len = int(len(t_vals) / 2)
                    X_temp = [np.array([xi, yi])]
                    for _ in range(t_len - 1):
                        curr = X_temp[-1]
                        if curr is None: break
                        next_p = rk4_step(curr, h * 2) # h más grande para el campo flow
                        X_temp.append(next_p)
                    
                    X_temp_final = np.array([p for p in X_temp if p is not None])
                    if len(X_temp_final) > 1:
                        automatic_trajectories.append({
                            "x": X_temp_final[:, 0].tolist(),
                            "y": X_temp_final[:, 1].tolist()
                        })

        # 5. Grilla para Nulclinas (Plotly Contour)
        # Aumentamos resolución para nulclinas curvas más definidas
        grid_res = 80 
        X_mesh, Y_mesh = np.meshgrid(np.linspace(x_min, x_max, grid_res), np.linspace(y_min, y_max, grid_res))
        
        # Eval vectorizado
        try:
            Z_x = f_num(X_mesh, Y_mesh)
            Z_y = g_num(X_mesh, Y_mesh)
            # Manejar retornos escalares de lambdify
            if np.isscalar(Z_x): Z_x = np.full(X_mesh.shape, Z_x)
            if np.isscalar(Z_y): Z_y = np.full(Y_mesh.shape, Z_y)
        except Exception:
            # Fallback iterativo si falla vectorizado
            Z_x = np.zeros_like(X_mesh)
            Z_y = np.zeros_like(Y_mesh)
            for i in range(grid_res):
                for j in range(grid_res):
                    try: Z_x[i,j] = f_num(X_mesh[i,j], Y_mesh[i,j])
                    except: Z_x[i,j] = np.nan
                    try: Z_y[i,j] = g_num(X_mesh[i,j], Y_mesh[i,j])
                    except: Z_y[i,j] = np.nan

        return {
            "ecuacion_latex_x": sp.latex(f),
            "ecuacion_latex_y": sp.latex(g),
            "jacobiano_latex": sp.latex(J),
            "puntos_analizados": analisis_puntos,
            "principal_trajectory": {
                "t": t_vals[:len(X_main_final)].tolist(),
                "x": X_main_final[:, 0].tolist(),
                "y": X_main_final[:, 1].tolist()
            },
            "automatic_trajectories": automatic_trajectories,
            "contour_data": {
                "x_axis": X_mesh[0].tolist(),
                "y_axis": Y_mesh[:,0].tolist(),
                "z_x_nul": Z_x.tolist(),
                "z_y_nul": Z_y.tolist()
            }
        }