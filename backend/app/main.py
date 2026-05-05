"""
Modelado y Simulación - API Backend
FastAPI application with all numerical methods
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.utils import get_openapi
import os

from app.api import root_finding, differentiation, integration, interpolation, monte_carlo, ode, dynamic_1d

# Initialize FastAPI
app = FastAPI(
    title="Modelado y Simulación - Métodos Numéricos",
    description="API completa para métodos numéricos: Raíces, Derivación, Integración, Interpolación, Monte Carlo",
    version="1.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(root_finding.router)
app.include_router(differentiation.router)
app.include_router(integration.router)
app.include_router(interpolation.router)
app.include_router(monte_carlo.router)
app.include_router(ode.router) 
app.include_router(dynamic_1d.router)

@app.get("/")
def read_root():
    return {
        "titulo": "Modelado y Simulación - API",
        "version": "1.0.0",
        "endpoints": {
            "root_finding": "/api/root-finding",
            "differentiation": "/api/differentiation",
            "integration": "/api/integration",
            "interpolation": "/api/interpolation",
            "monte_carlo": "/api/monte-carlo",
            "ode": "/api/ode",
            "dynamic_1d": "/api/dynamic-1d"
        },
        "docs": "/docs",
        "openapi": "/openapi.json"
    }

@app.get("/health")
def health_check():
    return {"status": "ok"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
