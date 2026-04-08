"""
Métodos para búsqueda de raíces
- Bisección
- Punto Fijo
- Newton-Raphson
- Aitken (Aceleración)
"""
import numpy as np
from typing import Dict, List, Tuple, Callable
import sympy as sp

class RootFindingService:
    
    @staticmethod
    def compilar_funcion(texto_funcion: str, variables: str = 'x') -> Callable:
        """Convierte string matemático a función callable con NumPy."""
        try:
            texto_funcion = texto_funcion.replace('e^', 'exp(')
            x = sp.Symbol(variables.split()[0])
            expr = sp.sympify(texto_funcion)
            return sp.lambdify(x, expr, 'numpy')
        except Exception as e:
            raise ValueError(f"Error compilando función: {str(e)}")
    
    @staticmethod
    def biseccion(f: Callable, a: float, b: float, 
                  tol: float = 1e-6, max_iter: int = 100, 
                  precision: int = 8) -> Dict:
        """Método de Bisección - acecha cambios de signo."""
        if f(a) * f(b) >= 0:
            raise ValueError("f(a) y f(b) deben tener signos opuestos")
        
        iteraciones = []
        
        for i in range(max_iter):
            c = (a + b) / 2.0
            fc = f(c)
            
            iteraciones.append({
                "i": i,
                "a": round(a, precision),
                "b": round(b, precision),
                "c": round(c, precision),
                "f_c": round(fc, precision),
                "error": round(abs(b - a) / 2, precision)
            })
            
            if abs(fc) < tol or (b - a) / 2.0 < tol:
                return {
                    "metodo": "Bisección",
                    "raiz": round(c, precision),
                    "iteraciones": iteraciones,
                    "convergencia": True,
                    "num_iter": i + 1
                }
            
            if f(a) * f(c) < 0:
                b = c
            else:
                a = c
        
        return {
            "metodo": "Bisección",
            "raiz": round((a + b) / 2, precision),
            "iteraciones": iteraciones,
            "convergencia": False,
            "num_iter": max_iter
        }
    
    @staticmethod
    def punto_fijo(g: Callable, x0: float, 
                   tol: float = 1e-6, max_iter: int = 100,
                   precision: int = 8) -> Dict:
        """Método de Punto Fijo - x = g(x)."""
        x = x0
        iteraciones = []
        
        for i in range(max_iter):
            x_new = g(x)
            error = abs(x_new - x)
            
            iteraciones.append({
                "i": i,
                "x": round(x, precision),
                "g_x": round(x_new, precision),
                "error": round(error, precision)
            })
            
            if error < tol:
                return {
                    "metodo": "Punto Fijo",
                    "raiz": round(x_new, precision),
                    "iteraciones": iteraciones,
                    "convergencia": True,
                    "num_iter": i + 1
                }
            
            x = x_new
        
        return {
            "metodo": "Punto Fijo",
            "raiz": round(x, precision),
            "iteraciones": iteraciones,
            "convergencia": False,
            "num_iter": max_iter
        }
    
    @staticmethod
    def _derivada_numerica(f: Callable, x: float, dx: float = 1e-6) -> float:
        """Aproxima derivada con diferencias centrales."""
        return (f(x + dx) - f(x - dx)) / (2.0 * dx)
    
    @staticmethod
    def newton_raphson(f: Callable, x0: float,
                       tol: float = 1e-6, max_iter: int = 100,
                       precision: int = 8) -> Dict:
        """Método de Newton-Raphson - usa derivada numérica."""
        x = x0
        iteraciones = []
        
        for i in range(max_iter):
            fx = f(x)
            dfx = RootFindingService._derivada_numerica(f, x)
            
            if abs(dfx) < 1e-10:
                raise ValueError("Derivada muy cerca de cero")
            
            x_new = x - fx / dfx
            error = abs(x_new - x)
            
            iteraciones.append({
                "i": i,
                "x": round(x, precision),
                "f_x": round(fx, precision),
                "df_x": round(dfx, precision),
                "x_new": round(x_new, precision),
                "error": round(error, precision)
            })
            
            if error < tol:
                return {
                    "metodo": "Newton-Raphson",
                    "raiz": round(x_new, precision),
                    "iteraciones": iteraciones,
                    "convergencia": True,
                    "num_iter": i + 1
                }
            
            x = x_new
        
        return {
            "metodo": "Newton-Raphson",
            "raiz": round(x, precision),
            "iteraciones": iteraciones,
            "convergencia": False,
            "num_iter": max_iter
        }
    
    @staticmethod
    def aitken(g: Callable, x0: float,
               tol: float = 1e-6, max_iter: int = 100,
               precision: int = 8) -> Dict:
        """Aceleración de Aitken sobre punto fijo."""
        x = x0
        iteraciones = []
        
        for i in range(max_iter):
            x1 = g(x)
            x2 = g(x1)
            
            denominador = x2 - 2*x1 + x
            if abs(denominador) > 1e-10:
                x_acelerado = x - (x1 - x)**2 / denominador
            else:
                x_acelerado = x2
            
            error = abs(x_acelerado - x)
            
            iteraciones.append({
                "i": i,
                "x": round(x, precision),
                "g_x": round(x1, precision),
                "g_g_x": round(x2, precision),
                "x_acelerado": round(x_acelerado, precision),
                "error": round(error, precision)
            })
            
            if error < tol:
                return {
                    "metodo": "Aitken",
                    "raiz": round(x_acelerado, precision),
                    "iteraciones": iteraciones,
                    "convergencia": True,
                    "num_iter": i + 1
                }
            
            x = x_acelerado
        
        return {
            "metodo": "Aitken",
            "raiz": round(x, precision),
            "iteraciones": iteraciones,
            "convergencia": False,
            "num_iter": max_iter
        }
