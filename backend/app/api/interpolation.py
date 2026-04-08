"""
Endpoints para interpolación
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from app.methods.interpolation import InterpolationService

router = APIRouter(prefix="/api/interpolation", tags=["Interpolation"])

class LagrangeRequest(BaseModel):
    puntos_x: Optional[List[float]] = None
    x_eval: Optional[float] = None
    func_str: Optional[str] = None
    puntos_y: Optional[List[float]] = None
    precision: Optional[int] = 8
    
    class Config:
        extra = 'allow'  # Permitir campos adicionales

@router.post("/lagrange")
def lagrange(req: LagrangeRequest):
    """Interpolación de Lagrange"""
    try:
        if not req.puntos_x:
            raise ValueError("Requiere: puntos_x")
        precision = req.precision or 8
        resultado = InterpolationService.lagrange(
            req.puntos_x, req.x_eval, req.func_str, req.puntos_y, precision
        )
        return resultado
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
