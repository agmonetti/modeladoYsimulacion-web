import pytest
import math
from app.methods.root_finding import RootFindingService
from app.methods.integration import IntegrationService
from app.methods.differentiation import DifferentiationService
from app.methods.interpolation import InterpolationService
from app.methods.monte_carlo import MonteCarloService

# ==========================================
# 1. PRUEBAS DE INTEGRACIÓN NUMÉRICA
# ==========================================

def test_simpson_13_exactitud():
    func = IntegrationService.compilar_funcion("x**3")
    resultado = IntegrationService.simpson_13_compuesto(func, 0, 2, n=2, precision=6)
    assert resultado["integral"] == pytest.approx(4.0, rel=1e-5)

def test_simpson_13_falla_n_impar():
    func = IntegrationService.compilar_funcion("x**2")
    with pytest.raises(ValueError, match="PAR"):
        IntegrationService.simpson_13_compuesto(func, 0, 2, n=3)

def test_simpson_38_exactitud():
    func = IntegrationService.compilar_funcion("x**3")
    resultado = IntegrationService.simpson_38_compuesto(func, 0, 3, n=3, precision=6)
    assert resultado["integral"] == pytest.approx(20.25, rel=1e-5)

def test_rescate_matematico_integracion():
    func = IntegrationService.compilar_funcion("sin(x)/x")
    resultado = IntegrationService.simpson_13_compuesto(func, 0, 1, n=10, precision=6)
    assert resultado["integral"] == pytest.approx(0.946083, rel=1e-3)
    assert len(resultado["notas"]) > 0

# ==========================================
# 2. PRUEBAS DE BÚSQUEDA DE RAÍCES
# ==========================================

def test_biseccion_raiz_conocida():
    func = RootFindingService.compilar_funcion("x**2 - 4")
    resultado = RootFindingService.biseccion(func, 0, 5, tol=1e-5, max_iter=100, precision=6)
    assert resultado["raiz"] == pytest.approx(2.0, rel=1e-4)

def test_biseccion_falla_segura_sin_raiz():
    func = RootFindingService.compilar_funcion("x**2 - 4")
    with pytest.raises(ValueError, match="signos opuestos"):
        RootFindingService.biseccion(func, 3, 5, tol=1e-5, max_iter=100, precision=6)

def test_newton_raphson_convergencia_rapida():
    func = RootFindingService.compilar_funcion("x**2 - 4")
    resultado = RootFindingService.newton_raphson(func, x0=5.0, tol=1e-5, max_iter=100, precision=6)
    assert resultado["raiz"] == pytest.approx(2.0, rel=1e-5)

def test_aitken_vs_punto_fijo():
    g_func = RootFindingService.compilar_funcion("sqrt(x + 2)")
    res_pf = RootFindingService.punto_fijo(g_func, x0=1.0, tol=1e-5, max_iter=100, precision=6)
    res_aitken = RootFindingService.aitken(g_func, x0=1.0, tol=1e-5, max_iter=100, precision=6)
    assert res_aitken["raiz"] == pytest.approx(2.0, rel=1e-5)
    assert res_aitken["num_iter"] <= res_pf["num_iter"]

# ==========================================
# 3. PRUEBAS DE DIFERENCIACIÓN NUMÉRICA
# ==========================================

def test_diferencias_finitas_exactitud():
    """
    Derivada de x^2 en x=3 es exactamente 6.
    La segunda derivada es exactamente 2.
    """
    res = DifferentiationService.calcular_diferencias_completas("x**2", x_val=3.0, h=0.01)
    
    assert res["derivada_exacta"] == pytest.approx(6.0)
    assert res["segunda_derivada_exacta"] == pytest.approx(2.0)
    
    # Buscamos el método central que es el más preciso
    central = next(r for r in res["resultados"] if r["metodo"] == "Diferencia Central")
    assert central["valor"] == pytest.approx(6.0, rel=1e-3)

def test_diferencias_finitas_funciones_trigonometricas():
    """Derivada de sin(x) en pi/2 debe ser cos(pi/2) = 0"""
    res = DifferentiationService.calcular_diferencias_completas("sin(x)", x_val=math.pi/2, h=0.001)
    assert res["derivada_exacta"] == pytest.approx(0.0, abs=1e-7)

# ==========================================
# 4. PRUEBAS DE INTERPOLACIÓN (LAGRANGE)
# ==========================================

def test_lagrange_exactitud_lineal():
    """
    Una línea recta que pasa por (0,0) y (2,4) es y=2x.
    Evaluada en x=1 debe dar 2.
    """
    res = InterpolationService.lagrange(puntos_x=[0, 2], puntos_y=[0, 4], x_eval=1.0)
    assert res["grado"] <= 1
    assert res["P_eval"] == pytest.approx(2.0)

def test_lagrange_con_funcion_exacta():
    """
    Parábola x^2 que pasa por x={0, 1, 2}.
    Evaluada en x=1.5 debe dar 1.5^2 = 2.25
    """
    res = InterpolationService.lagrange(puntos_x=[0, 1, 2], func_str="x**2", x_eval=1.5)
    assert res["P_eval"] == pytest.approx(2.25)
    assert res["error_local"] == pytest.approx(0.0, abs=1e-7)

# ==========================================
# 5. PRUEBAS DE MONTE CARLO
# ==========================================

def test_montecarlo_hit_or_miss_deterministico():
    """
    Calculamos el área de un triángulo (función f(x)=x de 0 a 2). Area exacta = 2.
    Fijamos semilla para que el resultado sea siempre idéntico en los tests.
    """
    func = MonteCarloService.compilar_funcion("x")
    res = MonteCarloService.hit_or_miss_1d(func, 0, 2, N=10000, seed=42)
    
    # Para N=10000 la aproximación debe estar bastante cerca de 2.0
    assert res["integral"] == pytest.approx(2.0, rel=0.05)
    assert res["n_exitos"] > 0

def test_montecarlo_valor_promedio_deterministico():
    """
    Integral de x^2 entre 0 y 2 es 8/3 ≈ 2.6666...
    Usamos Valor Promedio 1D con semilla.
    """
    func = MonteCarloService.compilar_funcion("x**2")
    res = MonteCarloService.valor_promedio_1d(func, 0, 2, N=10000, seed=42)
    
    assert res["integral"] == pytest.approx(2.6666, rel=0.05)
    assert res["ic_inf"] < res["integral"] < res["ic_sup"] # Verifica que la integral esté dentro del IC