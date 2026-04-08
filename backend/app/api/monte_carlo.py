"""
Endpoints para Monte Carlo
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from app.methods.monte_carlo import MonteCarloService

router = APIRouter(prefix="/api/monte-carlo", tags=["Monte Carlo"])

class MonteCarloRequest(BaseModel):
    method: Optional[str] = None  # hit_or_miss_1d, valor_promedio_1d, valor_promedio_2d, estadistico_1d
    func_str: Optional[str] = None
    a: Optional[float] = None
    b: Optional[float] = None
    N: Optional[int] = None
    seed: Optional[int] = None
    precision: Optional[int] = 8
    # Para 2D
    ya: Optional[float] = None
    yb: Optional[float] = None
    # Para estadístico
    M: Optional[int] = 50
    nivel_confianza: Optional[float] = 0.95
    
    class Config:
        extra = 'allow'  # Permitir campos adicionales

@router.post("/hit-or-miss-1d")
def hit_or_miss_1d(req: MonteCarloRequest):
    """Hit-or-Miss en 1D"""
    try:
        if not req.func_str or req.a is None or req.b is None or req.N is None:
            raise ValueError("Requiere: func_str, a, b, N")
        f = MonteCarloService.compilar_funcion(req.func_str, 'x')
        precision = req.precision or 8
        resultado = MonteCarloService.hit_or_miss_1d(
            f, req.a, req.b, req.N, req.seed, precision
        )
        return resultado
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/valor-promedio-1d")
def valor_promedio_1d(req: MonteCarloRequest):
    """Valor Promedio en 1D"""
    try:
        if not req.func_str or req.a is None or req.b is None or req.N is None:
            raise ValueError("Requiere: func_str, a, b, N")
        f = MonteCarloService.compilar_funcion(req.func_str, 'x')
        precision = req.precision or 8
        resultado = MonteCarloService.valor_promedio_1d(
            f, req.a, req.b, req.N, req.seed, precision
        )
        return resultado
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/convergencia-1d")
def convergencia_1d(req: MonteCarloRequest):
    """Convergencia del método Valor Promedio 1D"""
    try:
        if not req.func_str or req.a is None or req.b is None or req.N is None:
            raise ValueError("Requiere: func_str, a, b, N")
        f = MonteCarloService.compilar_funcion(req.func_str, 'x')
        resultado = MonteCarloService.convergencia_1d(
            f, req.a, req.b, req.N, req.seed
        )
        return resultado
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/valor-promedio-2d")
def valor_promedio_2d(req: MonteCarloRequest):
    """Valor Promedio en 2D"""
    try:
        if not req.func_str or req.a is None or req.b is None or req.ya is None or req.yb is None or req.N is None:
            raise ValueError("Requiere: func_str, a, b, ya, yb, N")
        f = MonteCarloService.compilar_funcion(req.func_str, 'x y')
        precision = req.precision or 8
        resultado = MonteCarloService.valor_promedio_2d(
            f, (req.a, req.b), (req.ya, req.yb), req.N, req.seed, precision
        )
        return resultado
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/valor-promedio-3d")
def valor_promedio_3d(req: MonteCarloRequest):
    """Valor Promedio en 3D"""
    try:
        if not req.func_str or req.ya is None or req.yb is None:
            raise ValueError("Requiere func_str, ya, yb, y debe expandirse para za, zb")
        # Nota: Necesitaría za, zb en el modelo. Por ahora, asumir que vienen en params extras
        raise HTTPException(status_code=501, detail="Endpoint 3D no implementado aún. Requiere za, zb en request")
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/estadistico-1d")
def estadistico_1d(req: MonteCarloRequest):
    """Análisis estadístico 1D"""
    try:
        if not req.func_str:
            raise ValueError("Requiere func_str")
        f = MonteCarloService.compilar_funcion(req.func_str, 'x')
        resultado = MonteCarloService.analisis_estadistico_1d(
            f, req.a, req.b, req.N, req.M or 50, req.nivel_confianza or 0.95, req.seed, req.precision
        )
        return resultado
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
