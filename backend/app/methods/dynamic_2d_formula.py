"""
Servicio para sistemas dinámicos 2D con fórmulas personalizadas.
dx/dt = f(x, y), dy/dt = g(x, y)
Inspirado en Dynamic2DLinearService pero para fórmulas arbitrarias.
"""

import math
import numpy as np
from typing import Any, Dict, List, Optional, Tuple
from sympy import symbols, sympify, lambdify


class Dynamic2DFormulaService:
    """Resuelve sistemas 2D con fórmulas personalizadas."""

    @staticmethod
    def _preprocess_formula(expr: str) -> str:
        """Inserta * implícitos: 3x → 3*x, x( → x*(, )y → )*y, etc."""
        result = []
        for i, ch in enumerate(expr):
            result.append(ch)
            if i < len(expr) - 1:
                curr, nxt = ch, expr[i + 1]
                should_insert = (
                    (curr.isdigit() and nxt.isalpha()) or
                    (curr == ')' and (nxt.isalpha() or nxt.isdigit() or nxt == '(')) or
                    (curr.isalpha() and nxt == '(') or
                    (curr.isalpha() and nxt.isdigit())
                )
                if should_insert and nxt != '*':
                    result.append('*')
        return ''.join(result)

    @staticmethod
    def _compile_expr(expr_str: str):
        """Compila una expresión a función evaluable."""
        try:
            x, y = symbols('x y', real=True)
            expr_clean = Dynamic2DFormulaService._preprocess_formula(expr_str).replace('^', '**')
            expr_sym = sympify(expr_clean)
            return lambdify((x, y), expr_sym, 'numpy')
        except Exception as e:
            raise ValueError(f"Error compilando: {expr_str}: {str(e)}")

    @staticmethod
    def _rk4_step(f_dx, f_dy, x: float, y: float, h: float) -> Tuple[float, float]:
        """Un paso de RK4."""
        k1x = float(f_dx(x, y))
        k1y = float(f_dy(x, y))
        k2x = float(f_dx(x + h*k1x/2, y + h*k1y/2))
        k2y = float(f_dy(x + h*k1x/2, y + h*k1y/2))
        k3x = float(f_dx(x + h*k2x/2, y + h*k2y/2))
        k3y = float(f_dy(x + h*k2x/2, y + h*k2y/2))
        k4x = float(f_dx(x + h*k3x, y + h*k3y))
        k4y = float(f_dy(x + h*k3x, y + h*k3y))
        
        dx = h/6 * (k1x + 2*k2x + 2*k3x + k4x)
        dy = h/6 * (k1y + 2*k2y + 2*k3y + k4y)
        return x + dx, y + dy

    @staticmethod
    def _trajectory(f_dx, f_dy, x0: float, y0: float, t0: float, t_fin: float, h: float) -> Dict[str, List]:
        """Integra una trayectoria."""
        t_vals, x_vals, y_vals = [], [], []
        x, y, t = x0, y0, t0
        
        # Determine direction
        direction = 1.0 if t_fin >= t0 else -1.0
        h_actual = h if h > 0 else -h
        
        while direction * (t_fin - t) >= -1e-9:  # Pequeno margen para errores numericos
            t_vals.append(float(t))
            x_vals.append(float(x))
            y_vals.append(float(y))
            x, y = Dynamic2DFormulaService._rk4_step(f_dx, f_dy, x, y, direction * h_actual)
            t += direction * h_actual
        
        return {'t': t_vals, 'x': x_vals, 'y': y_vals}

    @staticmethod
    def solve(payload: Dict[str, Any]) -> Dict[str, Any]:
        """
        Resuelve un sistema 2D personalizado.
        
        payload: {
            'dx_dt': str,  expresión
            'dy_dt': str,
            'x_min': float, 'x_max': float, 'y_min': float, 'y_max': float,
            't_fin': float (default 10),
            'h': float (default 0.01),
            'grid_n': int (default 20),
            'auto_trajectories': bool (default True),
            'initial_conditions': [[x0,y0], ...] (optional)
        }
        """
        dx_str = payload.get('dx_dt', '').strip()
        dy_str = payload.get('dy_dt', '').strip()
        
        if not dx_str or not dy_str:
            raise ValueError("dx_dt y dy_dt no pueden estar vacíos")
        
        # Compilar expresiones
        f_dx = Dynamic2DFormulaService._compile_expr(dx_str)
        f_dy = Dynamic2DFormulaService._compile_expr(dy_str)
        
        # Parámetros
        x_min = float(payload.get('x_min', -5))
        x_max = float(payload.get('x_max', 5))
        y_min = float(payload.get('y_min', -5))
        y_max = float(payload.get('y_max', 5))
        t0 = 0.0
        t_fin = float(payload.get('t_fin', 10.0))
        h = float(payload.get('h', 0.01))
        grid_n = int(payload.get('grid_n', 20))
        
        if x_min >= x_max or y_min >= y_max or h == 0:
            raise ValueError("Parámetros inválidos: x_min >= x_max o y_min >= y_max o h == 0")
        
        # Campo vectorial
        x_vals = np.linspace(x_min, x_max, grid_n)
        y_vals = np.linspace(y_min, y_max, grid_n)
        X, Y = np.meshgrid(x_vals, y_vals)
        
        try:
            U = f_dx(X, Y)
            V = f_dy(X, Y)
            U = np.asarray(U, dtype=float)
            V = np.asarray(V, dtype=float)
            U = np.nan_to_num(U, nan=0.0, posinf=0.0, neginf=0.0)
            V = np.nan_to_num(V, nan=0.0, posinf=0.0, neginf=0.0)
        except Exception as e:
            raise ValueError(f"Error en campo vectorial: {str(e)}")
        
        mag = np.sqrt(U**2 + V**2)
        mag[mag == 0] = 1.0
        U_norm = U / mag
        V_norm = V / mag
        
        # Trayectorias
        trajectories = []
        initials = payload.get('initial_conditions', [])
        
        if payload.get('auto_trajectories', True) and not initials:
            # Generar automáticamente
            count = max(4, int(math.sqrt(grid_n)))
            x_init = np.linspace(x_min + (x_max-x_min)*0.1, x_max - (x_max-x_min)*0.1, count)
            y_init = np.linspace(y_min + (y_max-y_min)*0.1, y_max - (y_max-y_min)*0.1, count)
            initials = [[float(x), float(y)] for x in x_init for y in y_init]
        
        colors = ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd',
                  '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf']
        
        for idx, ic in enumerate(initials):
            try:
                x0, y0 = float(ic[0]), float(ic[1])
                traj = Dynamic2DFormulaService._trajectory(f_dx, f_dy, x0, y0, t0, t_fin, h)
                if traj['x']:
                    trajectories.append({
                        'x': traj['x'],
                        'y': traj['y'],
                        'color': colors[idx % len(colors)],
                    })
            except Exception as e:
                # Ignorar trayectorias que fallan
                pass
        
        # Equilibrio (aproximación numérica)
        eq = {'x': None, 'y': None}
        try:
            from scipy.optimize import fsolve
            def eqs(vars):
                return [float(f_dx(vars[0], vars[1])), float(f_dy(vars[0], vars[1]))]
            
            x0 = (x_min + x_max) / 2
            y0 = (y_min + y_max) / 2
            sol, info, ier, mesg = fsolve(eqs, [x0, y0], full_output=True)
            
            if ier == 1:
                sol_x, sol_y = float(sol[0]), float(sol[1])
                if x_min <= sol_x <= x_max and y_min <= sol_y <= y_max:
                    eq = {'x': sol_x, 'y': sol_y}
        except:
            pass
        
        return {
            'formulas': {'dx_dt': dx_str, 'dy_dt': dy_str},
            'parameters': {
                'x_min': x_min, 'x_max': x_max, 'y_min': y_min, 'y_max': y_max,
                't0': t0, 't_fin': t_fin, 'h': h,
            },
            'vector_field': {
                'x': X.flatten().tolist(),
                'y': Y.flatten().tolist(),
                'u': U_norm.flatten().tolist(),
                'v': V_norm.flatten().tolist(),
            },
            'trajectories': trajectories,
            'equilibrium': eq,
        }
