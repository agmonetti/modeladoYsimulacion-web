# backend/app/api/dynamic_2d_nonlinear.py
from typing import Any, Dict, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.methods.dynamic_2d_nonlinear import Dynamic2DNonLinearService

router = APIRouter(
    prefix="/api/dynamic-2d-nonlinear", tags=["Sistemas Dinamicos 2D No Lineales"]
)


class Dynamic2DNonLinearRequest(BaseModel):
    eq_x: str = "y - x"
    eq_y: str = "x**2 - 1"
    mu: Optional[float] = 0.0  # Nuevo parametro de bifurcacion
    params: Optional[Dict[str, float]] = None
    x0: Optional[float] = 0.5
    y0: Optional[float] = 0.5
    t0: Optional[float] = 0.0
    t_fin: Optional[float] = 10.0
    h: Optional[float] = 0.02
    x_min: Optional[float] = -3.0
    x_max: Optional[float] = 3.0
    y_min: Optional[float] = -3.0
    y_max: Optional[float] = 3.0
    cantidad_trayectorias: Optional[int] = 25

    class Config:
        extra = "allow"


@router.post("/solve")
def solve_system(req: Dynamic2DNonLinearRequest):
    try:
        return Dynamic2DNonLinearService.solve(req.dict())
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
