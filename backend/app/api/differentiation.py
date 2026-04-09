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
        extra = 'allow'

@router.post("/diferencias-finitas")
def diferencias_finitas(req: DifferentiationRequest):
    """Diferencias finitas - llama al método completo nuevo"""
    try:
        if not req.func_str or req.x_val is None:
            raise ValueError("Requiere: func_str, x_val")
        
        h = req.h or 1e-5
        precision = req.precision or 8
        
        # ACÁ LA CONEXIÓN: Llamamos al método nuevo que pusimos al final de la clase
        resultado = DifferentiationService.calcular_diferencias_completas(
            func_str=req.func_str, 
            x_val=req.x_val, 
            h=h, 
            precision=precision
        )
        return resultado
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))