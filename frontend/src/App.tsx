import { useState } from 'react'
import { Routes, Route, Link } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import RootFinding from './pages/RootFinding'
import Differentiation from './pages/Differentiation'
import Integration from './pages/Integration'
import Interpolation from './pages/Interpolation'
import MonteCarlo from './pages/MonteCarlo'
import Comparator from './pages/Comparator'
import EDO from './pages/EDO'
import './App.css'

function App() {
  // Estado para controlar la barra lateral en mobile
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen)
  const closeSidebar = () => setIsSidebarOpen(false)

  return (
    <div className="app-container">
      {/* Botón de Menú para Mobile (Oculto en PC) */}
      <div className="mobile-header">
        <button className="menu-btn" onClick={toggleSidebar}>
          <span style={{ fontWeight: 'bold' }}>⊞ Menú</span>
        </button>
        <span className="mobile-title">Métodos Numéricos</span>
      </div>

      {/* Sombra de fondo cuando el menú está abierto en mobile */}
      {isSidebarOpen && <div className="sidebar-overlay" onClick={closeSidebar}></div>}

      <nav className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div className="logo">
          <h2>Metodos Numericos</h2>
        </div>
        
        {/* Agregamos el closeSidebar a cada link para que se cierre al elegir un método */}
        <ul className="nav-menu">
          <li><Link to="/" onClick={closeSidebar}>Inicio</Link></li>
          <li className="section-title">Raices</li>
          <li><Link to="/root-finding" onClick={closeSidebar}>Biseccion / Newton-Raphson</Link></li>
          
          <li className="section-title">Derivacion</li>
          <li><Link to="/differentiation" onClick={closeSidebar}>Diferencias Finitas</Link></li>
          
          <li className="section-title">Integracion</li>
          <li><Link to="/integration" onClick={closeSidebar}>Simpson / Trapecio</Link></li>
          
          <li className="section-title">Interpolacion</li>
          <li><Link to="/interpolation" onClick={closeSidebar}>Lagrange</Link></li>
          
          <li className="section-title">Monte Carlo</li>
          <li><Link to="/monte-carlo" onClick={closeSidebar}>Simulacion</Link></li>

          <li className="section-title">Ecuaciones Diferenciales</li>
          <li><Link to="/edo" onClick={closeSidebar}>Euler / Heun / RK4</Link></li>
          
          <li className="section-title">Herramientas</li>
          <li><Link to="/comparator" onClick={closeSidebar}>Comparador</Link></li>
        </ul>
      </nav>

      <main className="main-content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/root-finding" element={<RootFinding />} />
          <Route path="/differentiation" element={<Differentiation />} />
          <Route path="/integration" element={<Integration />} />
          <Route path="/interpolation" element={<Interpolation />} />
          <Route path="/monte-carlo" element={<MonteCarlo />} />
          <Route path="/comparator" element={<Comparator />} />
          {/* Agregamos la ruta para EDOs */}
          <Route path="/edo" element={<EDO />} />
        </Routes>
      </main>
    </div>
  )
}

export default App