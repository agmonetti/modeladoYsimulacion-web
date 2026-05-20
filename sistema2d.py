import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import sympy as sp
import math

# ======================================
# SISTEMAS DINAMICOS LINEALES 2D
# X' = A X + B
# ======================================

# ======================================
# DATOS DE ENTRADA - EDITAR SOLO ACA
# ======================================

decimales = 10

# Sistema:
# x' = a*x + b*y + e
# y' = c*x + d*y + f

a = 3
b = 1
c = 1
d = 3

e = 0
f = 0

# Condicion inicial
x0 = 1
y0 = 1

# Tiempo
t0 = 0
t_fin = 10
h = 0.01

# Rango del plano fase
x_min = -5
x_max = 5
y_min = -5
y_max = 5

# Cantidad de condiciones iniciales automaticas
cantidad_trayectorias = 16

# Activar HTML interactivo con Plotly
crear_html = False

# ======================================
# FUNCIONES AUXILIARES
# ======================================

def truncar(num):
    if num is None:
        return None

    if isinstance(num, (float, np.floating)):
        if np.isnan(num) or np.isinf(num):
            return None

    factor = 10 ** decimales
    return math.trunc(num * factor) / factor


def clasificar_sistema(A):
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


def descripcion_comportamiento(clasificacion):
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


# ======================================
# MATRIZ DEL SISTEMA
# ======================================

A = np.array([
    [a, b],
    [c, d]
], dtype=float)

B = np.array([e, f], dtype=float)

# ======================================
# EQUILIBRIO
# ======================================

det_A = np.linalg.det(A)

if abs(det_A) > 1e-12:
    equilibrio = -np.linalg.solve(A, B)
    equilibrio_unico = True
else:
    equilibrio = None
    equilibrio_unico = False

# ======================================
# AUTOVALORES Y AUTOVECTORES
# ======================================

autovalores, autovectores = np.linalg.eig(A)

traza = np.trace(A)
determinante = np.linalg.det(A)
discriminante = traza**2 - 4 * determinante

clasificacion = clasificar_sistema(A)

tabla_autos = pd.DataFrame({
    "Autovalor": autovalores,
    "Parte real": np.real(autovalores),
    "Parte imaginaria": np.imag(autovalores)
})

tabla_vectores = pd.DataFrame({
    "Autovalor asociado": autovalores,
    "v_x": autovectores[0, :],
    "v_y": autovectores[1, :]
})

tabla_matriz = pd.DataFrame(
    A,
    columns=["x", "y"],
    index=["x'", "y'"]
)

if equilibrio is not None:
    tabla_equilibrio = pd.DataFrame({
        "x*": [equilibrio[0]],
        "y*": [equilibrio[1]],
        "Tipo": [clasificacion]
    })
else:
    tabla_equilibrio = pd.DataFrame({
        "Equilibrio": ["No hay equilibrio unico o hay infinitos"],
        "Tipo": [clasificacion]
    })

tabla_resumen = pd.DataFrame({
    "Traza": [traza],
    "Determinante": [determinante],
    "Discriminante": [discriminante],
    "Clasificacion": [clasificacion],
    "Comportamiento": [descripcion_comportamiento(clasificacion)]
})

# ======================================
# FUNCION DEL SISTEMA
# ======================================

def sistema(t, X):
    return A @ X + B


# ======================================
# RK4 PARA SISTEMA 2D
# ======================================

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


# ======================================
# SOLUCION NUMERICA CONDICION DADA
# ======================================

X0 = np.array([x0, y0], dtype=float)

t_vals, X_vals = rk4_sistema(X0, t0, t_fin, h)

dxdt_vals = []
dydt_vals = []

for Xi in X_vals:
    deriv = sistema(0, Xi)
    dxdt_vals.append(deriv[0])
    dydt_vals.append(deriv[1])

tabla_rk4 = pd.DataFrame({
    "t": t_vals,
    "x(t)": X_vals[:, 0],
    "y(t)": X_vals[:, 1],
    "dx/dt": dxdt_vals,
    "dy/dt": dydt_vals
})

# ======================================
# SOLUCION ANALITICA CON SYMPY
# ======================================

