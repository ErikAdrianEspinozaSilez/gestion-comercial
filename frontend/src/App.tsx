import React, { useEffect, useState } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  NavLink,
  Navigate,
} from 'react-router-dom';
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
import AnalisisPredictivo from './AnalisisPredictivo';

const MOBILE_BREAKPOINT = 768;

function App() {
  const { user, logout } = useAuth();
  const [isMobile, setIsMobile] = useState(
    () => window.innerWidth < MOBILE_BREAKPOINT,
  );
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < MOBILE_BREAKPOINT;
      setIsMobile(mobile);

      if (!mobile) {
        setMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Evita que el contenido del fondo se desplace cuando el menú móvil está abierto.
  useEffect(() => {
    if (!isMobile || !menuOpen) {
      document.body.style.overflow = '';
      return;
    }

    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobile, menuOpen]);

  if (!user) {
    return (
      <>
        <Toaster
          position="top-center"
          reverseOrder={false}
          toastOptions={{ duration: 4000 }}
        />
        <Login />
      </>
    );
  }

  const rol = Number(user.rol_id);
  const closeMenu = () => setMenuOpen(false);

  const navLinkStyle = ({ isActive }: { isActive: boolean }) => ({
    color: isActive ? '#38bdf8' : '#a8b4c7',
    textDecoration: 'none',
    padding: isMobile ? '11px 14px' : '11px 16px',
    borderRadius: '11px',
    backgroundColor: isActive ? '#1e293b' : 'transparent',
    display: 'flex',
    alignItems: 'center',
    gap: '11px',
    fontSize: isMobile ? '16px' : '15px',
    lineHeight: 1.25,
    fontWeight: isActive ? 700 : 500,
    transition: 'background-color 0.2s ease, color 0.2s ease',
    borderLeft: isActive ? '4px solid #38bdf8' : '4px solid transparent',
  });

  return (
    <Router>
      <Toaster
        position="top-center"
        reverseOrder={false}
        toastOptions={{ duration: 4000 }}
      />

      <GlobalStockToasts />

      <div
        style={{
          display: 'flex',
          width: '100%',
          minWidth: 0,
          minHeight: '100vh',
          backgroundColor: '#f1f5f9',
        }}
      >
        {/* CABECERA MÓVIL: permanece visible y permite abrir/cerrar el menú. */}
        {isMobile && (
          <header
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              height: '60px',
              padding: '0 16px',
              backgroundColor: '#0f172a',
              color: 'white',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              zIndex: 120,
              boxShadow: '0 3px 12px rgba(15, 23, 42, 0.22)',
            }}
          >
            <div>
              <div
                style={{
                  color: '#38bdf8',
                  fontSize: '17px',
                  fontWeight: 800,
                  letterSpacing: '0.7px',
                }}
              >
                SUPER VALLE
              </div>
              <div style={{ color: '#64748b', fontSize: '10px' }}>
                Admin Panel v1.0
              </div>
            </div>

            <button
              type="button"
              aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((open) => !open)}
              style={{
                width: '42px',
                height: '42px',
                display: 'grid',
                placeItems: 'center',
                backgroundColor: '#1e293b',
                border: '1px solid #334155',
                borderRadius: '10px',
                color: '#e2e8f0',
                fontSize: '23px',
                cursor: 'pointer',
              }}
            >
              {menuOpen ? '✕' : '☰'}
            </button>
          </header>
        )}

        {/* Fondo oscuro detrás del menú móvil. */}
        {isMobile && menuOpen && (
          <button
            type="button"
            aria-label="Cerrar menú"
            onClick={closeMenu}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 100,
              border: 0,
              padding: 0,
              backgroundColor: 'rgba(15, 23, 42, 0.52)',
              backdropFilter: 'blur(2px)',
              cursor: 'pointer',
            }}
          />
        )}

        {/* SIDEBAR */}
        <nav
          aria-label="Navegación principal"
          style={{
            width: isMobile ? 'min(86vw, 310px)' : '260px',
            flexShrink: 0,
            backgroundColor: '#0f172a',
            color: 'white',
height: '100dvh',
position: isMobile ? 'fixed' : 'sticky',
top: 0,
alignSelf: 'flex-start',            left: 0,
            zIndex: 110,
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '4px 0 14px rgba(15, 23, 42, 0.2)',
            transform:
              isMobile && !menuOpen ? 'translateX(-105%)' : 'translateX(0)',
            visibility: isMobile && !menuOpen ? 'hidden' : 'visible',
            transition: 'transform 0.25s ease, visibility 0.25s ease',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              minHeight: isMobile ? '76px' : '108px',
              padding: isMobile ? '16px 18px' : '22px 22px 20px',
              borderBottom: '1px solid #1e293b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              flexShrink: 0,
            }}
          >
            <div>
              <h2
                style={{
                  color: '#38bdf8',
                  fontSize: isMobile ? '19px' : '21px',
                  lineHeight: 1.2,
                  margin: 0,
                  letterSpacing: '0.4px',
                }}
              >
                SUPER VALLE
              </h2>
              <p
                style={{
                  fontSize: '11px',
                  color: '#64748b',
                  marginTop: '6px',
                }}
              >
                Admin Panel v1.0
              </p>
            </div>

            {isMobile && (
              <button
                type="button"
                aria-label="Cerrar menú"
                onClick={closeMenu}
                style={{
                  width: '36px',
                  height: '36px',
                  display: 'grid',
                  placeItems: 'center',
                  border: '1px solid #334155',
                  borderRadius: '9px',
                  backgroundColor: '#1e293b',
                  color: '#cbd5e1',
                  cursor: 'pointer',
                  fontSize: '18px',
                }}
              >
                ✕
              </button>
            )}
          </div>

          <div
            style={{
              padding: isMobile ? '14px 14px 10px' : '16px 14px 10px',
              display: 'flex',
              flexDirection: 'column',
              gap: '5px',
              flex: 1,
              minHeight: 0,
              overflowY: 'auto',
              overscrollBehavior: 'contain',
            }}
          >
            <NavLink to="/" onClick={closeMenu} style={navLinkStyle}>
              <span aria-hidden="true">📊</span>
              <span>Panel Control</span>
            </NavLink>

            <NavLink to="/ventas" onClick={closeMenu} style={navLinkStyle}>
              <span aria-hidden="true">💳</span>
              <span>Punto Venta</span>
            </NavLink>

            <NavLink
              to="/inventario"
              onClick={closeMenu}
              style={navLinkStyle}
            >
              <span aria-hidden="true">📦</span>
              <span>Inventario</span>
            </NavLink>

            {(rol === 1 || rol === 2) && (
              <NavLink
                to="/movimientos"
                onClick={closeMenu}
                style={navLinkStyle}
              >
                <span aria-hidden="true">📜</span>
                <span>Movimientos</span>
              </NavLink>
            )}

            {(rol === 1 || rol === 2) && (
              <NavLink
                to="/analisis-predictivo"
                onClick={closeMenu}
                style={navLinkStyle}
              >
                <span aria-hidden="true">📈</span>
                <span>Análisis Predictivo</span>
              </NavLink>
            )}

            {rol === 1 && (
              <>
                <NavLink
                  to="/proveedores"
                  onClick={closeMenu}
                  style={navLinkStyle}
                >
                  <span aria-hidden="true">🏢</span>
                  <span>Proveedores</span>
                </NavLink>

                <NavLink
                  to="/historial-correos"
                  onClick={closeMenu}
                  style={navLinkStyle}
                >
                  <span aria-hidden="true">📧</span>
                  <span>Correos</span>
                </NavLink>

                <NavLink
                  to="/usuarios"
                  onClick={closeMenu}
                  style={navLinkStyle}
                >
                  <span aria-hidden="true">👥</span>
                  <span>Usuarios</span>
                </NavLink>
              </>
            )}
          </div>

          <div
            style={{
              padding: isMobile ? '14px' : '14px',
              borderTop: '1px solid #1e293b',
              backgroundColor: '#0f172a',
              flexShrink: 0,
            }}
          >
            <button
              type="button"
              onClick={logout}
              style={{
                width: '100%',
                padding: '11px 12px',
                backgroundColor: '#1e293b',
                color: '#f87171',
                border: '1px solid #7f1d1d',
                borderRadius: '9px',
                cursor: 'pointer',
                fontWeight: 700,
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
            width: '100%',
            minWidth: 0,
            maxWidth: 'none',
            padding: isMobile ? '78px 14px 28px' : '28px 32px 40px',
            overflowX: 'hidden',
            boxSizing: 'border-box',
          }}
        >
          <Routes>
            <Route
              path="/"
              element={
                <div
                  style={{
                    width: '100%',
                    minWidth: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '20px',
                  }}
                >
                  <DashboardVentas />
                  <AlertasInventario />

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: isMobile
                        ? '1fr'
                        : 'minmax(320px, 0.8fr) minmax(0, 1.7fr)',
                      alignItems: 'start',
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
            <Route
              path="/analisis-predictivo"
              element={
                rol === 1 || rol === 2 ? (
                  <AnalisisPredictivo />
                ) : (
                  <Navigate to="/" replace />
                )
              }
            />
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
