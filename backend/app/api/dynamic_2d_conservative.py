# backend/app/api/dynamic_2d_conservative.py
from typing import Any, Dict, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.methods.dynamic_2d_conservative import Dynamic2DConservativeService

router = APIRouter(
    prefix="/api/dynamic-2d-conservative", tags=["Sistemas Conservativos 2D"]
)


class Dynamic2DConservativeRequest(BaseModel):
    eq_x: str = "y"
    eq_y: str = "x - x**3"
    mu: Optional[float] = 0.0
    x0: Optional[float] = 0.1
    y0: Optional[float] = 0.0
    t0: Optional[float] = 0.0
    t_fin: Optional[float] = 15.0
    h: Optional[float] = 0.02
    x_min: Optional[float] = -2.5
    x_max: Optional[float] = 2.5
    y_min: Optional[float] = -2.5
    y_max: Optional[float] = 2.5
    cantidad_trayectorias: Optional[int] = 25

    class Config:
        extra = "allow"


@router.post("/solve")
def solve_system(req: Dynamic2DConservativeRequest):
    try:
        return Dynamic2DConservativeService.solve(req.dict())
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
