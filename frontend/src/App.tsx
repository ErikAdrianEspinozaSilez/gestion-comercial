import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
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
import GestionUsuarios from './GestionUsuarios';
import GlobalStockToasts from './GlobalStockToasts';

function App() {
  const { user, logout } = useAuth();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);

      if (window.innerWidth >= 768) {
        setMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!user) return <Login />;

  const rol = Number(user.rol_id);

  const navLinkStyle = ({ isActive }: { isActive: boolean }) => ({
    color: isActive ? '#38bdf8' : '#94a3b8',
    textDecoration: 'none',
    padding: '12px 18px',
    borderRadius: '12px',
    backgroundColor: isActive ? '#1e293b' : 'transparent',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    fontWeight: isActive ? '600' : '400',
    transition: 'all 0.2s ease',
    borderLeft: isActive
      ? '4px solid #38bdf8'
      : '4px solid transparent',
  });

  return (
    <Router>
      <Toaster
        position="top-center"
        reverseOrder={false}
        toastOptions={{
          duration: 4000,
        }}
      />

      {/* NOTIFICACIONES GLOBALES DE STOCK */}
      <GlobalStockToasts />

      <div
        style={{
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          minHeight: '100vh',
          backgroundColor: '#f1f5f9',
        }}
      >
        {/* CABECERA MÓVIL */}
        {isMobile && (
          <div
            style={{
              padding: '15px 20px',
              backgroundColor: '#0f172a',
              color: 'white',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              zIndex: 100,
            }}
          >
            <h2
              style={{
                margin: 0,
                color: '#38bdf8',
                fontSize: '18px',
                letterSpacing: '1px',
              }}
            >
              🛒 SUPER VALLE
            </h2>

            <button
              onClick={() => setMenuOpen(!menuOpen)}
              style={{
                background: 'none',
                border: 'none',
                color: 'white',
                fontSize: '24px',
                cursor: 'pointer',
              }}
            >
              {menuOpen ? '✕' : '☰'}
            </button>
          </div>
        )}

        {/* SIDEBAR */}
        <nav
          style={{
            width: isMobile ? '100%' : '280px',
            backgroundColor: '#0f172a',
            color: 'white',
            height: isMobile ? (menuOpen ? 'auto' : '0') : '100vh',
            position: isMobile ? 'absolute' : 'sticky',
            top: isMobile ? '56px' : 0,
            display: isMobile && !menuOpen ? 'none' : 'flex',
            flexDirection: 'column',
            zIndex: 90,
            paddingTop: '20px',
            boxShadow: isMobile
              ? 'none'
              : '4px 0 10px rgba(0,0,0,0.1)',
          }}
        >
          {!isMobile && (
            <div
              style={{
                padding: '0 25px 30px',
                borderBottom: '1px solid #1e293b',
              }}
            >
              <h2
                style={{
                  color: '#38bdf8',
                  fontSize: '22px',
                  margin: 0,
                }}
              >
                SUPER VALLE
              </h2>

              <p
                style={{
                  fontSize: '12px',
                  color: '#64748b',
                  marginTop: '8px',
                }}
              >
                Admin Panel v1.0
              </p>
            </div>
          )}

          <div
            style={{
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              flex: 1,
            }}
          >
            <NavLink
              to="/"
              onClick={() => setMenuOpen(false)}
              style={navLinkStyle}
            >
              📊 Panel Control
            </NavLink>

            <NavLink
              to="/ventas"
              onClick={() => setMenuOpen(false)}
              style={navLinkStyle}
            >
              💳 Punto Venta
            </NavLink>

            <NavLink
              to="/inventario"
              onClick={() => setMenuOpen(false)}
              style={navLinkStyle}
            >
              📦 Inventario
            </NavLink>

            {(rol === 1 || rol === 2) && (
              <NavLink
                to="/movimientos"
                onClick={() => setMenuOpen(false)}
                style={navLinkStyle}
              >
                📜 Movimientos
              </NavLink>
            )}

            {rol === 1 && (
              <>
                <NavLink
                  to="/proveedores"
                  onClick={() => setMenuOpen(false)}
                  style={navLinkStyle}
                >
                  🏢 Proveedores
                </NavLink>

                <NavLink
                  to="/historial-correos"
                  onClick={() => setMenuOpen(false)}
                  style={navLinkStyle}
                >
                  📧 Correos
                </NavLink>

                <NavLink
                  to="/usuarios"
                  onClick={() => setMenuOpen(false)}
                  style={navLinkStyle}
                >
                  👥 Usuarios
                </NavLink>
              </>
            )}
          </div>

          <div style={{ padding: '20px' }}>
            <button
              onClick={logout}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: '#1e293b',
                color: '#f87171',
                border: '1px solid #7f1d1d',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 'bold',
              }}
            >
              Cerrar Sesión
            </button>
          </div>
        </nav>

        {/* CONTENIDO */}
        <main
          style={{
            flex: 1,
            padding: isMobile ? '20px' : '40px',
            overflowY: 'auto',
          }}
        >
          <Routes>
            <Route
              path="/"
              element={
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '20px',
                  }}
                >
                  <DashboardVentas />

                  {/* ALERTAS VISIBLES DEL PANEL */}
                  <AlertasInventario />

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns:
                        isMobile ? '1fr' : '1fr 1fr',
                      gap: '20px',
                    }}
                  >
                    <AgregarProducto />
                    <RegistrarMovimiento />
                  </div>
                </div>
              }
            />

            <Route path="/ventas" element={<LectorVentas />} />
            <Route path="/inventario" element={<ListaProductos />} />
            <Route path="/movimientos" element={<HistorialMovimientos />} />
            <Route path="/proveedores" element={<GestionProveedores />} />
            <Route
              path="/historial-correos"
              element={<HistorialComunicaciones />}
            />
            <Route path="/usuarios" element={<GestionUsuarios />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;