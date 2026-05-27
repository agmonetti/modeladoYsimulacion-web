# Modelado y Simulacion - Metodos Numericos Web

Plataforma Full-Stack diseñada para la resolución, análisis estadístico y visualización de métodos numéricos. Desarrollada como proyecto académico para la Universidad Argentina de la Empresa (UADE).

## Inicio

### Opcion 1: Backend Python (Terminal 1)

Crear y activar virtual environment:
```bash
cd backend
python3 -m venv venv
source venv/bin/activate   # En Linux/Mac
# o en Windows:
# py -m venv venv
# Si usas CMD:
# venv\Scripts\activate.bat
# Si usas PowerShell:
# Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
# .\venv\Scripts\Activate.ps1

pip install -r requirements.txt
python run.py
```

### Opcion 2: Frontend React (Terminal 2)

Requiere Node.js instalado y disponible en PATH. Si `pnpm` no se reconoce en PowerShell, cerrá y volvé a abrir la terminal luego de instalar Node.js. En Windows también podés habilitar pnpm con Corepack:

```bash
corepack enable
corepack prepare pnpm@latest --activate
```

```bash
cd frontend
pnpm install
pnpm run dev
```

Si preferís instalarlo globalmente:

```bash
npm install -g pnpm
```

Nota: pnpm genera pnpm-lock.yaml automaticamente al instalar dependencias.

Frontend corre en: http://localhost:3000

### Opcion 3: Docker

```bash
# Primera vez (construye las imágenes)
docker-compose up --build

# Próximas veces
docker-compose up
```

---

## Metodos Disponibles

- Búsqueda de Raíces: Bisección, Newton-Raphson, Punto Fijo, Aceleración de Aitken.

- Diferenciación Numérica: Diferencias Finitas (Progresiva, Regresiva, Central y Segunda Derivada).

- Integración Numérica: Rectángulo Medio, Trapecio (Simple/Compuesto), Simpson 1/3 y 3/8 (Simples/Compuestos) + Comparador de exactitud.

- Interpolación: Polinomio de Lagrange (con análisis de error global y local).

- Ecuaciones Diferenciales Ordinarias (EDO): Método de Euler, Euler Mejorado (Heun) y Runge-Kutta de 4to Orden (RK4), con comparación contra solución exacta y error por paso.

- Dinámica 1D: Modelos Malthus, Verhulst (con control), Newton y personalizado, con equilibrios, diagrama de fase y evolución temporal.

- Bifurcaciones 1D: Saddle-Node, Pitchfork, Transcritical (con variantes) y personalizado, con diagrama de bifurcación y análisis de estabilidad.

- Simulación Monte Carlo: Hit-or-Miss (1D), Valor Promedio (1D, 2D, 3D), Análisis Estadístico con Intervalos de Confianza y Factor de Reducción de Varianza.

---

## tests

```bash
cd backend
source venv/bin/activate
pytest

```

## To DO

- revisar sistemas 2d, diagramas de fase, casos de que vector f sean t.
- revisar sistemas dinamicos 1d, no hay consistencia.
- revisar casos personalizados de las bifurcaciones.




1. Evaluación de expresiones arbitrarias sin sandbox: el backend compila strings con SymPy (sympify/parse_expr) y el frontend usa new Function. Esto abre la puerta a inyección/ejecución de código en el navegador y a expresiones maliciosas o extremadamente costosas en el servidor. Es el riesgo más serio porque afecta seguridad y estabilidad.
2. Sin límites de recursos ni protección ante abuso: parámetros como N, M, n, steps o tamaños de intervalos no tienen tope real. Un request grande puede bloquear CPU/RAM (Monte Carlo, EDO, bifurcaciones, mallas), dejando la API inoperable.
3. API expuesta sin control (CORS *, sin auth ni rate limiting): correcta para laboratorio local, pero muy frágil si se publica. Cualquier cliente puede consumir recursos y extraer datos.
4. Duplicación de lógica crítica en frontend: parseMathExpr, formatToLatex, createJsFunc se repiten en muchas páginas, y hay dos clientes HTTP (api.ts y api/client.js). Esto aumenta el riesgo de inconsistencias y bugs divergentes.
5. Tipado y contratos débiles: TypeScript estricto convive con muchos any, stores en JS y sin validación de respuestas. Falta un contrato API compartido (DTOs), lo que hace frágil el refactor.
6. Manejo de errores poco estructurado: el backend captura Exception genérico y devuelve 400 con str(e). Falta clasificación de errores, códigos estables y trazabilidad útil.
7. Cobertura de tests incompleta: hay buen set de tests en backend, pero no hay tests de frontend ni automatización de calidad (lint/CI) visibles en el repo.
8. Deuda de limpieza y coherencia: archivos y rutas duplicadas o residuales (por ej. main.jsx, api/client.js, public vacío) generan confusión y aumentan el costo de mantenimiento.

- ~mejorar el apartado de 'Analisis de estabilidad'~
- ~el analisis avanzado de geogebra deberia mostrar justamente debajo de dicho boton como fluctua el grafico para una mejor comprension.~

- ~agregar calculo de ET de los metodos que lo tienen, pero para calcularlo necesitan el simbolo raro de e/E. ~ agregado, validar cuando tenga foto del parcial!

- ~agregar calculo de media muestral a la seccion de resultados de montecarlo~
- ~probar montecarlo a full~
- ~revisar si se contempla indirecta o directamente la escala (b-a) en el calculo de los errores~
- ~metodo comparador de integraciones, no muestra si se tuvo que aplciar un rescate matematico~
- ~mobile display iniciada:~
    ~imporante tratar:~
    * ~Sidebar~
    * ~los graficos y tablas~
    * ~grillas de parametros~
- ~metodos de integracion tienen duplicados los parametros de limites y n.~
- ~barra lateral izquierda, agrandar letra~
- ~agregar comparacion de misma funcion de montecarlo en busca de reducir el error en un valor 'j'~ - reprecated
- ~dejar diferencias finitas funcional al 100%.~
- ~tratar la 'tolerancia' y 'precision' de las tablas iterativas.~
- ~metodos comparativos.~
- ~teclado matematico.~
- ~mostrar en el mismo modo 'formula' que mostramos la formula de teoria de cada metodo, la funcion, ya sea f(x) o g(x) para corroborar que la estamos tipeando correctamente, es decir, es la misma que la planteada en el ejercicio. mostrarla justo debajo de dicha funcion.~
- ~mejorar la visual de la barra izquierda lateral, esta muy fea.~
- ~montecarlo.~

## Futuro

- Desarrollo de Servidor MCP (Model Context Protocol): Extracción del core matemático para exponerlo directamente como herramientas nativas para LLMs (Large Language Models), eliminando la dependencia del entorno web completo.
