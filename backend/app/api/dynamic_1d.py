from fastapi import APIRouter, HTTPException
import traceback
from pydantic import BaseModel
from typing import Any, Dict, List, Optional

from app.methods.dynamic_1d import Dynamic1DService

router = APIRouter(prefix="/api/dynamic-1d", tags=["Sistemas Dinamicos 1D"])


class Dynamic1DRequest(BaseModel):
    model: Optional[str] = 'custom'
    func_str: Optional[str] = 'x'
    params: Optional[Dict[str, float]] = None
    control_enabled: Optional[bool] = False
    x_min: Optional[float] = -1
    x_max: Optional[float] = 3
    t_max: Optional[float] = 10
    n_phase: Optional[int] = 400
    n_time: Optional[int] = 200
    initial_conditions: Optional[List[float]] = None

    class Config:
        extra = 'allow'


class Dynamic1DBifurcationRequest(BaseModel):
    model: Optional[str] = 'custom'
    func_str: Optional[str] = 'x'
    params: Optional[Dict[str, float]] = None
    control_enabled: Optional[bool] = False
    x_min: Optional[float] = -1
    x_max: Optional[float] = 3
    n_phase: Optional[int] = 400

    bif_param: Optional[str] = 'r'
    bif_min: Optional[float] = -1
    bif_max: Optional[float] = 1
    bif_steps: Optional[int] = 60

    phase_params: Optional[List[float]] = None

    class Config:
        extra = 'allow'


@router.post("/solve")
def solve_system(req: Dynamic1DRequest):
    try:
        payload = req.dict()
        if payload.get('initial_conditions') is None:
            payload['initial_conditions'] = [0.5]
        return Dynamic1DService.solve(payload)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/validate")
def validate_system(req: Dynamic1DRequest):
    try:
        payload = req.dict()
        return Dynamic1DService.validate(payload)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/equilibria")
def equilibria_system(req: Dynamic1DRequest):
    try:
        payload = req.dict()
        model = payload.get('model', 'custom')
        func_str = payload.get('func_str', 'x')
        params = payload.get('params', {}) or {}
        control_enabled = bool(payload.get('control_enabled', False))

        expr_str, params = Dynamic1DService._build_expr(model, func_str, params, control_enabled)
        f, expr_compiled = Dynamic1DService._compile_function(expr_str, params)

        x_min = float(payload.get('x_min', -1))
        x_max = float(payload.get('x_max', 3))
        n_phase = int(payload.get('n_phase', 400))

        roots = Dynamic1DService.find_equilibria(f, x_min, x_max, n=n_phase)
        equilibria = Dynamic1DService.classify_equilibria(f, roots)
        phase = Dynamic1DService.phase_data(f, x_min, x_max, n=n_phase)

        return {
            'model': model,
            'equation': expr_compiled,
            'params': params,
            'equilibria': equilibria,
            'phase': phase,
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/bifurcation")
def bifurcation_system(req: Dynamic1DBifurcationRequest):
    try:
        payload = req.dict()
        return Dynamic1DService.bifurcation(payload)
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=400, detail=str(e))
