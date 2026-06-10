# backend/app/api/dynamic_2d_lanchester.py
from typing import Any, Dict, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter(prefix="/api/dynamic-2d-lanchester", tags=["Modelos de Combate 2D"])


class Dynamic2DLanchesterRequest(BaseModel):
    eq_x: str = "-α * y"
    eq_y: str = "-β * x"
    alpha: Optional[float] = 1.0  # α
    beta: Optional[float] = 2.0  # β
    gamma: Optional[float] = 0.0  # γ
    epsilon: Optional[float] = 0.0  # ε
    mu: Optional[float] = 0.0  # μ
    delta: Optional[float] = 0.0  # δ
    x0: Optional[float] = 100.0
    y0: Optional[float] = 80.0
    t0: Optional[float] = 0.0
    t_fin: Optional[float] = 5.0
    h: Optional[float] = 0.01

    class Config:
        extra = "allow"


from app.methods.dynamic_2d_lanchester import Dynamic2DLanchesterService


@router.post("/solve")
def solve_system(req: Dynamic2DLanchesterRequest):
    try:
        return Dynamic2DLanchesterService.solve(req.dict())
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
