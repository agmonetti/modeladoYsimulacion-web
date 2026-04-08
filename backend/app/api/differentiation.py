"""
Endpoints para derivación numérica
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from app.methods.differentiation import DifferentiationService

router = APIRouter(prefix="/api/differentiation", tags=["Differentiation"])

class DifferentiationRequest(BaseModel):
    func_str: Optional[str] = None
    x_val: Optional[float] = None
    h: Optional[float] = 1e-5
    precision: Optional[int] = 8
    compare_exact: Optional[bool] = False
    
    class Config:
        extra = 'allow'  # Permitir campos adicionales

@router.post("/diferencias-finitas")
def diferencias_finitas(req: DifferentiationRequest):
    """Diferencias finitas - numérica y exacta"""
    try:
        if not req.func_str or req.x_val is None:
            raise ValueError("Requiere: func_str, x_val")
        h = req.h or 1e-5
        precision = req.precision or 8
        compare_exact = req.compare_exact or False
        
        if compare_exact:
            resultado = DifferentiationService.diferencias_finitas_con_exacto(
                req.func_str, req.x_val, h, precision
            )
        else:
            # Solo numérica - necesitamos una función compilada
            f = DifferentiationService.compilar_funcion(req.func_str)[0]
            resultado = DifferentiationService.diferencias_finitas(
                f, req.x_val, h, precision
            )
        return resultado
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
