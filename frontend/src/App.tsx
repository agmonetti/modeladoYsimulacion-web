import { Routes, Route, Link } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import RootFinding from './pages/RootFinding'
import Differentiation from './pages/Differentiation'
import Integration from './pages/Integration'
import Interpolation from './pages/Interpolation'
import MonteCarlo from './pages/MonteCarlo'
import Comparator from './pages/Comparator'
import './App.css'

function App() {
  return (
    <div className="app-container">
      <nav className="sidebar">
        <div className="logo">
          <h2>Metodos Numericos</h2>
        </div>
        
        <ul className="nav-menu">
          <li><Link to="/">Inicio</Link></li>
          <li className="section-title">Raices</li>
          <li><Link to="/root-finding">Biseccion / Newton-Raphson</Link></li>
          
          <li className="section-title">Derivacion</li>
          <li><Link to="/differentiation">Diferencias Finitas</Link></li>
          
          <li className="section-title">Integracion</li>
          <li><Link to="/integration">Simpson / Trapecio</Link></li>
          
          <li className="section-title">Interpolacion</li>
          <li><Link to="/interpolation">Lagrange</Link></li>
          
          <li className="section-title">Monte Carlo</li>
          <li><Link to="/monte-carlo">Simulacion</Link></li>
          
          <li className="section-title">Herramientas</li>
          <li><Link to="/comparator">Comparador</Link></li>
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
        </Routes>
      </main>
    </div>
  )
}

export default App
