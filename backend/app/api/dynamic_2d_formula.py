"""
Router para sistemas dinámicos 2D con fórmulas personalizadas.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional
from app.methods.dynamic_2d_formula import Dynamic2DFormulaService


class Dynamic2DFormulaRequest(BaseModel):
    """Modelo para solicitudes de sistemas dinámicos 2D con fórmulas."""
    dx_dt: str = Field(..., description="Expresión para dx/dt, ej: 'x - y'")
    dy_dt: str = Field(..., description="Expresión para dy/dt, ej: 'x + y'")
    
    x_min: float = Field(default=-5, description="Valor mínimo de x para visualización")
    x_max: float = Field(default=5, description="Valor máximo de x para visualización")
    y_min: float = Field(default=-5, description="Valor mínimo de y para visualización")
    y_max: float = Field(default=5, description="Valor máximo de y para visualización")
    
    grid_n: int = Field(default=20, description="Número de puntos en la malla del campo vectorial")
    auto_trajectories: bool = Field(default=True, description="Generar trayectorias automáticas")
    initial_conditions: Optional[List[List[float]]] = Field(
        default=None, description="Condiciones iniciales personalizadas [[x0, y0], ...]"
    )


router = APIRouter(prefix="/api/dynamic-2d-formula", tags=["dynamic-2d-formula"])


@router.post("/solve")
async def solve_dynamic_2d_formula(request: Dynamic2DFormulaRequest):
    """
    Resuelve un sistema dinámico 2D personalizado con fórmulas.
    
    Ejemplo:
    {
        "dx_dt": "x - y",
        "dy_dt": "x + y",
        "x_min": -5, "x_max": 5,
        "y_min": -5, "y_max": 5,
        "t_fin": 10,
        "h": 0.01
    }
    """
    try:
        payload = request.model_dump()
        print(f"DEBUG: Payload recibido: {payload}")
        result = Dynamic2DFormulaService.solve(payload)
        print(f"DEBUG: Resultado generado con keys: {list(result.keys())}")
        return result
    except ValueError as e:
        print(f"DEBUG: ValueError: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        print(f"DEBUG: Exception: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error interno: {str(e)}")
