import numpy as np
import sympy as sp
import math
from typing import Dict, Any, List

class Dynamic2DNonHomogeneousService:
    @staticmethod
    def clasificar_sistema(A) -> str:
        traza = float(np.trace(A))
        determinante = float(np.linalg.det(A))
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
            parte_real = float(np.real(autovalores[0]))
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
    def rk4_sistema(A, B, X0, t0, t_fin, h):
        t_vals = np.arange(t0, t_fin + h, h)
        X_vals = np.zeros((len(t_vals), 2))
        X_vals[0] = X0

        for i in range(len(t_vals) - 1):
            ti = t_vals[i]
            Xi = X_vals[i]
            h_loc = t_vals[i + 1] - ti

            k1 = A @ Xi + B
            k2 = A @ (Xi + h_loc * k1 / 2) + B
            k3 = A @ (Xi + h_loc * k2 / 2) + B
            k4 = A @ (Xi + h_loc * k3) + B

            X_vals[i + 1] = Xi + (h_loc / 6) * (k1 + 2 * k2 + 2 * k3 + k4)

        return t_vals, X_vals

    @staticmethod
    def solve(payload: Dict[str, Any]) -> Dict[str, Any]:
        a = float(payload.get('a', 0.0))
        b = float(payload.get('b', -1.0))
        c = float(payload.get('c', -9.0))
        d = float(payload.get('d', 0.0))
        e = float(payload.get('e', 1.0))
        f = float(payload.get('f', 9.0))
        x0 = float(payload.get('x0', 1.0))
        y0 = float(payload.get('y0', 1.0))
        t0 = float(payload.get('t0', 0.0))
        t_fin = float(payload.get('t_fin', 5.0))
        h = float(payload.get('h', 0.01))
        x_min = float(payload.get('x_min', -5.0))
        x_max = float(payload.get('x_max', 5.0))
        y_min = float(payload.get('y_min', -5.0))
        y_max = float(payload.get('y_max', 5.0))
        cantidad_trayectorias = int(payload.get('cantidad_trayectorias', 16))

        A = np.array([[a, b], [c, d]], dtype=float)
        B = np.array([e, f], dtype=float)

        det_A = float(np.linalg.det(A))
        equilibrio_unico = abs(det_A) > 1e-12
        equilibrio_pnto = None
        if equilibrio_unico:
            eq = -np.linalg.solve(A, B)
            equilibrio_pnto = {"x": float(eq[0]), "y": float(eq[1])}

        autovalores, autovectores = np.linalg.eig(A)
        traza = float(np.trace(A))
        discriminante = traza**2 - 4 * det_A
        clasificacion = Dynamic2DNonHomogeneousService.clasificar_sistema(A)
        comportamiento = Dynamic2DNonHomogeneousService.descripcion_comportamiento(clasificacion)

        list_autovalores = []
        for av in autovalores:
            list_autovalores.append({
                "real": float(np.real(av)),
                "imag": float(np.imag(av))
            })

        list_autovectores = []
        for i in range(len(autovalores)):
            list_autovectores.append({
                "vx": float(np.real(autovectores[0, i])),
                "vy": float(np.real(autovectores[1, i]))
            })

        X0 = np.array([x0, y0], dtype=float)
        t_vals, X_vals = Dynamic2DNonHomogeneousService.rk4_sistema(A, B, X0, t0, t_fin, h)
        
        principal_trajectory = {
            "t": t_vals.tolist(),
            "x": X_vals[:, 0].tolist(),
            "y": X_vals[:, 1].tolist(),
        }

        automatic_trajectories = []
        n_side = int(math.sqrt(cantidad_trayectorias))
        if n_side > 1:
            x0_auto = np.linspace(x_min, x_max, n_side)
            y0_auto = np.linspace(y_min, y_max, n_side)
            for xi in x0_auto:
                for yi in y0_auto:
                    _, X_auto = Dynamic2DNonHomogeneousService.rk4_sistema(A, B, np.array([xi, yi]), t0, t_fin, h)
                    automatic_trajectories.append({
                        "x": X_auto[::5, 0].tolist(),
                        "y": X_auto[::5, 1].tolist()
                    })

        t_sym = sp.symbols('t', real=True)
        C1, C2 = sp.symbols('C1 C2')
        # Definiciones de funciones simbólicas para generar ecuaciones en LaTeX
        xs, ys = sp.Function('x'), sp.Function('y')

        # 1. Solución Homogénea (forma general) con C1, C2 simbólicos
        # Usamos SymPy para obtener autovalores/autovectores simbólicos más simples
        A_sym = sp.Matrix([[a, b], [c, d]])
        evects = A_sym.eigenvects()

        # Manejo sencillo: si aparecen autovalores complejos, devolvemos placeholder
        complex_eigen = any([ev[0].has(sp.I) for ev in evects])
        if complex_eigen:
            sol_homogenea_vectorial_latex = "X_h(t) = ..."
            sol_homogenea_vectorial_unmultiplied_latex = "X_h(t) = ..."
            sol_homogenea_componentes_latex = ["x_h(t) no calculada", "y_h(t) no calculada"]
            sol_particular_latex = ["Solución particular no mostrada para caso complejo"]
            constantes = {"c1": "C1", "c2": "C2"}
            sol_general_vectorial_latex = "X(t) = X_h(t) + X_p"
            sol_general_vectorial_unmultiplied_latex = "X(t) = ..."
            sol_general_latex = ["Solución general no calculada (autovalores complejos)"]
        else:
            # Extraer autovalores y autovectores simples
            # evects: list of tuples (eigenvalue, multiplicity, [eigenvectors])
            lambda1_sym = evects[0][0]
            lambda2_sym = evects[1][0] if len(evects) > 1 else evects[0][0]

            # Preferir autovectores simbólicos (SymPy) si dan entradas racionales simples.
            def simplify_sym_vector_to_ints(vec_sym: sp.Matrix):
                vec = sp.Matrix(vec_sym)
                dens = [sp.denom(el) for el in vec]
                l = 1
                for d in dens:
                    l = sp.ilcm(l, d)
                vec_int = (vec * l).applyfunc(sp.simplify)
                # convertir a enteros y reducir por GCD
                nums = [int(sp.sign(el) * abs(sp.Integer(el.as_numer_denom()[0]))) for el in vec_int]
                g = 0
                for n in nums:
                    g = abs(n) if g == 0 else math.gcd(g, abs(n))
                if g > 1:
                    nums = [int(n // g) for n in nums]
                # evitar vector cero
                if all(n == 0 for n in nums):
                    return None
                # Preferir primer componente no negativo para presentación
                if nums[0] < 0:
                    nums = [-n for n in nums]
                return nums

            v1_nums = None
            v2_nums = None
            try:
                # intentar extraer autovectores simbólicos de SymPy (más exactos para matrices enteras/racionales)
                sym_v1 = evects[0][2][0]
                v1_try = simplify_sym_vector_to_ints(sym_v1)
                if v1_try is not None:
                    v1_nums = v1_try
                if len(evects) > 1:
                    sym_v2 = evects[1][2][0]
                    v2_try = simplify_sym_vector_to_ints(sym_v2)
                    if v2_try is not None:
                        v2_nums = v2_try
            except Exception:
                v1_nums = None
                v2_nums = None

            # Si no obtuvimos vectores simbólicos simples, caer al método numérico
            from fractions import Fraction

            def numeric_to_simple_ints(v: np.ndarray, max_den: int = 12):
                comps = [float(x) for x in v]
                frs = [Fraction(c).limit_denominator(max_den) for c in comps]
                dens = [fr.denominator for fr in frs]
                l = 1
                for d in dens:
                    l = l * d // math.gcd(l, d)
                ints = [fr.numerator * (l // fr.denominator) for fr in frs]
                # reducir por GCD
                g = 0
                for val in ints:
                    g = abs(val) if g == 0 else math.gcd(g, abs(val))
                if g > 1:
                    ints = [int(val // g) for val in ints]
                # evitar el vector cero
                if all(val == 0 for val in ints):
                    if abs(comps[0]) >= abs(comps[1]):
                        ints = [1, 0]
                    else:
                        ints = [0, 1]
                # Preferir primer componente no negativo
                if ints[0] < 0:
                    ints = [-val for val in ints]
                return ints

            try:
                if v1_nums is None:
                    v1_nums = numeric_to_simple_ints(autovectores[:, 0].real)
            except Exception:
                v1_nums = [1, 0]
            try:
                if v2_nums is None:
                    v2_nums = numeric_to_simple_ints(autovectores[:, 1].real) if len(autovalores) > 1 else [0, 1]
            except Exception:
                v2_nums = [0, 1]

            # Mantener la versión simplificada numérica (temporal), se reemplazará
            # por la versión normalizada más abajo para la salida y las soluciones.
            temp_autovectores = [
                {"vx": int(v1_nums[0]), "vy": int(v1_nums[1])},
                {"vx": int(v2_nums[0]), "vy": int(v2_nums[1])}
            ]

            # Generar pasos simbólicos para despejar la relación entre componentes del autovector
            k1_sym, k2_sym = sp.symbols('k_1 k_2')
            autovectores_pasos_latex = []
            autovectores_relaciones_text = []
            eigen_syms = [lambda1_sym]
            if len(evects) > 1:
                eigen_syms.append(lambda2_sym)
            for lam in eigen_syms:
                M = A_sym - lam * sp.eye(2)
                eq1 = sp.Eq(M[0, 0] * k1_sym + M[0, 1] * k2_sym, 0)
                eq2 = sp.Eq(M[1, 0] * k1_sym + M[1, 1] * k2_sym, 0)
                # intentar despejar k2 en función de k1 (preferente)
                try:
                    if M[0, 1] != 0:
                        rel = sp.Eq(k2_sym, sp.simplify(-M[0, 0] / M[0, 1] * k1_sym))
                    elif M[1, 1] != 0:
                        rel = sp.Eq(k1_sym, sp.simplify(-M[1, 1] / M[1, 0] * k2_sym))
                    else:
                        rel = sp.Eq(k2_sym, sp.Integer(0))
                except Exception:
                    rel = sp.Eq(k2_sym, sp.Symbol('c'))
                autovectores_pasos_latex.append({
                    "sistema_latex": [sp.latex(eq1), sp.latex(eq2)],
                    "relacion_latex": sp.latex(rel)
                })
                # construir una versión en texto plano de la relación, p.ej. 'k2 = -3 k1'
                try:
                    lhs = str(rel.lhs).replace('k_1', 'k1').replace('k_2', 'k2')
                    rhs_expr = rel.rhs
                    # si rhs es multiplicación de coeficiente racional y k1/k2, extraer coef y variable
                    if rhs_expr.is_Mul:
                        coeff = None
                        var = None
                        for arg in rhs_expr.args:
                            if arg.is_Number or arg.is_Rational or arg.is_Integer:
                                coeff = arg
                            else:
                                var = arg
                        # formatear coeficiente
                        if coeff is None:
                            coeff_str = '1'
                        elif isinstance(coeff, sp.Rational):
                            if coeff.q == 1:
                                coeff_str = str(int(coeff.p))
                            else:
                                coeff_str = f"{int(coeff.p)}/{int(coeff.q)}"
                        else:
                            coeff_str = str(float(coeff))
                        var_str = str(var).replace('k_1', 'k1').replace('k_2', 'k2') if var is not None else ''
                        rhs_text = f"{coeff_str} {var_str}".strip()
                    else:
                        rhs_text = str(rhs_expr).replace('k_1', 'k1').replace('k_2', 'k2').replace('*', ' ')
                    rel_text = f"{lhs} = {rhs_text}"
                except Exception:
                    rel_text = str(rel).replace('k_1', 'k1').replace('k_2', 'k2')
                autovectores_relaciones_text.append(rel_text)

            # Normalizar preferentemente para tener primera componente = 1 cuando sea posible
            from fractions import Fraction

            autovectores_normalizados = []
            autovectores_relaciones_latex = []
            autovectores_parametricos_latex = []

            def make_normalized(nums):
                a, b = nums[0], nums[1]
                if a != 0:
                    frac = Fraction(b, a)
                    # convertir a float y redondear a entero para presentación
                    vy_float = float(frac)
                    vy_rounded = int(round(vy_float))
                    norm = [1, vy_rounded]
                    # relación k2 = vy_rounded * k1
                    relacion = f"k_2 = {vy_rounded} k_1"
                    vector_param = f"\\mathbf{{v}} = k \\begin{{pmatrix}}1\\{vy_rounded}\\end{{pmatrix}}"
                else:
                    # si a == 0, elegimos segunda componente = 1
                    norm = [0, 1]
                    relacion = "k_1 = 0"
                    vector_param = f"\\mathbf{{v}} = k \\begin{{pmatrix}}0\\1\\end{{pmatrix}}"
                return norm, relacion, vector_param

            v1_norm, v1_rel, v1_param = make_normalized(v1_nums)
            v2_norm, v2_rel, v2_param = make_normalized(v2_nums)

            autovectores_normalizados.append({"vx": v1_norm[0], "vy": v1_norm[1]})
            autovectores_normalizados.append({"vx": v2_norm[0], "vy": v2_norm[1]})
            autovectores_relaciones_latex.append(v1_rel)
            autovectores_relaciones_latex.append(v2_rel)
            autovectores_parametricos_latex.append(v1_param)
            autovectores_parametricos_latex.append(v2_param)

            # Reemplazar relaciones en texto plano por las basadas en los valores normalizados (enteros)
            autovectores_relaciones_text = []
            for v in autovectores_normalizados:
                vxn = v['vx']
                vyn = v['vy']
                if vxn == 1:
                    autovectores_relaciones_text.append(f"k2 = {vyn} k1")
                elif vxn == 0:
                    autovectores_relaciones_text.append("k1 = 0")
                else:
                    # fallback: show ratio
                    ratio = Fraction(vyn, vxn)
                    if ratio.denominator == 1:
                        autovectores_relaciones_text.append(f"k2 = {ratio.numerator}/{ratio.denominator} k1")
                    else:
                        autovectores_relaciones_text.append(f"k2 = {float(ratio)} k1")

            # Usar los autovectores *normalizados* para construir las expresiones simbólicas
            v1_sym = sp.Matrix([autovectores_normalizados[0]["vx"], autovectores_normalizados[0]["vy"]])
            v2_sym = sp.Matrix([autovectores_normalizados[1]["vx"], autovectores_normalizados[1]["vy"]])

            # Actualizar la lista de autovectores de salida a las versiones normalizadas
            list_autovectores = autovectores_normalizados

            # Solución homogénea: forma con autovectores sin multiplicar (C1 e^{λ1 t} v1 + C2 e^{λ2 t} v2)
            scalar1 = sp.simplify(C1 * sp.exp(lambda1_sym * t_sym))
            scalar2 = sp.simplify(C2 * sp.exp(lambda2_sym * t_sym))
            vec1_latex = sp.latex(v1_sym)
            vec2_latex = sp.latex(v2_sym)
            sol_homogenea_vectorial_unmultiplied_latex = f"X_h(t) = {sp.latex(scalar1)} {vec1_latex} + {sp.latex(scalar2)} {vec2_latex}"

            # Versión multiplicada y simplificada (componentes explícitas)
            sol_homogenea_vectorial = C1 * v1_sym * sp.exp(lambda1_sym * t_sym) + C2 * v2_sym * sp.exp(lambda2_sym * t_sym)
            sol_homogenea_vectorial_latex = f"X_h(t) = {sp.latex(sol_homogenea_vectorial)}"

            # Componentes x_h(t) y y_h(t) de la solución homogénea (multiplicada)
            xh_t = sp.simplify(sol_homogenea_vectorial[0])
            yh_t = sp.simplify(sol_homogenea_vectorial[1])
            sol_homogenea_componentes_latex = [sp.latex(sp.Eq(xs(t_sym), xh_t)), sp.latex(sp.Eq(ys(t_sym), yh_t))]

            # 2. Solución Particular (punto de equilibrio)
            Xp = np.zeros(2)
            if equilibrio_pnto:
                Xp = np.array([equilibrio_pnto['x'], equilibrio_pnto['y']])
            sol_particular_latex = [f"X_p = \\begin{{pmatrix}} {Xp[0]:.4f} \\\\ {Xp[1]:.4f} \\end{{pmatrix}}"]

            # 3. No calculamos numéricamente C1, C2: los dejamos simbólicos
            constantes = {"c1": "C1", "c2": "C2"}

            # 4. Solución general vectorial simbólica: mostrar primero la parte homogénea sin multiplicar
            Xp_sym = sp.Matrix(Xp)
            sol_general_vectorial_unmultiplied_latex = f"X(t) = {sp.latex(scalar1)} {vec1_latex} + {sp.latex(scalar2)} {vec2_latex} + {sp.latex(Xp_sym)}"

            # 5. Solución general multiplicada y simplificada (componentes explícitas)
            sol_general_vectorial = sol_homogenea_vectorial + Xp_sym
            sol_general_vectorial_latex = f"X(t) = {sp.latex(sol_general_vectorial)}"

            x_t = sp.simplify(sol_general_vectorial[0])
            y_t = sp.simplify(sol_general_vectorial[1])
            sol_general_latex = [sp.latex(sp.Eq(xs(t_sym), x_t)), sp.latex(sp.Eq(ys(t_sym), y_t))]

        # Si definimos autovectores_pasos_latex en el flujo anterior, úsalo; si no, vacío
        try:
            autovectores_pasos_latex
        except NameError:
            autovectores_pasos_latex = []
        try:
            autovectores_relaciones_text
        except NameError:
            autovectores_relaciones_text = []

        real_eigenvectors_lines = []
        if equilibrio_unico and equilibrio_pnto:
            for i in range(len(autovalores)):
                if abs(np.imag(autovalores[i])) < 1e-10:
                    vx, vy = float(np.real(autovectores[0, i])), float(np.real(autovectores[1, i]))
                    norm = math.sqrt(vx**2 + vy**2)
                    if norm > 1e-9:
                        vx, vy = vx / norm, vy / norm
                        real_eigenvectors_lines.append([
                            [equilibrio_pnto["x"] - 20 * vx, equilibrio_pnto["y"] - 20 * vy],
                            [equilibrio_pnto["x"] + 20 * vx, equilibrio_pnto["y"] + 20 * vy]
                        ])

        return {
            "matrix_a": [[a, b], [c, d]],
            "vector_b": [e, f],
            "traza": traza,
            "determinante": det_A,
            "clasificacion_homogenea": clasificacion,
            "comportamiento": comportamiento,
            "equilibrio": equilibrio_pnto,
            "autovalores": list_autovalores,
            "autovectores": list_autovectores,
            "autovectores_normalizados": autovectores_normalizados,
            "autovectores_relaciones_latex": autovectores_relaciones_latex,
            "autovectores_parametricos_latex": autovectores_parametricos_latex,
            "autovectores_parametricos_latex": autovectores_parametricos_latex,
            "autovectores_pasos_latex": autovectores_pasos_latex,
            "autovectores_relaciones_text": autovectores_relaciones_text,
            "constantes": constantes,
            "solucion_homogenea_vectorial_latex": sol_homogenea_vectorial_latex,
            "solucion_homogenea_vectorial_unmultiplied_latex": sol_homogenea_vectorial_unmultiplied_latex,
            "solucion_homogenea_componentes_latex": sol_homogenea_componentes_latex,
            "solucion_particular_latex": sol_particular_latex,
            "solucion_general_vectorial_unmultiplied_latex": sol_general_vectorial_unmultiplied_latex,
            "solucion_general_vectorial_latex": sol_general_vectorial_latex,
            "solucion_general_latex": sol_general_latex,
            "principal_trajectory": principal_trajectory,
            "automatic_trajectories": automatic_trajectories,
            "real_eigenvectors_lines": real_eigenvectors_lines
        }

