"""
Integracion Numerica - Formulas de Newton-Cotes
- Trapecio (simple y compuesto)
- Rectangulo (punto medio compuesto)
- Simpson 1/3 (simple y compuesto)
- Simpson 3/8 (simple y compuesto)
"""
import numpy as np
import sympy as sp
from typing import Dict, Callable, List
import warnings

class IntegrationService:
    
    @staticmethod
    def compilar_funcion(texto_funcion: str) -> Callable:
        """Convierte string a funcion callable."""
        try:
            # Reemplazar notaciones
            texto_funcion = texto_funcion.replace('e^', 'exp(')
            texto_funcion = texto_funcion.replace('^', '**')
            x = sp.Symbol('x')
            expr = sp.sympify(texto_funcion)
            return sp.lambdify(x, expr, 'numpy')
        except Exception as e:
            raise ValueError(f"Error compilando funcion: {str(e)}")
    
    @staticmethod
    def _segunda_derivada_numerica(f: Callable, x: np.ndarray, dx: float = 1e-5) -> np.ndarray:
        """Aproxima segunda derivada usando diferencias centrales."""
        return (f(x + dx) - 2 * f(x) + f(x - dx)) / (dx**2)
    
    @staticmethod
    def _cuarta_derivada_numerica(f: Callable, x: np.ndarray, dx: float = 1e-3) -> np.ndarray:
        """Aproxima cuarta derivada usando diferencias centrales."""
        return (f(x + 2*dx) - 4*f(x + dx) + 6*f(x) - 4*f(x - dx) + f(x - 2*dx)) / (dx**4)
    
    
    @staticmethod
    def rectangulo_compuesto(f: Callable, a: float, b: float, n: int,
                            precision: int = 8) -> Dict:
        """Regla del Rectangulo (punto medio) compuesta."""
        h = (b - a) / n
        x = np.linspace(a, b, n + 1)
        x_medio = np.linspace(a + h/2, b - h/2, n)
        
        with warnings.catch_warnings():
            warnings.simplefilter("ignore")
            y_medio = f(x_medio)
        
        integral = h * np.sum(y_medio)
        
        # Error automatico
        x_fino = np.linspace(a, b, 100)
        max_segunda = np.max(np.abs(IntegrationService._segunda_derivada_numerica(f, x_fino)))
        cota_error = ((b - a)**3 / (24 * n**2)) * max_segunda
        
        tabla = []
        for i in range(n):
            tabla.append({
                "i": i,
                "x_n": round(float(x[i]), precision),
                "x_medio": round(float(x_medio[i]), precision),
                "f_x_medio": round(float(y_medio[i]), precision)
            })
        
        return {
            "metodo": "Rectangulo Compuesto",
            "a": a, "b": b, "n": n, "h": round(h, precision),
            "integral": round(float(integral), precision),
            "cota_error": round(float(cota_error), 10),
            "tabla": tabla,
            "formula": "I = h * Suma[f(x_medio_i)]"
        }
    
    
    @staticmethod
    def trapecio_compuesto(f: Callable, a: float, b: float, n: int,
                          precision: int = 8) -> Dict:
        """Regla del Trapecio compuesta."""
        h = (b - a) / n
        x = np.linspace(a, b, n + 1)
        
        with warnings.catch_warnings():
            warnings.simplefilter("ignore")
            y = f(x)
        
        S = y[0] + y[-1] + 2 * np.sum(y[1:-1])
        integral = (h / 2) * S
        
        # Error
        x_fino = np.linspace(a, b, 100)
        max_segunda = np.max(np.abs(IntegrationService._segunda_derivada_numerica(f, x_fino)))
        cota_error = ((b - a)**3 / (12 * n**2)) * max_segunda
        
        tabla = []
        for i in range(len(x)):
            tabla.append({
                "i": i,
                "x_n": round(float(x[i]), precision),
                "f_x_n": round(float(y[i]), precision)
            })
        
        return {
            "metodo": "Trapecio Compuesto",
            "a": a, "b": b, "n": n, "h": round(h, precision),
            "integral": round(float(integral), precision),
            "cota_error": round(float(cota_error), 10),
            "tabla": tabla,
            "formula": "I = (h/2) * [f(x0) + 2*Suma(f(xi)) + f(xn)]"
        }
    
    
    @staticmethod
    def simpson_13_compuesto(f: Callable, a: float, b: float, n: int,
                            precision: int = 8) -> Dict:
        """Simpson 1/3 compuesto (n DEBE SER PAR)."""
        if n % 2 != 0:
            raise ValueError("n debe ser PAR para Simpson 1/3")
        
        h = (b - a) / n
        x = np.linspace(a, b, n + 1)
        
        with warnings.catch_warnings():
            warnings.simplefilter("ignore")
            y = f(x)
        
        # Indices impares y pares
        impares = y[1:n:2]  # x1, x3, x5, ...
        pares = y[2:n-1:2]  # x2, x4, x6, ...
        
        S = y[0] + y[-1] + 4 * np.sum(impares) + 2 * np.sum(pares)
        integral = (h / 3) * S
        
        # Error
        x_fino = np.linspace(a, b, 100)
        max_cuarta = np.max(np.abs(IntegrationService._cuarta_derivada_numerica(f, x_fino)))
        cota_error = ((b - a)**5 / (180 * n**4)) * max_cuarta
        
        tabla = []
        for i in range(len(x)):
            tabla.append({
                "i": i,
                "x_n": round(float(x[i]), precision),
                "f_x_n": round(float(y[i]), precision)
            })
        
        return {
            "metodo": "Simpson 1/3 Compuesto",
            "a": a, "b": b, "n": n, "h": round(h, precision),
            "integral": round(float(integral), precision),
            "cota_error": round(float(cota_error), 10),
            "tabla": tabla,
            "formula": "I = (h/3) * [f(x0) + 4*Suma(impares) + 2*Suma(pares) + f(xn)]"
        }
    
    
    @staticmethod
    def simpson_38_compuesto(f: Callable, a: float, b: float, n: int,
                            precision: int = 8) -> Dict:
        """Simpson 3/8 compuesto (n DEBE SER MULTIPLO DE 3)."""
        if n % 3 != 0:
            raise ValueError("n debe ser multiplo de 3 para Simpson 3/8")
        
        h = (b - a) / n
        x = np.linspace(a, b, n + 1)
        
        with warnings.catch_warnings():
            warnings.simplefilter("ignore")
            y = f(x)
        
        # Agrupacion para Simpson 3/8
        grupo_1 = y[1:n:3]   # i ≡ 1 (mod 3)
        grupo_2 = y[2:n:3]   # i ≡ 2 (mod 3)
        grupo_3 = y[3:n-1:3] # i ≡ 0 (mod 3), intermedios
        
        S = y[0] + y[-1] + 3 * (np.sum(grupo_1) + np.sum(grupo_2)) + 2 * np.sum(grupo_3)
        integral = (3 * h / 8) * S
        
        # Error
        x_fino = np.linspace(a, b, 100)
        max_cuarta = np.max(np.abs(IntegrationService._cuarta_derivada_numerica(f, x_fino)))
        cota_error = ((b - a)**5 / (80 * n**4)) * max_cuarta
        
        tabla = []
        for i in range(len(x)):
            tabla.append({
                "i": i,
                "x_n": round(float(x[i]), precision),
                "f_x_n": round(float(y[i]), precision)
            })
        
        return {
            "metodo": "Simpson 3/8 Compuesto",
            "a": a, "b": b, "n": n, "h": round(h, precision),
            "integral": round(float(integral), precision),
            "cota_error": round(float(cota_error), 10),
            "tabla": tabla,
            "formula": "I = (3h/8) * [f(x0) + 3*Suma(grupos) + 2*Suma(intermedios) + f(xn)]"
        }
