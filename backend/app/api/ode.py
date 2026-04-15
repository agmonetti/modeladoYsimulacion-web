from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.methods.ode import ODEService

router = APIRouter(prefix="/api/ode", tags=["Ecuaciones Diferenciales"])

class ODERequest(BaseModel):
    metodo: str  # "euler", "heun", "rk4", "comparador"
    ecuacion: str
    x0: float
    y0: float
    xf: float
    h: float

@router.post("/resolver")
def resolver_edo(req: ODERequest):
    try:
        if req.metodo == "comparador":
            # Ejecutamos los 3 métodos para la misma ecuación
            euler = ODEService.ejecutar_metodo("euler", req.ecuacion, req.x0, req.y0, req.xf, req.h)
            heun = ODEService.ejecutar_metodo("heun", req.ecuacion, req.x0, req.y0, req.xf, req.h)
            rk4 = ODEService.ejecutar_metodo("rk4", req.ecuacion, req.x0, req.y0, req.xf, req.h)
            
            return {
                "tipo": "comparador",
                "ecuacion": euler["ecuacion"],
                "solucion_exacta_str": euler["solucion_exacta_str"],
                "x_plot": euler["x_plot"],
                "y_exacta_plot": euler["y_exacta_plot"],
                "euler_plot": euler["y_plot"],
                "heun_plot": heun["y_plot"],
                "rk4_plot": rk4["y_plot"],
                # Devolvemos las 3 tablas por si las querés renderizar abajo
                "tabla_euler": euler["tabla"],
                "tabla_heun": heun["tabla"],
                "tabla_rk4": rk4["tabla"]
            }
        else:
            # Ejecución individual
            res = ODEService.ejecutar_metodo(req.metodo, req.ecuacion, req.x0, req.y0, req.xf, req.h)
            res["tipo"] = "individual"
            return res
            
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))