import math
from typing import Any, Callable, Dict, List, Tuple

import numpy as np
import sympy as sp
from scipy.integrate import solve_ivp
from scipy.optimize import brentq
from sympy.parsing.sympy_parser import (
    parse_expr,
    standard_transformations,
    implicit_multiplication_application,
)


class Dynamic1DService:
    @staticmethod
    def _sanitize_expr(expr: str) -> str:
        cleaned = expr.replace('sen', 'sin')
        cleaned = cleaned.replace('e^', 'exp(').replace('^', '**')
        return cleaned

    @staticmethod
    def _parse_expression(expr_str: str, params: Dict[str, float], allowed_symbols: List[str]) -> sp.Expr:
        expr_str = Dynamic1DService._sanitize_expr(expr_str)
        x = sp.Symbol('x')

        local_dict: Dict[str, Any] = {
            'x': x,
            'e': sp.E,
            'pi': sp.pi,
        }

        for key in params.keys():
            local_dict[key] = sp.Symbol(key)

        for sym in allowed_symbols:
            if sym not in local_dict:
                local_dict[sym] = sp.Symbol(sym)

        expr = parse_expr(
            expr_str,
            local_dict=local_dict,
            transformations=(standard_transformations + (implicit_multiplication_application,)),
        )

        free_symbols = {str(sym) for sym in expr.free_symbols}
        allowed = set(allowed_symbols)
        if not free_symbols.issubset(allowed):
            missing = ', '.join(sorted(free_symbols - allowed))
            raise ValueError(f"Faltan parametros: {missing}")

        return expr

    @staticmethod
    def _build_expr(model: str, func_str: str, params: Dict[str, float], control_enabled: bool) -> Tuple[str, Dict[str, float]]:
        if model == 'malthus':
            base = 'r*x'
        elif model == 'verhulst':
            base = 'mu*x*(1 - x/K)'
        elif model == 'newton':
            base = '-k*(x - Ta)'
        else:
            base = func_str

        if control_enabled and model in {'verhulst', 'custom'}:
            base = f'({base}) - h'

        return base, params

    @staticmethod
    def _compile_function(expr_str: str, params: Dict[str, float], allowed_symbols: List[str] = None) -> Tuple[Callable, str]:
        allowed = allowed_symbols or ['x']
        if params:
            allowed = list(dict.fromkeys(allowed + list(params.keys())))
        expr = Dynamic1DService._parse_expression(expr_str, params, allowed)

        if params:
            expr = expr.subs(params)

        free_symbols = {str(sym) for sym in expr.free_symbols}
        if free_symbols and free_symbols != {'x'}:
            missing = ', '.join(sorted(free_symbols - {'x'}))
            raise ValueError(f"Faltan parametros: {missing}")

        x = sp.Symbol('x')
        func = sp.lambdify(x, expr, 'numpy')
        return func, str(expr)

    @staticmethod
    def _safe_eval(f: Callable, x: np.ndarray) -> np.ndarray:
        with np.errstate(all='ignore'):
            y = f(x)
        y = np.asarray(y, dtype=float)
        y[~np.isfinite(y)] = np.nan
        return y

    @staticmethod
    def _numeric_derivative(f: Callable, x: float, h: float = 1e-5) -> float:
        return (float(f(x + h)) - float(f(x - h))) / (2.0 * h)

    @staticmethod
    def _unique_sorted(values: List[float], tol: float = 1e-5) -> List[float]:
        if not values:
            return []
        values_sorted = sorted(values)
        unique_vals = [values_sorted[0]]
        for val in values_sorted[1:]:
            if abs(val - unique_vals[-1]) > tol:
                unique_vals.append(val)
        return unique_vals

    @staticmethod
    def find_equilibria(f: Callable, x_min: float, x_max: float, n: int = 400, tol: float = 1e-6) -> List[float]:
        xs = np.linspace(x_min, x_max, n)
        ys = Dynamic1DService._safe_eval(f, xs)

        roots: List[float] = []
        for i in range(len(xs) - 1):
            y0, y1 = ys[i], ys[i + 1]
            if np.isnan(y0) or np.isnan(y1):
                continue

            if abs(y0) < tol:
                roots.append(float(xs[i]))
            if y0 * y1 < 0:
                try:
                    root = brentq(lambda z: float(f(z)), xs[i], xs[i + 1])
                    roots.append(float(root))
                except Exception:
                    continue
            if abs(y1) < tol:
                roots.append(float(xs[i + 1]))

        return Dynamic1DService._unique_sorted(roots, tol=1e-4)

    @staticmethod
    def classify_equilibria(f: Callable, roots: List[float]) -> List[Dict[str, Any]]:
        results = []
        df_tol = 1e-6
        for root in roots:
            try:
                df = Dynamic1DService._numeric_derivative(f, root)
            except Exception:
                df = float('nan')

            stability = 'indeterminado'
            reason = 'sin datos suficientes'
            if math.isfinite(df) and abs(df) > df_tol:
                if df < 0:
                    stability = 'estable'
                    reason = f"f'(x*) = {df:.6g} < 0"
                else:
                    stability = 'inestable'
                    reason = f"f'(x*) = {df:.6g} > 0"
            else:
                delta = 1e-3 if abs(root) < 1 else 1e-2
                try:
                    left = float(f(root - delta))
                    right = float(f(root + delta))
                    if left > 0 and right < 0:
                        stability = 'estable'
                        reason = f"f(x*-d)>0 y f(x*+d)<0, d={delta:g}"
                    elif left < 0 and right > 0:
                        stability = 'inestable'
                        reason = f"f(x*-d)<0 y f(x*+d)>0, d={delta:g}"
                    elif math.isfinite(left) and math.isfinite(right):
                        stability = 'semiestable'
                        reason = f"f(x*-d) y f(x*+d) no cambian de signo, d={delta:g}"
                except Exception:
                    stability = 'indeterminado'

            results.append({
                'x': root,
                'fprime': df if math.isfinite(df) else None,
                'stability': stability,
                'stability_reason': reason,
            })

        return results

    @staticmethod
    def phase_data(f: Callable, x_min: float, x_max: float, n: int = 400) -> Dict[str, Any]:
        xs = np.linspace(x_min, x_max, n)
        ys = Dynamic1DService._safe_eval(f, xs)

        flow_points: List[Dict[str, float]] = []
        flow_xs = np.linspace(x_min, x_max, 14)
        flow_vals = Dynamic1DService._safe_eval(f, flow_xs)
        for x_val, f_val in zip(flow_xs, flow_vals):
            if np.isnan(f_val):
                continue
            direction = 1 if f_val > 0 else -1 if f_val < 0 else 0
            flow_points.append({'x': float(x_val), 'dir': direction})

        return {
            'x': xs.tolist(),
            'fx': ys.tolist(),
            'flow': flow_points,
        }

    @staticmethod
    def time_solutions(f: Callable, initials: List[float], t_max: float, n: int = 200) -> Dict[str, Any]:
        t_eval = np.linspace(0, t_max, n)
        series = []
        for x0 in initials:
            sol = solve_ivp(
                lambda t, x: f(x),
                (0, t_max),
                [x0],
                t_eval=t_eval,
                method='RK45',
            )
            series.append({
                'x0': float(x0),
                'x': sol.y[0].tolist() if sol.success else [],
            })

        return {
            't': t_eval.tolist(),
            'series': series,
        }

    @staticmethod
    def solve(payload: Dict[str, Any]) -> Dict[str, Any]:
        model = payload.get('model', 'custom')
        func_str = payload.get('func_str', 'x')
        params = payload.get('params', {}) or {}
        control_enabled = bool(payload.get('control_enabled', False))

        expr_str, params = Dynamic1DService._build_expr(model, func_str, params, control_enabled)
        f, expr_compiled = Dynamic1DService._compile_function(expr_str, params)

        x_min = float(payload.get('x_min', -1))
        x_max = float(payload.get('x_max', 3))
        t_max = float(payload.get('t_max', 10))
        n_phase = int(payload.get('n_phase', 400))
        n_time = int(payload.get('n_time', 200))
        initials = payload.get('initial_conditions', [0.5])

        roots = Dynamic1DService.find_equilibria(f, x_min, x_max, n=n_phase)
        equilibria = Dynamic1DService.classify_equilibria(f, roots)
        phase = Dynamic1DService.phase_data(f, x_min, x_max, n=n_phase)
        time = Dynamic1DService.time_solutions(f, initials, t_max, n=n_time)

        return {
            'model': model,
            'equation': expr_compiled,
            'params': params,
            'equilibria': equilibria,
            'phase': phase,
            'time': time,
        }

    @staticmethod
    def validate(payload: Dict[str, Any]) -> Dict[str, Any]:
        model = payload.get('model', 'custom')
        func_str = payload.get('func_str', 'x')
        params = payload.get('params', {}) or {}
        control_enabled = bool(payload.get('control_enabled', False))

        expr_str, params = Dynamic1DService._build_expr(model, func_str, params, control_enabled)
        f, expr_compiled = Dynamic1DService._compile_function(expr_str, params)
        _ = f(0.0)

        return {
            'ok': True,
            'equation': expr_compiled,
            'model': model,
        }

    @staticmethod
    def bifurcation(payload: Dict[str, Any]) -> Dict[str, Any]:
        model = payload.get('model', 'custom')
        func_str = payload.get('func_str', 'x')
        params = payload.get('params', {}) or {}
        control_enabled = bool(payload.get('control_enabled', False))

        bif_param = payload.get('bif_param', 'r')
        x_min = float(payload.get('x_min', -1))
        x_max = float(payload.get('x_max', 3))
        n_phase = int(payload.get('n_phase', 400))

        bif_min = float(payload.get('bif_min', -1))
        bif_max = float(payload.get('bif_max', 1))
        bif_steps = int(payload.get('bif_steps', 60))

        phase_params = payload.get('phase_params', []) or []

        expr_str, _ = Dynamic1DService._build_expr(model, func_str, params, control_enabled)
        expr_template = Dynamic1DService._parse_expression(expr_str, params, ['x', bif_param])

        param_values = np.linspace(bif_min, bif_max, bif_steps)
        equilibria_rows: List[Dict[str, Any]] = []

        for p_val in param_values:
            local_params = dict(params)
            local_params[bif_param] = float(p_val)
            f, _ = Dynamic1DService._compile_function(expr_str, local_params)
            roots = Dynamic1DService.find_equilibria(f, x_min, x_max, n=n_phase)
            equilibria = Dynamic1DService.classify_equilibria(f, roots)
            for eq in equilibria:
                equilibria_rows.append({
                    'param': float(p_val),
                    'x': eq['x'],
                    'fprime': eq['fprime'],
                    'stability': eq['stability'],
                    'stability_reason': eq.get('stability_reason'),
                })

        phase_slices: List[Dict[str, Any]] = []
        for p_val in phase_params:
            local_params = dict(params)
            local_params[bif_param] = float(p_val)
            f, _ = Dynamic1DService._compile_function(expr_str, local_params)
            roots = Dynamic1DService.find_equilibria(f, x_min, x_max, n=n_phase)
            equilibria = Dynamic1DService.classify_equilibria(f, roots)
            phase = Dynamic1DService.phase_data(f, x_min, x_max, n=n_phase)
            phase_slices.append({
                'param': float(p_val),
                'equilibria': equilibria,
                'phase': phase,
            })

        return {
            'model': model,
            'equation': str(expr_template),
            'bif_param': bif_param,
            'bifurcation': {
                'param_values': param_values.tolist(),
                'equilibria': equilibria_rows,
            },
            'phase_slices': phase_slices,
        }
