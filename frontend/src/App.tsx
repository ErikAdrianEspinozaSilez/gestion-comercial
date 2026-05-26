import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import Login from './Login';

// Componentes
import AgregarProducto from './AgregarProducto';
import ListaProductos from './ListaProductos';
import RegistrarMovimiento from './RegistrarMovimiento';
import HistorialMovimientos from './HistorialMovimientos';
import AlertasInventario from './AlertasInventario';
import LectorVentas from './LectorVentas';
import GestionProveedores from './GestionProveedores';
import HistorialComunicaciones from './HistorialComunicaciones';
import DashboardVentas from './DashboardVentas';
import GestionUsuarios from './GestionUsuarios'; // Asegúrate de tener este import

function App() {
  const { user, logout } = useAuth();
  
  // ESTADOS PARA RESPONSIVIDAD
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [menuOpen, setMenuOpen] = useState(false);

  // Detectar cambios en el tamaño de la pantalla
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) setMenuOpen(false); // Cierra el menú al agrandar
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!user) return <Login />;

  const rol = Number(user.rol_id);

  const navLinkStyle = ({ isActive }: { isActive: boolean }) => ({
    color: isActive ? '#ffffff' : '#94a3b8',
    textDecoration: 'none',
    padding: '12px 15px',
    borderRadius: '10px',
    backgroundColor: isActive ? '#3b82f6' : 'transparent',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    fontWeight: isActive ? 'bold' : 'normal',
    transition: 'all 0.3s ease',
  });

  return (
    <Router>
      <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', minHeight: '100vh', backgroundColor: '#f8fafc' }}>
        
        {/* CABECERA MÓVIL (Solo visible en celulares) */}
        {isMobile && (
          <div style={{ padding: '15px 20px', backgroundColor: '#0f172a', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 50 }}>
            <h2 style={{ margin: 0, color: '#38bdf8', fontSize: '18px' }}>🛒 SUPER VALLE</h2>
            <button onClick={() => setMenuOpen(!menuOpen)} style={{ background: 'none', border: 'none', color: 'white', fontSize: '24px', cursor: 'pointer' }}>
              {menuOpen ? '✖' : '☰'}
            </button>
          </div>
        )}

        {/* SIDEBAR FIJO (O desplegable en móvil) */}
        <nav style={{ 
          width: isMobile ? '100%' : '260px', 
          minWidth: isMobile ? '100%' : '260px', 
          flexShrink: 0, 
          backgroundColor: '#0f172a', 
          color: 'white', 
          height: isMobile ? (menuOpen ? 'auto' : '0') : '100vh', 
          position: isMobile ? 'absolute' : 'sticky', 
          top: isMobile ? '56px' : 0, 
          display: (isMobile && !menuOpen) ? 'none' : 'flex', 
          flexDirection: 'column',
          zIndex: 40,
          overflow: 'hidden'
        }}>
          
          {!isMobile && (
            <div style={{ padding: '25px 20px', textAlign: 'center', borderBottom: '1px solid #1e293b' }}>
              <h2 style={{ color: '#38bdf8', fontSize: '20px', margin: 0 }}>🛒 SUPER VALLE</h2>
              <p style={{ fontSize: '10px', color: '#64748b', marginTop: '10px' }}>Usuario: @{user.usuario_login}</p>
            </div>
          )}

          <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
            {/* Al hacer clic en un enlace en móvil, cerramos el menú */}
            <div onClick={() => isMobile && setMenuOpen(false)}><NavLink to="/" style={navLinkStyle}>📊 Panel de Control</NavLink></div>

            {(rol === 1 || rol === 2) && (
              <>
                <div onClick={() => isMobile && setMenuOpen(false)}><NavLink to="/inventario" style={navLinkStyle}>📦 Inventario</NavLink></div>
                <div onClick={() => isMobile && setMenuOpen(false)}><NavLink to="/movimientos" style={navLinkStyle}>📜 Movimientos</NavLink></div>
              </>
            )}

            {rol === 1 && (
              <>
                <div onClick={() => isMobile && setMenuOpen(false)}><NavLink to="/proveedores" style={navLinkStyle}>🏢 Proveedores</NavLink></div>
                <div onClick={() => isMobile && setMenuOpen(false)}><NavLink to="/historial-correos" style={navLinkStyle}>📧 Correos</NavLink></div>
                <div onClick={() => isMobile && setMenuOpen(false)}><NavLink to="/usuarios" style={navLinkStyle}>👥 Usuarios</NavLink></div>
              </>
            )}
          </div>

          <div style={{ padding: '20px', borderTop: '1px solid #1e293b' }}>
            <button onClick={logout} style={{ width: '100%', padding: '12px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
              🚪 Cerrar Sesión
            </button>
          </div>
        </nav>

        {/* CONTENIDO PRINCIPAL */}
        {/* En móvil reducimos el padding para aprovechar la pantalla pequeña */}
        <main style={{ flex: 1, padding: isMobile ? '15px' : '40px', overflowY: 'auto', width: '100%', boxSizing: 'border-box' }}>
          <Routes>
            <Route path="/" element={
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <DashboardVentas />
                <AlertasInventario />
                <LectorVentas />
                {/* Modificamos el Grid para que sea de 1 columna en celular y 2 en PC */}
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '20px' }}>
                  <AgregarProducto />
                  <RegistrarMovimiento />
                </div>
              </div>
            } />
            
            {/* ... Resto de tus rutas protegidas ... */}
            {(rol === 1 || rol === 2) ? (
              <>
                <Route path="/inventario" element={<ListaProductos />} />
                <Route path="/movimientos" element={<HistorialMovimientos />} />
              </>
            ) : <Route path="/inventario" element={<Navigate to="/" />} />}

            {rol === 1 ? (
              <>
                <Route path="/proveedores" element={<GestionProveedores />} />
                <Route path="/historial-correos" element={<HistorialComunicaciones />} />
                <Route path="/usuarios" element={<GestionUsuarios />} />
              </>
            ) : <Route path="/proveedores" element={<Navigate to="/" />} />}

            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;