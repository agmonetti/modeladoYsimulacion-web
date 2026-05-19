from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Any, Dict, List, Optional

from app.methods.dynamic_2d_linear import Dynamic2DLinearService

router = APIRouter(prefix="/api/dynamic-2d-linear", tags=["Sistemas Dinamicos 2D Lineales"])


class Dynamic2DLinearRequest(BaseModel):
    a: float
    b: float
    c: float
    d: float
    e: Optional[float] = 0.0
    f: Optional[float] = 0.0

    x_min: Optional[float] = -5
    x_max: Optional[float] = 5
    y_min: Optional[float] = -5
    y_max: Optional[float] = 5

    t0: Optional[float] = 0.0
    t_fin: Optional[float] = 10.0
    h: Optional[float] = 0.01

    grid_n: Optional[int] = 25
    auto_trajectories: Optional[bool] = True
    auto_count: Optional[int] = 16
    initial_conditions: Optional[List[Any]] = None

    class Config:
        extra = 'allow'


@router.post("/solve")
def solve_system(req: Dynamic2DLinearRequest):
    try:
        payload = req.dict()
        return Dynamic2DLinearService.solve(payload)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
