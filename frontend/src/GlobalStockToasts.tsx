import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

const API_URL = 'https://gestion-comercial-j3ed.onrender.com';

type ProductoAlerta = {
  producto_id: number;
  nombre_producto: string;
  codigo_barra?: string;
  stock_bodega: number;
  stock_estante: number;
  stock_total: number;
  alertas?: string[];
};

type AlertaGlobal = {
  id: string;
  tipo: 'REPOSICION' | 'PROVEEDOR';
  titulo: string;
  mensaje: string;
  color: string;
  fondo: string;
  icono: string;
  producto: ProductoAlerta;
};

const GlobalStockToasts = () => {
  const [cerradas, setCerradas] = useState<Set<string>>(new Set());
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [showExtraAlerts, setShowExtraAlerts] = useState(false);

  const [isMobile, setIsMobile] = useState(() => {
    return typeof window !== 'undefined' ? window.innerWidth <= 768 : false;
  });

  useEffect(() => {
    const revisarPantalla = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    revisarPantalla();
    window.addEventListener('resize', revisarPantalla);

    return () => {
      window.removeEventListener('resize', revisarPantalla);
    };
  }, []);

  const { data: stockBajo } = useQuery({
    queryKey: ['stock-bajo-global-floating'],
    queryFn: async () => {
      const res = await axios.get(
        `${API_URL}/productos/stock-bajo?t=${Date.now()}`
      );
      return res.data;
    },
    refetchInterval: 3000,
    refetchOnWindowFocus: true,
    staleTime: 0,
  });

  const alertas: AlertaGlobal[] = useMemo(() => {
    if (!stockBajo || stockBajo.length === 0) return [];

    const resultado: AlertaGlobal[] = [];

    stockBajo.forEach((producto: ProductoAlerta) => {
      if (producto.alertas?.includes('REPOSICION')) {
        resultado.push({
          id: `reposicion-${producto.producto_id}-${producto.stock_estante}`,
          tipo: 'REPOSICION',
          titulo: 'Stock bajo en estante',
          mensaje: `Solo queda ${producto.stock_estante} unidad(es) de ${producto.nombre_producto} en estante.`,
          color: '#f97316',
          fondo: '#fff7ed',
          icono: '⚠️',
          producto,
        });
      }

      if (producto.alertas?.includes('PROVEEDOR')) {
        resultado.push({
          id: `proveedor-${producto.producto_id}-${producto.stock_bodega}`,
          tipo: 'PROVEEDOR',
          titulo: 'Stock bajo en bodega',
          mensaje: `Solo quedan ${producto.stock_bodega} unidad(es) de ${producto.nombre_producto} en bodega.`,
          color: '#dc2626',
          fondo: '#fef2f2',
          icono: '🚨',
          producto,
        });
      }
    });

    return resultado.filter((alerta) => !cerradas.has(alerta.id));
  }, [stockBajo, cerradas]);

  const maxVisibles = 3;
  const visibles = alertas.slice(0, maxVisibles);
  const ocultas = alertas.slice(maxVisibles);
  const restantes = ocultas.length;

  const cerrarAlerta = (id: string) => {
    setCerradas((prev) => {
      const nuevo = new Set(prev);
      nuevo.add(id);
      return nuevo;
    });
  };

  if (alertas.length === 0) return null;

  return isMobile ? (
    <div style={{ pointerEvents: 'auto' }}>
      {/* 🔔 CAMPANA MÓVIL */}
      <div
        onClick={() => setShowExtraAlerts(!showExtraAlerts)}
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          width: '55px',
          height: '55px',
          borderRadius: '50%',
          background: '#0ea5e9',
          color: 'white',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          fontSize: '22px',
          fontWeight: '900',
          boxShadow: '0 10px 25px rgba(0,0,0,0.25)',
          zIndex: 9999,
          cursor: 'pointer',
        }}
      >
        🔔 {alertas.length}
      </div>

      {/* 📱 MODAL MOBILE */}
      {showExtraAlerts && (
        <div
          onClick={() => setShowExtraAlerts(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 10000,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-end',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxHeight: '70vh',
              background: '#fff',
              borderTopLeftRadius: '20px',
              borderTopRightRadius: '20px',
              overflowY: 'auto',
              padding: '15px',
            }}
          >
            <div style={{ fontWeight: '900', marginBottom: '10px' }}>
              🔴 Stock bajo
            </div>

            {alertas.map((alerta) => (
              <div
                key={alerta.id}
                style={{
                  padding: '12px',
                  borderBottom: '1px solid #e2e8f0',
                }}
              >
                <div style={{ fontWeight: '800', color: alerta.color }}>
                  {alerta.icono} {alerta.titulo}
                </div>

                <div style={{ fontSize: '13px' }}>
                  {alerta.producto.nombre_producto}
                </div>

                <div style={{ fontSize: '12px', color: '#64748b' }}>
                  {alerta.mensaje}
                </div>

                <button
                  type="button"
                  onClick={() => cerrarAlerta(alerta.id)}
                  style={{
                    marginTop: '8px',
                    background: '#ef4444',
                    color: 'white',
                    border: 'none',
                    padding: '6px 10px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                  }}
                >
                  Cerrar
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  ) : (
    <div
      style={{
        position: 'fixed',
        top: '10px',
        right: '14px',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'flex-end',
        gap: '8px',
        pointerEvents: 'none',
        maxWidth: 'calc(100vw - 330px)',
      }}
    >
      {visibles.map((alerta) => {
        const isHovered = hoveredId === alerta.id;

        return (
          <div
            key={alerta.id}
            onMouseEnter={() => setHoveredId(alerta.id)}
            onMouseLeave={() => setHoveredId(null)}
            style={{
              pointerEvents: 'auto',
              width: isHovered ? '330px' : '215px',
              height: isHovered ? 'auto' : '50px',
              maxHeight: isHovered ? 'calc(100vh - 60px)' : '50px',
              backgroundColor: alerta.fondo,
              border: `1px solid ${alerta.color}`,
              borderLeft: `6px solid ${alerta.color}`,
              borderRadius: '16px',
              boxShadow: isHovered
                ? '0 18px 35px rgba(15, 23, 42, 0.28)'
                : '0 8px 22px rgba(15, 23, 42, 0.18)',
              padding: '10px 12px',
              overflowX: 'hidden',
              overflowY: isHovered ? 'auto' : 'hidden',
              transition: 'all 0.25s ease',
              cursor: 'default',
              transform: isHovered ? 'translateY(4px)' : 'translateY(0)',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <strong
                style={{
                  color: alerta.color,
                  fontSize: '13px',
                  whiteSpace: isHovered ? 'normal' : 'nowrap',
                  overflow: isHovered ? 'visible' : 'hidden',
                  textOverflow: isHovered ? 'clip' : 'ellipsis',
                }}
              >
                {alerta.icono} {alerta.titulo}
              </strong>

              <button
                type="button"
                onClick={() => cerrarAlerta(alerta.id)}
                style={{
                  width: '23px',
                  height: '23px',
                  borderRadius: '50%',
                  border: 'none',
                  backgroundColor: '#ffffff',
                  color: '#475569',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '15px',
                  lineHeight: 1,
                  flexShrink: 0,
                  boxShadow: '0 2px 6px rgba(0,0,0,0.16)',
                }}
                title="Cerrar alerta"
              >
                ×
              </button>
            </div>

            <div
              style={{
                marginTop: '7px',
                color: '#0f172a',
                fontSize: '13px',
                fontWeight: '700',
                whiteSpace: isHovered ? 'normal' : 'nowrap',
                overflow: isHovered ? 'visible' : 'hidden',
                textOverflow: isHovered ? 'clip' : 'ellipsis',
              }}
            >
              {alerta.producto.nombre_producto}
            </div>

            {isHovered && (
              <>
                <div
                  style={{
                    marginTop: '8px',
                    fontSize: '13px',
                    color: '#334155',
                    lineHeight: 1.4,
                  }}
                >
                  {alerta.mensaje}
                </div>

                <div
                  style={{
                    marginTop: '10px',
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr 1fr',
                    gap: '7px',
                  }}
                >
                  <div
                    style={{
                      backgroundColor: '#ffffff',
                      borderRadius: '10px',
                      padding: '7px',
                      textAlign: 'center',
                      fontSize: '11px',
                      color: '#64748b',
                    }}
                  >
                    <strong
                      style={{
                        display: 'block',
                        fontSize: '16px',
                        color: '#2563eb',
                      }}
                    >
                      {alerta.producto.stock_estante}
                    </strong>
                    Estante
                  </div>

                  <div
                    style={{
                      backgroundColor: '#ffffff',
                      borderRadius: '10px',
                      padding: '7px',
                      textAlign: 'center',
                      fontSize: '11px',
                      color: '#64748b',
                    }}
                  >
                    <strong
                      style={{
                        display: 'block',
                        fontSize: '16px',
                        color: '#92400e',
                      }}
                    >
                      {alerta.producto.stock_bodega}
                    </strong>
                    Bodega
                  </div>

                  <div
                    style={{
                      backgroundColor: '#ffffff',
                      borderRadius: '10px',
                      padding: '7px',
                      textAlign: 'center',
                      fontSize: '11px',
                      color: '#64748b',
                    }}
                  >
                    <strong
                      style={{
                        display: 'block',
                        fontSize: '16px',
                        color: '#059669',
                      }}
                    >
                      {alerta.producto.stock_total}
                    </strong>
                    Total
                  </div>
                </div>
              </>
            )}
          </div>
        );
      })}

      {restantes > 0 && (
        <div
          style={{
            position: 'relative',
            pointerEvents: 'auto',
          }}
        >
          <button
            type="button"
            onClick={() => setShowExtraAlerts(!showExtraAlerts)}
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '14px',
              backgroundColor: '#0ea5e9',
              color: '#ffffff',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              fontWeight: '900',
              fontSize: '18px',
              boxShadow: '0 8px 22px rgba(15, 23, 42, 0.22)',
              border: '2px solid #ffffff',
              cursor: 'pointer',
            }}
            title={`${restantes} notificación(es) adicional(es)`}
          >
            +{restantes}
          </button>

          {showExtraAlerts && (
            <div
              style={{
                position: 'absolute',
                top: '58px',
                right: 0,
                width: '340px',
                maxHeight: '380px',
                overflowY: 'auto',
                backgroundColor: '#ffffff',
                borderRadius: '16px',
                boxShadow: '0 18px 40px rgba(15, 23, 42, 0.30)',
                border: '1px solid #e2e8f0',
                padding: '12px',
              }}
            >
              <div
                style={{
                  fontSize: '14px',
                  fontWeight: '900',
                  color: '#0f172a',
                  marginBottom: '10px',
                }}
              >
                Notificaciones adicionales
              </div>

              {ocultas.map((alerta) => (
                <div
                  key={alerta.id}
                  style={{
                    backgroundColor: alerta.fondo,
                    borderLeft: `5px solid ${alerta.color}`,
                    borderRadius: '12px',
                    padding: '10px',
                    marginBottom: '8px',
                    boxShadow: '0 4px 12px rgba(15, 23, 42, 0.10)',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      gap: '8px',
                      alignItems: 'center',
                    }}
                  >
                    <strong
                      style={{
                        color: alerta.color,
                        fontSize: '13px',
                      }}
                    >
                      {alerta.icono} {alerta.titulo}
                    </strong>

                    <button
                      type="button"
                      onClick={() => cerrarAlerta(alerta.id)}
                      style={{
                        width: '22px',
                        height: '22px',
                        borderRadius: '50%',
                        border: 'none',
                        backgroundColor: '#ffffff',
                        color: '#475569',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.12)',
                      }}
                      title="Cerrar alerta"
                    >
                      ×
                    </button>
                  </div>

                  <div
                    style={{
                      marginTop: '6px',
                      fontSize: '13px',
                      fontWeight: '800',
                      color: '#0f172a',
                    }}
                  >
                    {alerta.producto.nombre_producto}
                  </div>

                  <div
                    style={{
                      marginTop: '5px',
                      fontSize: '12px',
                      color: '#475569',
                      lineHeight: 1.4,
                    }}
                  >
                    {alerta.mensaje}
                  </div>

                  <div
                    style={{
                      marginTop: '8px',
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr 1fr',
                      gap: '6px',
                      fontSize: '11px',
                      textAlign: 'center',
                    }}
                  >
                    <div
                      style={{
                        backgroundColor: '#ffffff',
                        borderRadius: '8px',
                        padding: '6px',
                      }}
                    >
                      <strong
                        style={{
                          display: 'block',
                          color: '#2563eb',
                          fontSize: '15px',
                        }}
                      >
                        {alerta.producto.stock_estante}
                      </strong>
                      Estante
                    </div>

                    <div
                      style={{
                        backgroundColor: '#ffffff',
                        borderRadius: '8px',
                        padding: '6px',
                      }}
                    >
                      <strong
                        style={{
                          display: 'block',
                          color: '#92400e',
                          fontSize: '15px',
                        }}
                      >
                        {alerta.producto.stock_bodega}
                      </strong>
                      Bodega
                    </div>

                    <div
                      style={{
                        backgroundColor: '#ffffff',
                        borderRadius: '8px',
                        padding: '6px',
                      }}
                    >
                      <strong
                        style={{
                          display: 'block',
                          color: '#059669',
                          fontSize: '15px',
                        }}
                      >
                        {alerta.producto.stock_total}
                      </strong>
                      Total
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GlobalStockToasts;