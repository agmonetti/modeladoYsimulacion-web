# backend/app/api/dynamic_2d_linear.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, Optional

from app.methods.dynamic_2d_linear import Dynamic2DLinearService

router = APIRouter(prefix="/api/dynamic-2d-linear", tags=["Sistemas Dinamicos 2D Lineales"])

class Dynamic2DLinearRequest(BaseModel):
    a: Optional[float] = 3.0
    b: Optional[float] = 1.0
    c: Optional[float] = 1.0
    d: Optional[float] = 3.0
    e: Optional[float] = 0.0
    f: Optional[float] = 0.0
    x0: Optional[float] = 1.0
    y0: Optional[float] = 1.0
    t0: Optional[float] = 0.0
    t_fin: Optional[float] = 10.0
    h: Optional[float] = 0.01
    x_min: Optional[float] = -5.0
    x_max: Optional[float] = 5.0
    y_min: Optional[float] = -5.0
    y_max: Optional[float] = 5.0
    cantidad_trayectorias: Optional[int] = 16

    class Config:
        extra = 'allow'

@router.post("/solve")
def solve_system(req: Dynamic2DLinearRequest):
    try:
        payload = req.dict()
        return Dynamic2DLinearService.solve(payload)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))