t = sp.symbols('t', real=True)

xs = sp.Function('x')
ys = sp.Function('y')

eq1 = sp.Eq(
    sp.diff(xs(t), t),
    a * xs(t) + b * ys(t) + e
)

eq2 = sp.Eq(
    sp.diff(ys(t), t),
    c * xs(t) + d * ys(t) + f
)

try:
    sol_analitica = sp.dsolve(
        [eq1, eq2],
        ics={
            xs(t0): x0,
            ys(t0): y0
        }
    )

except Exception:
    sol_analitica = None

# ======================================
# NULCLINAS
# ======================================

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

tabla_nulclinas = pd.DataFrame({
    "Nulclina": ["dx/dt = 0", "dy/dt = 0"],
    "Ecuacion": [str(nul_x_expr), str(nul_y_expr)],
    "y despejada": [
        str(nul_x_sol[0]) if len(nul_x_sol) > 0 else "No despejable como y(x)",
        str(nul_y_sol[0]) if len(nul_y_sol) > 0 else "No despejable como y(x)"
    ]
})

# ======================================
# SALIDA EN CONSOLA
# ======================================

pd.set_option('display.max_columns', None)
pd.set_option('display.width', None)
pd.set_option('display.expand_frame_repr', False)
pd.set_option('display.float_format', lambda v: f'{v:.10f}')

print("\n======================================")
print("SISTEMA LINEAL 2D")
print("======================================")

print(f"x' = {a}x + {b}y + {e}")
print(f"y' = {c}x + {d}y + {f}")

print("\nMATRIZ A")
print(tabla_matriz)

print("\nVECTOR B")
print(B)

print("\nRESUMEN DEL SISTEMA")
print(tabla_resumen)

print("\nPUNTO DE EQUILIBRIO")
print(tabla_equilibrio)

print("\nAUTOVALORES")
print(tabla_autos)

print("\nAUTOVECTORES")
print(tabla_vectores)

print("\nNULCLINAS")
print(tabla_nulclinas)

if sol_analitica is not None:
    print("\nSOLUCION ANALITICA")
    print(sol_analitica)
else:
    print("\nSOLUCION ANALITICA")
    print("SymPy no pudo obtenerla automaticamente.")

print("\nTABLA RK4")
print(tabla_rk4.head(20))

print("\nCONCLUSION AUTOMATICA")

if equilibrio is not None:
    print(
        f"El sistema presenta un equilibrio en "
        f"({equilibrio[0]:.6f}, {equilibrio[1]:.6f}), "
        f"clasificado como {clasificacion}. "
        f"{descripcion_comportamiento(clasificacion)}"
    )
else:
    print(
        f"El sistema no tiene equilibrio unico porque det(A) = {det_A:.6f}. "
        f"La clasificacion lineal resulta: {clasificacion}."
    )

# ======================================
# GRAFICO CAMPO VECTORIAL + TRAYECTORIAS
# ======================================

X_grid, Y_grid = np.meshgrid(
    np.linspace(x_min, x_max, 25),
    np.linspace(y_min, y_max, 25)
)

U = a * X_grid + b * Y_grid + e
V = c * X_grid + d * Y_grid + f

norma = np.sqrt(U**2 + V**2)
norma[norma == 0] = 1

U_norm = U / norma
V_norm = V / norma

plt.figure(figsize=(10, 8))

plt.quiver(X_grid, Y_grid, U_norm, V_norm, alpha=0.8)

# Trayectorias automaticas
x0_auto = np.linspace(
    x_min,
    x_max,
    int(np.sqrt(cantidad_trayectorias))
)

y0_auto = np.linspace(
    y_min,
    y_max,
    int(np.sqrt(cantidad_trayectorias))
)

for xi in x0_auto:
    for yi in y0_auto:
        _, X_auto = rk4_sistema(
            np.array([xi, yi]),
            t0,
            t_fin,
            h
        )

        plt.plot(
            X_auto[:, 0],
            X_auto[:, 1],
            linewidth=1,
            alpha=0.7
        )

# Trayectoria principal
plt.plot(
    X_vals[:, 0],
    X_vals[:, 1],
    color="black",
    linewidth=2,
    label="Trayectoria principal"
)

