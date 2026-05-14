import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';

// Importaciones de tus componentes
import AgregarProducto from './AgregarProducto';
import ListaProductos from './ListaProductos';
import RegistrarMovimiento from './RegistrarMovimiento';
import HistorialMovimientos from './HistorialMovimientos';
import AlertasInventario from './AlertasInventario';
import LectorVentas from './LectorVentas';
import DashboardStats from './DashboardStats';
import GestionProveedores from './GestionProveedores';
import HistorialComunicaciones from './HistorialComunicaciones'; // Nuevo componente

function App() {
  return (
    <Router>
      <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'Segoe UI, sans-serif', backgroundColor: '#f4f6f8' }}>
        
        {/* 🗄️ MENÚ LATERAL (SIDEBAR) */}
        <nav style={{ 
          width: '260px', 
          backgroundColor: '#1e293b', 
          color: 'white', 
          display: 'flex', 
          flexDirection: 'column',
          boxShadow: '4px 0 10px rgba(0,0,0,0.1)',
          position: 'sticky',
          top: 0,
          height: '100vh'
        }}>
          <div style={{ padding: '20px', borderBottom: '1px solid #334155', textAlign: 'center' }}>
            <h2 style={{ margin: 0, color: '#38bdf8', fontSize: '24px' }}>🛒 SUPER VALLE</h2>
            <p style={{ margin: '5px 0 0', fontSize: '12px', color: '#94a3b8' }}>Gestión Comercial</p>
          </div>
          
          <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <Link to="/" style={{ color: 'white', textDecoration: 'none', padding: '10px 15px', borderRadius: '8px', backgroundColor: '#334155', display: 'flex', alignItems: 'center', gap: '10px', transition: '0.2s' }}>
              📊 Dashboard Principal
            </Link>
            <Link to="/proveedores" style={{ color: 'white', textDecoration: 'none', padding: '10px 15px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '10px', transition: '0.2s' }}>
              🏢 Proveedores
            </Link>
            {/* NUEVO LINK: HISTORIAL CORREOS */}
            <Link to="/historial" style={{ color: 'white', textDecoration: 'none', padding: '10px 15px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              📜 Historial Correos
            </Link>
          </div>
        </nav>

        {/* 🖥️ CONTENIDO PRINCIPAL */}
        <main style={{ flex: 1, padding: '30px', overflowY: 'auto', maxWidth: '1200px', margin: '0 auto' }}>
          <Routes>
            
            {/* RUTA 1: DASHBOARD */}
            <Route path="/" element={
              <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
                <DashboardStats /> 
                <AlertasInventario />
                <LectorVentas />

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <AgregarProducto />
                  <RegistrarMovimiento />
                </div>

                <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                  <h3 style={{ marginTop: 0, borderBottom: '2px solid #f1f5f9', paddingBottom: '10px' }}>📦 Inventario Actual</h3>
                  <ListaProductos />
                </div>
                
                <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                  <h3 style={{ marginTop: 0, borderBottom: '2px solid #f1f5f9', paddingBottom: '10px' }}>📜 Historial de Movimientos</h3>
                  <HistorialMovimientos /> 
                </div>
              </div>
            } />

            {/* RUTA 2: GESTIÓN DE PROVEEDORES */}
            <Route path="/proveedores" element={<GestionProveedores />} />

            {/* RUTA 3: HISTORIAL DE COMUNICACIONES */}
            <Route path="/historial" element={<HistorialComunicaciones />} />

          </Routes>
        </main>

      </div>
    </Router>
  );
}

export default App;