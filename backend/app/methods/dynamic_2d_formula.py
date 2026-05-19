"""
Servicio para sistemas dinámicos 2D con fórmulas personalizadas.
Acepta expresiones arbitrarias dx/dt = f(x,y) y dy/dt = g(x,y).
"""

import numpy as np
from sympy import symbols, sympify, lambdify
from typing import Dict, List, Tuple, Any
import re


class Dynamic2DFormulaService:
    """
    Resuelve sistemas dinámicos 2D de la forma:
    dx/dt = f(x, y)
    dy/dt = g(x, y)
    
    donde f y g son expresiones matemáticas arbitrarias.
    """

    @staticmethod
    def _validate_formula(formula_str: str) -> bool:
        """Valida sintaxis básica de la fórmula."""
        # Permitir caracteres comunes en matemáticas
        # Se valida más bien en sympify
        return len(formula_str) > 0

    @staticmethod
    def _compile_formulas(dx_dt_str: str, dy_dt_str: str) -> Tuple[callable, callable]:
        """
        Compila las fórmulas a funciones evaluables.
        
        Args:
            dx_dt_str: expresión para dx/dt
            dy_dt_str: expresión para dy/dt
            
        Returns:
            (func_dx_dt, func_dy_dt) - funciones compiladas
        """
        try:
            x, y = symbols('x y', real=True)
            
            # Reemplazar ^ por **
            dx_expr = dx_dt_str.replace('^', '**')
            dy_expr = dy_dt_str.replace('^', '**')
            
            # Parsear y compilar
            dx_sympy = sympify(dx_expr)
            dy_sympy = sympify(dy_expr)
            
            func_dx = lambdify((x, y), dx_sympy, 'numpy')
            func_dy = lambdify((x, y), dy_sympy, 'numpy')
            
            return func_dx, func_dy
        except Exception as e:
            raise ValueError(f"Error compilando fórmulas: {str(e)}")

    @staticmethod
    def _generate_vector_field(
        func_dx, func_dy,
        x_min: float, x_max: float,
        y_min: float, y_max: float,
        grid_n: int = 20
    ) -> Dict[str, Any]:
        """Genera puntos del campo vectorial."""
        x = np.linspace(x_min, x_max, grid_n)
        y = np.linspace(y_min, y_max, grid_n)
        X, Y = np.meshgrid(x, y)
        
        try:
            U = func_dx(X, Y)
            V = func_dy(X, Y)
        except Exception as e:
            raise ValueError(f"Error evaluando fórmulas en el campo: {str(e)}")
        
        # Normalizar para que las flechas tengan longitud consistente
        magnitude = np.sqrt(U**2 + V**2)
        magnitude[magnitude == 0] = 1  # evitar división por cero
        U_norm = U / (magnitude + 1e-6)
        V_norm = V / (magnitude + 1e-6)
        
        return {
            'x': X.flatten().tolist(),
            'y': Y.flatten().tolist(),
            'u': U_norm.flatten().tolist(),
            'v': V_norm.flatten().tolist(),
        }

    @staticmethod
    def _find_equilibrium(func_dx, func_dy, x_range: Tuple, y_range: Tuple) -> Tuple[float, float]:
        """
        Busca un punto de equilibrio (aproximación numérica).
        Puede no encontrar uno si no existe en la región.
        """
        from scipy.optimize import fsolve
        
        def equations(vars):
            x, y = vars
            return [func_dx(x, y), func_dy(x, y)]
        
        try:
            # Punto de partida en el centro del rango
            x0 = np.mean(x_range)
            y0 = np.mean(y_range)
            solution = fsolve(equations, [x0, y0], full_output=True)
            
            if solution[2] == 1:  # Convergió
                x_eq, y_eq = solution[0]
                # Verificar que esté dentro del rango
                if x_range[0] <= x_eq <= x_range[1] and y_range[0] <= y_eq <= y_range[1]:
                    return float(x_eq), float(y_eq)
        except:
            pass
        
        return None, None

    @staticmethod
    def _rk4_integration(
        func_dx, func_dy,
        x0: float, y0: float,
        t0: float, t_fin: float, h: float
    ) -> np.ndarray:
        """
        Integración RK4 de una trayectoria.
        
        Returns:
            array de shape (n_steps, 3) con columnas [t, x, y]
        """
        n_steps = int(np.abs(t_fin - t0) / h) + 1
        solution = np.zeros((n_steps, 3))
        
        t = t0
        x, y = x0, y0
        
        for i in range(n_steps):
            solution[i] = [t, x, y]
            
            if i < n_steps - 1:
                # RK4 step
                k1_x = func_dx(x, y)
                k1_y = func_dy(x, y)
                
                k2_x = func_dx(x + 0.5*h*k1_x, y + 0.5*h*k1_y)
                k2_y = func_dy(x + 0.5*h*k1_x, y + 0.5*h*k1_y)
                
                k3_x = func_dx(x + 0.5*h*k2_x, y + 0.5*h*k2_y)
                k3_y = func_dy(x + 0.5*h*k2_x, y + 0.5*h*k2_y)
                
                k4_x = func_dx(x + h*k3_x, y + h*k3_y)
                k4_y = func_dy(x + h*k3_x, y + h*k3_y)
                
                x += (h/6.0) * (k1_x + 2*k2_x + 2*k3_x + k4_x)
                y += (h/6.0) * (k1_y + 2*k2_y + 2*k3_y + k4_y)
                t += h
        
        return solution

    @staticmethod
    def _auto_trajectories(
        func_dx, func_dy,
        x_min: float, x_max: float,
        y_min: float, y_max: float,
        t0: float, t_fin: float, h: float,
        grid_n: int = 4
    ) -> List[Dict]:
        """Genera trayectorias automáticas en una malla."""
        trajectories = []
        
        x_init = np.linspace(x_min + (x_max-x_min)*0.1, x_max - (x_max-x_min)*0.1, grid_n)
        y_init = np.linspace(y_min + (y_max-y_min)*0.1, y_max - (y_max-y_min)*0.1, grid_n)
        
        colors = ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd',
                  '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf']
        
        for i, x0 in enumerate(x_init):
            for j, y0 in enumerate(y_init):
                try:
                    sol = Dynamic2DFormulaService._rk4_integration(
                        func_dx, func_dy, x0, y0, t0, t_fin, h
                    )
                    
                    trajectories.append({
                        'x': sol[:, 1].tolist(),
                        'y': sol[:, 2].tolist(),
                        'color': colors[(i + j) % len(colors)],
                    })
                except:
                    pass
        
        return trajectories

    @classmethod
    def solve(cls, payload: Dict[str, Any]) -> Dict[str, Any]:
        """
        Resuelve el sistema dinámico personalizado.
        
        Args:
            payload: {
                'dx_dt': str,  # expresión para dx/dt
                'dy_dt': str,  # expresión para dy/dt
                'x_min': float,
                'x_max': float,
                'y_min': float,
                'y_max': float,
                'grid_n': int (default 20),
                'auto_trajectories': bool (default True),
                'initial_conditions': list of [x0, y0] (optional)
            }
        """
        dx_dt_str = payload.get('dx_dt', '').strip()
        dy_dt_str = payload.get('dy_dt', '').strip()
        
        if not dx_dt_str or not dy_dt_str:
            raise ValueError("dx_dt y dy_dt no pueden estar vacíos")
        
        # Validar sintaxis básica
        if not (cls._validate_formula(dx_dt_str) and cls._validate_formula(dy_dt_str)):
            raise ValueError("Fórmulas contienen caracteres no permitidos")
        
        # Compilar fórmulas
        func_dx, func_dy = cls._compile_formulas(dx_dt_str, dy_dt_str)
        
        # Parámetros de visualización
        x_min = float(payload.get('x_min', -5))
        x_max = float(payload.get('x_max', 5))
        y_min = float(payload.get('y_min', -5))
        y_max = float(payload.get('y_max', 5))
        
        # Parámetros de integración (con valores por defecto)
        t0 = 0.0
        t_fin = 10.0
        h = 0.01
        grid_n = int(payload.get('grid_n', 20))
        
        # Validar parámetros
        if x_min >= x_max or y_min >= y_max or t0 >= t_fin or h <= 0:
            raise ValueError("Parámetros inválidos: rangos o paso de integración")
        
        result = {
            'formulas': {
                'dx_dt': dx_dt_str,
                'dy_dt': dy_dt_str,
            },
            'parameters': {
                'x_min': x_min,
                'x_max': x_max,
                'y_min': y_min,
                'y_max': y_max,
                't0': t0,
                't_fin': t_fin,
                'h': h,
            },
            'vector_field': cls._generate_vector_field(
                func_dx, func_dy, x_min, x_max, y_min, y_max, grid_n
            ),
            'trajectories': [],
            'equilibrium': {'x': None, 'y': None},
        }
        
        # Buscar punto de equilibrio
        x_eq, y_eq = cls._find_equilibrium(func_dx, func_dy, (x_min, x_max), (y_min, y_max))
        if x_eq is not None:
            result['equilibrium'] = {'x': x_eq, 'y': y_eq}
        
        # Trayectorias automáticas
        if payload.get('auto_trajectories', True):
            result['trajectories'] = cls._auto_trajectories(
                func_dx, func_dy, x_min, x_max, y_min, y_max,
                t0, t_fin, h, grid_n=4
            )
        
        # Trayectorias personalizadas
        initial_conditions = payload.get('initial_conditions', [])
        for ic in initial_conditions:
            try:
                x0, y0 = float(ic[0]), float(ic[1])
                sol = cls._rk4_integration(func_dx, func_dy, x0, y0, t0, t_fin, h)
                result['trajectories'].append({
                    'x': sol[:, 1].tolist(),
                    'y': sol[:, 2].tolist(),
                    'color': '#ff0000',
                })
            except:
                pass
        
        return result