plt.scatter(
    x0,
    y0,
    s=80,
    label="Condicion inicial"
)

# Equilibrio
if equilibrio is not None:
    plt.scatter(
        equilibrio[0],
        equilibrio[1],
        s=120,
        marker="x",
        label="Equilibrio"
    )

# Autovectores reales
if equilibrio is not None:
    for i in range(len(autovalores)):

        if abs(np.imag(autovalores[i])) < 1e-10:

            vec = np.real(autovectores[:, i])
            vec = vec / np.linalg.norm(vec)

            plt.arrow(
                equilibrio[0],
                equilibrio[1],
                vec[0],
                vec[1],
                head_width=0.15,
                length_includes_head=True,
                color="red"
            )

            plt.arrow(
                equilibrio[0],
                equilibrio[1],
                -vec[0],
                -vec[1],
                head_width=0.15,
                length_includes_head=True,
                color="red"
            )

# Nulclinas
x_plot = np.linspace(x_min, x_max, 400)

if len(nul_x_sol) > 0:
    y_nul_x = sp.lambdify(
        x_sym,
        nul_x_sol[0],
        "numpy"
    )(x_plot)

    plt.plot(
        x_plot,
        y_nul_x,
        "--",
        label="Nulclina dx/dt=0"
    )

if len(nul_y_sol) > 0:
    y_nul_y = sp.lambdify(
        x_sym,
        nul_y_sol[0],
        "numpy"
    )(x_plot)

    plt.plot(
        x_plot,
        y_nul_y,
        "--",
        label="Nulclina dy/dt=0"
    )

plt.title(f"Retrato de fase - {clasificacion}")

plt.xlabel("x")
plt.ylabel("y")

plt.xlim(x_min, x_max)
plt.ylim(y_min, y_max)

plt.grid()
plt.legend()

plt.show()

# ======================================
# GRAFICO TEMPORAL
# ======================================

plt.figure(figsize=(10, 6))

plt.plot(t_vals, X_vals[:, 0], label="x(t)")
plt.plot(t_vals, X_vals[:, 1], label="y(t)")

plt.title("Soluciones temporales")

plt.xlabel("t")
plt.ylabel("x(t), y(t)")

plt.grid()
plt.legend()

plt.show()

# ======================================
# GRAFICO DE COMPONENTES dx/dt, dy/dt
# ======================================

plt.figure(figsize=(10, 6))

plt.plot(t_vals, dxdt_vals, label="dx/dt")
plt.plot(t_vals, dydt_vals, label="dy/dt")

plt.title("Derivadas temporales")

plt.xlabel("t")
plt.ylabel("Derivadas")

plt.grid()
plt.legend()

plt.show()

# ======================================
# HTML INTERACTIVO OPCIONAL
# ======================================

if crear_html:

    try:
        import plotly.graph_objects as go

        fig = go.Figure()

        fig.add_trace(go.Scatter(
            x=X_vals[:, 0],
            y=X_vals[:, 1],
            mode="lines",
            name="Trayectoria principal"
        ))

        fig.add_trace(go.Scatter(
            x=[x0],
            y=[y0],
            mode="markers",
            name="Condicion inicial"
        ))

        if equilibrio is not None:
            fig.add_trace(go.Scatter(
                x=[equilibrio[0]],
                y=[equilibrio[1]],
                mode="markers",
                name="Equilibrio"
            ))

        if len(nul_x_sol) > 0:
            fig.add_trace(go.Scatter(
                x=x_plot,
                y=y_nul_x,
                mode="lines",
                name="Nulclina dx/dt=0"
            ))

        if len(nul_y_sol) > 0:
            fig.add_trace(go.Scatter(
                x=x_plot,
                y=y_nul_y,
                mode="lines",
                name="Nulclina dy/dt=0"
            ))

        fig.update_layout(
            title=f"Retrato de fase interactivo - {clasificacion}",
            xaxis_title="x",
            yaxis_title="y"
        )

        fig.write_html("retrato_fase_2d.html")

        print("\nHTML creado: retrato_fase_2d.html")

    except Exception as err:
        print("\nNo se pudo crear el HTML interactivo.")
        print(err)
