import numpy as np
from typing import Callable, Tuple, List, Dict, Any
import sympy as sp
from sympy.parsing.sympy_parser import parse_expr, standard_transformations, implicit_multiplication_application


def parse_function(func_str: str) -> Callable:
    """
    Convierte string a función vectorizada NumPy.
    Ejemplo: "sin(x) + x**2" -> función callable
    """
    try:
        x = sp.Symbol('x')
        expr = parse_expr(
            func_str,
            transformations=(standard_transformations + (implicit_multiplication_application,))
        )
        f_numpy = sp.lambdify(x, expr, modules=['numpy'])
        return f_numpy
    except Exception as e:
        raise ValueError(f"Error al parsear función: {str(e)}")


def numerical_derivative(f: Callable, x: float, order: int = 1, h: float = 1e-6) -> float:
    """
    Calcula derivada numérica usando diferencias centrales.
    order: 1 (primera derivada), 2 (segunda), 3 (tercera), 4 (cuarta)
    """
    if order == 1:
        return (f(x + h) - f(x - h)) / (2 * h)
    elif order == 2:
        return (f(x + h) - 2 * f(x) + f(x - h)) / (h**2)
    elif order == 3:
        return (f(x + 2*h) - 2*f(x + h) + 2*f(x - h) - f(x - 2*h)) / (2 * h**3)
    elif order == 4:
        return (f(x + 2*h) - 4*f(x + h) + 6*f(x) - 4*f(x - h) + f(x - 2*h)) / (h**4)
    else:
        raise ValueError("Order debe ser 1, 2, 3 o 4")


def generate_x_values(a: float, b: float, n: int = 100) -> np.ndarray:
    """Genera n valores equidistantes entre a y b"""
    return np.linspace(a, b, n)


def safe_eval(f: Callable, x: float | np.ndarray) -> float | np.ndarray:
    """Evalúa función de forma segura, manejando excepciones"""
    try:
        result = f(x)
        if np.isnan(result) or np.isinf(result):
            return None
        return result
    except:
        return None


def format_number(value: float, precision: int = 6) -> str:
    """Formatea número con precisión específica"""
    if value is None or np.isnan(value) or np.isinf(value):
        return "N/A"
    return f"{value:.{precision}f}"


def create_plotly_json(x_data: List, y_data: List, title: str, x_label: str = "x", 
                       y_label: str = "y", mode: str = "lines") -> Dict[str, Any]:
    """Crea JSON compatible con Plotly"""
    return {
        "data": [{
            "x": x_data,
            "y": y_data,
            "mode": mode,
            "type": "scatter",
            "name": title
        }],
        "layout": {
            "title": title,
            "xaxis": {"title": x_label},
            "yaxis": {"title": y_label},
            "hovermode": "closest"
        }
    }
