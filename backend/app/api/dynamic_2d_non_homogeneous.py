# backend/app/api/dynamic_2d_non_homogeneous.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, Optional

from app.methods.dynamic_2d_non_homogeneous import Dynamic2DNonHomogeneousService

router = APIRouter(prefix="/api/dynamic-2d-non-homogeneous", tags=["Sistemas Dinamicos 2D No Homogeneos"])

class Dynamic2DNonHomogeneousRequest(BaseModel):
    a: Optional[float] = 0.0
    b: Optional[float] = -1.0
    c: Optional[float] = -9.0
    d: Optional[float] = 0.0
    e: Optional[Any] = 1.0
    f: Optional[Any] = 9.0
    x0: Optional[float] = 2.0
    y0: Optional[float] = 2.0
    t0: Optional[float] = 0.0
    t_fin: Optional[float] = 5.0
    h: Optional[float] = 0.01
    x_min: Optional[float] = -5.0
    x_max: Optional[float] = 5.0
    y_min: Optional[float] = -5.0
    y_max: Optional[float] = 5.0
    cantidad_trayectorias: Optional[int] = 16

    class Config:
        extra = 'allow'

@router.post("/solve")
def solve_system(req: Dynamic2DNonHomogeneousRequest):
    try:
        payload = req.dict()
        return Dynamic2DNonHomogeneousService.solve(payload)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
