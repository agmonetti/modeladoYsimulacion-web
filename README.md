# Modelado y Simulacion - Metodos Numericos Web

Plataforma interactiva para resolver problemas con metodos numericos: raices, integracion, derivacion, interpolacion y Monte Carlo.

## Inicio Rapido

### Opcion 1: Backend Python (Terminal 1)

Crear y activar virtual environment:
```bash
cd backend
python3 -m venv venv
source venv/bin/activate   # En Linux/Mac
# o en Windows:
# venv\Scripts\activate

pip install -r requirements.txt
python run.py
```

Backend corre en: http://localhost:8000
Documentacion API: http://localhost:8000/docs

### Opcion 2: Frontend React (Terminal 2)

```bash
cd frontend
npm install
npm run dev
```

Frontend corre en: http://localhost:3000

---

## Metodos Disponibles

Busqueda de Raices
- Biseccion, Punto Fijo, Newton-Raphson, Aitken

Integracion Numerica  
- Trapecio, Simpson 1/3, Simpson 3/8, Rectangulo

Derivacion
- Diferencias finitas (1ra y 2da derivada)

Interpolacion
- Polinomio de Lagrange

Monte Carlo
- Hit-or-Miss, Valor Promedio

---

## Stack Tecnologico

Backend: FastAPI (Python 3.13) + NumPy + SymPy
Frontend: React 18 + TypeScript + Vite
Estado: Zustand
Graficos: Plotly.js

---

## API Endpoints

```
POST /api/root-finding/bisection
POST /api/root-finding/fixed-point
POST /api/root-finding/newton-raphson
POST /api/root-finding/aitken

POST /api/integration/trapezoidal
POST /api/integration/midpoint
POST /api/integration/simpson-13
POST /api/integration/simpson-38

POST /api/differentiation/finite-differences

POST /api/interpolation/lagrange

POST /api/monte-carlo/hit-or-miss
POST /api/monte-carlo/average-value
```

Ver más en: http://localhost:8000/docs

---

## 🐛 Troubleshooting

```
Puerto 8000 ocupado → Cambiar API_PORT en backend/.env
Módulos faltantes → pip install -r requirements.txt en backend/
npm error → rm -rf frontend/node_modules && npm install
```

---

**Licencia**: MIT
