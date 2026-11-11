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

const iconWrapStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
};

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
    gap: '12px',
    fontSize: isMobile ? '15px' : '14px',
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '9px',
                  backgroundColor: 'rgba(56, 189, 248, 0.12)',
                  border: '1px solid rgba(56, 189, 248, 0.28)',
                  color: '#38bdf8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <path d="M16 10a4 4 0 0 1-8 0" />
                </svg>
              </div>
              <div>
                <div
                  style={{
                    color: '#38bdf8',
                    fontSize: '16px',
                    fontWeight: 800,
                    letterSpacing: '0.6px',
                  }}
                >
                  SUPER VALLE
                </div>
                <div style={{ color: '#64748b', fontSize: '10px' }}>
                  Admin Panel v1.0
                </div>
              </div>
            </div>

            <button
              type="button"
              aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((open) => !open)}
              style={{
                width: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#1e293b',
                border: '1px solid #334155',
                borderRadius: '10px',
                color: '#e2e8f0',
                cursor: 'pointer',
              }}
            >
              {menuOpen ? (
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              ) : (
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </svg>
              )}
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
            alignSelf: 'flex-start',
            left: 0,
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
              minHeight: isMobile ? '76px' : '96px',
              padding: isMobile ? '16px 18px' : '22px 20px 18px',
              borderBottom: '1px solid #1e293b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              flexShrink: 0,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(56, 189, 248, 0.12)',
                  border: '1px solid rgba(56, 189, 248, 0.28)',
                  color: '#38bdf8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <path d="M16 10a4 4 0 0 1-8 0" />
                </svg>
              </div>
              <div>
                <h2
                  style={{
                    color: '#38bdf8',
                    fontSize: isMobile ? '18px' : '19px',
                    fontWeight: 800,
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
                    margin: '4px 0 0 0',
                  }}
                >
                  Admin Panel v1.0
                </p>
              </div>
            </div>

            {isMobile && (
              <button
                type="button"
                aria-label="Cerrar menú"
                onClick={closeMenu}
                style={{
                  width: '36px',
                  height: '36px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid #334155',
                  borderRadius: '9px',
                  backgroundColor: '#1e293b',
                  color: '#cbd5e1',
                  cursor: 'pointer',
                }}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
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
              <span aria-hidden="true" style={iconWrapStyle}>
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="3" y="3" width="7" height="7" rx="1" />
                  <rect x="14" y="3" width="7" height="7" rx="1" />
                  <rect x="14" y="14" width="7" height="7" rx="1" />
                  <rect x="3" y="14" width="7" height="7" rx="1" />
                </svg>
              </span>
              <span>Panel Control</span>
            </NavLink>

            <NavLink to="/ventas" onClick={closeMenu} style={navLinkStyle}>
              <span aria-hidden="true" style={iconWrapStyle}>
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="2" y="5" width="20" height="14" rx="2" />
                  <line x1="2" y1="10" x2="22" y2="10" />
                </svg>
              </span>
              <span>Punto Venta</span>
            </NavLink>

            <NavLink
              to="/inventario"
              onClick={closeMenu}
              style={navLinkStyle}
            >
              <span aria-hidden="true" style={iconWrapStyle}>
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                  <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                  <line x1="12" y1="22.08" x2="12" y2="12" />
                </svg>
              </span>
              <span>Inventario</span>
            </NavLink>

            {(rol === 1 || rol === 2) && (
              <NavLink
                to="/movimientos"
                onClick={closeMenu}
                style={navLinkStyle}
              >
                <span aria-hidden="true" style={iconWrapStyle}>
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                    <line x1="10" y1="9" x2="8" y2="9" />
                  </svg>
                </span>
                <span>Movimientos</span>
              </NavLink>
            )}

            {(rol === 1 || rol === 2) && (
              <NavLink
                to="/analisis-predictivo"
                onClick={closeMenu}
                style={navLinkStyle}
              >
                <span aria-hidden="true" style={iconWrapStyle}>
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                    <polyline points="17 6 23 6 23 12" />
                  </svg>
                </span>
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
                  <span aria-hidden="true" style={iconWrapStyle}>
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
                      <path d="M9 22v-4h6v4" />
                      <line x1="8" y1="6" x2="8.01" y2="6" />
                      <line x1="16" y1="6" x2="16.01" y2="6" />
                      <line x1="12" y1="6" x2="12.01" y2="6" />
                      <line x1="12" y1="10" x2="12.01" y2="10" />
                      <line x1="12" y1="14" x2="12.01" y2="14" />
                      <line x1="16" y1="10" x2="16.01" y2="10" />
                      <line x1="16" y1="14" x2="16.01" y2="14" />
                      <line x1="8" y1="10" x2="8.01" y2="10" />
                      <line x1="8" y1="14" x2="8.01" y2="14" />
                    </svg>
                  </span>
                  <span>Proveedores</span>
                </NavLink>

                <NavLink
                  to="/historial-correos"
                  onClick={closeMenu}
                  style={navLinkStyle}
                >
                  <span aria-hidden="true" style={iconWrapStyle}>
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                      <polyline points="22,6 12,13 2,6" />
                    </svg>
                  </span>
                  <span>Correos</span>
                </NavLink>

                <NavLink
                  to="/usuarios"
                  onClick={closeMenu}
                  style={navLinkStyle}
                >
                  <span aria-hidden="true" style={iconWrapStyle}>
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                  </span>
                  <span>Usuarios</span>
                </NavLink>
              </>
            )}
          </div>

          <div
            style={{
              padding: '14px',
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
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              <svg
                width="17"
                height="17"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              <span>Cerrar Sesión</span>
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