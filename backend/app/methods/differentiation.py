"""
Derivación Numérica - Diferencias Finitas
- Primera derivada
- Segunda derivada
"""
import numpy as np
from typing import Dict, Callable
import sympy as sp

class DifferentiationService:
    
    @staticmethod
    def compilar_funcion(texto_funcion: str) -> Callable:
        """Convierte string a función callable."""
        try:
            texto_funcion = texto_funcion.replace('e^', 'exp(')
            x = sp.Symbol('x')
            expr = sp.sympify(texto_funcion)
            return sp.lambdify(x, expr, 'numpy'), expr
        except Exception as e:
            raise ValueError(f"Error compilando función: {str(e)}")
    
    @staticmethod
    def diferencias_finitas(f: Callable, x_val: float, h: float = 1e-5,
                           precision: int = 8) -> Dict:
        """Calcula primera y segunda derivada con diferencias centrales."""
        
        # Derivadas numéricas
        f1_aprox = (f(x_val + h) - f(x_val - h)) / (2 * h)
        f2_aprox = (f(x_val + h) - 2*f(x_val) + f(x_val - h)) / (h**2)
        
        return {
            "x": round(x_val, precision),
            "h": round(h, precision),
            "primera_derivada": {
                "aproximada": round(f1_aprox, precision),
                "formula": "(f(x+h) - f(x-h)) / (2h)"
            },
            "segunda_derivada": {
                "aproximada": round(f2_aprox, precision),
                "formula": "(f(x+h) - 2f(x) + f(x-h)) / h²"
            }
        }
    
    @staticmethod
    def diferencias_finitas_con_exacto(f_str: str, x_val: float, h: float = 1e-5,
                                       precision: int = 8) -> Dict:
        """Calcula derivadas numéricas Y las compara con exactas."""
        
        # Compilar
        f, expr = DifferentiationService.compilar_funcion(f_str)
        
        # Derivadas analíticas
        x = sp.Symbol('x')
        df1_expr = sp.diff(expr, x)
        df2_expr = sp.diff(df1_expr, x)
        
        f1_exacta = float(df1_expr.subs(x, x_val).evalf())
        f2_exacta = float(df2_expr.subs(x, x_val).evalf())
        
        # Derivadas numéricas
        f1_aprox = (f(x_val + h) - f(x_val - h)) / (2 * h)
        f2_aprox = (f(x_val + h) - 2*f(x_val) + f(x_val - h)) / (h**2)
        
        # Errores
        error_1 = abs(f1_exacta - f1_aprox)
        error_2 = abs(f2_exacta - f2_aprox)
        
        return {
            "x": round(x_val, precision),
            "h": round(h, precision),
            "primera_derivada": {
                "numerica": round(f1_aprox, precision),
                "exacta": round(f1_exacta, precision),
                "error": round(error_1, 8),
                "formula_numerica": "(f(x+h) - f(x-h)) / (2h)"
            },
            "segunda_derivada": {
                "numerica": round(f2_aprox, precision),
                "exacta": round(f2_exacta, precision),
                "error": round(error_2, 8),
                "formula_numerica": "(f(x+h) - 2f(x) + f(x-h)) / h²"
            }
        }
