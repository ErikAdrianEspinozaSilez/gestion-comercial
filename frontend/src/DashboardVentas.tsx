import React, { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { useAuth } from './AuthContext';

const API_URL = 'https://gestion-comercial-j3ed.onrender.com';

const COLORS = {
  azul: '#2563eb',
  verde: '#10b981',
  ambar: '#f59e0b',
  morado: '#8b5cf6',
  grisOscuro: '#1e293b',
  grisClaro: '#64748b',
};

type ProductoTop = {
  posicion: number;
  producto_id: string;
  nombre_producto: string;
  imagen_url?: string;
  precio?: string;
  cantidad_vendida: number;
};

type RespuestaTop = {
  periodo: {
    inicio: string;
    fin: string;
  };
  cantidad_productos: number;
  productos: ProductoTop[];
};

function formatearFecha(valor?: string) {
  if (!valor) return '';

  return new Date(`${valor}T00:00:00`).toLocaleDateString('es-BO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

const DashboardVentas: React.FC = () => {
  const { user } = useAuth();
  const rol = Number(user?.rol_id || 0);
  const puedeVerAnalisis = rol === 1 || rol === 2;
  const [indiceProducto, setIndiceProducto] = useState(0);

  const { data: sales, isLoading: loadingSales } = useQuery({
    queryKey: ['dashboard-ventas'],
    queryFn: async () => {
      const res = await axios.get(`${API_URL}/productos/dashboard-ventas`);
      return res.data;
    },
    refetchInterval: 5000,
  });

  const { data: stats, isLoading: loadingStats } = useQuery({
    queryKey: ['stats-dashboard-unificado'],
    queryFn: async () => {
      const res = await axios.get(`${API_URL}/productos/stats`);
      return res.data;
    },
    refetchInterval: 5000,
  });

  const { data: topData, isLoading: loadingTop } = useQuery<RespuestaTop>({
    queryKey: ['top-productos-ultimos-30-dias'],
    queryFn: async () => {
      const res = await axios.get(`${API_URL}/analisis-predictivo/top-productos`);
      return res.data;
    },
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

  const productosTop = useMemo(() => topData?.productos || [], [topData]);

  useEffect(() => {
    setIndiceProducto(0);
  }, [productosTop.length]);

  useEffect(() => {
    if (productosTop.length <= 1) return undefined;

    const intervalo = window.setInterval(() => {
      setIndiceProducto((indiceActual) => (indiceActual + 1) % productosTop.length);
    }, 5000);

    return () => window.clearInterval(intervalo);
  }, [productosTop.length]);

  const productoActual = productosTop[indiceProducto] || null;

  if (loadingSales || loadingStats) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: COLORS.grisClaro }}>
        Cargando métricas...
      </div>
    );
  }

  const StatCard = ({ title, value, color }: { title: string; value: string; color: string }) => (
    <div
      style={{
        padding: '20px',
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        borderLeft: `5px solid ${color}`,
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        minHeight: '100px',
      }}
    >
      <span
        style={{
          fontSize: '0.85rem',
          color: COLORS.grisClaro,
          fontWeight: '600',
          textTransform: 'uppercase',
        }}
      >
        {title}
      </span>
      <span
        style={{
          fontSize: '1.8rem',
          fontWeight: '800',
          color: COLORS.grisOscuro,
          marginTop: '8px',
        }}
      >
        {value}
      </span>
    </div>
  );

  return (
    <div style={{ padding: '10px 0' }}>
      <h3
        style={{
          marginBottom: '20px',
          color: COLORS.grisOscuro,
          fontWeight: '800',
          fontSize: '1.5rem',
        }}
      >
        Resumen Ejecutivo
      </h3>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '20px',
        }}
      >
        <StatCard title="Ventas Hoy" value={`Bs. ${sales?.ventas_hoy || '0.00'}`} color={COLORS.verde} />
        <StatCard title="Esta Semana" value={`Bs. ${sales?.ventas_semana || '0.00'}`} color={COLORS.azul} />
        <StatCard title="Este Mes" value={`Bs. ${sales?.ventas_mes || '0.00'}`} color={COLORS.morado} />
        <StatCard title="Productos Activos" value={`${stats?.total_items || '0'} ítems`} color={COLORS.grisOscuro} />
        <StatCard
          title="Stock Bajo"
          value={`${stats?.bajo_stock || '0'} alertas`}
          color={Number(stats?.bajo_stock) > 0 ? '#ef4444' : COLORS.grisClaro}
        />

        <div
          style={{
            padding: '18px',
            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            color: '#ffffff',
            borderRadius: '16px',
            boxShadow: '0 4px 12px rgba(217, 119, 6, 0.28)',
            minHeight: '150px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            overflow: 'hidden',
          }}
        >
          {loadingTop ? (
            <div style={{ alignSelf: 'center', margin: 'auto', fontWeight: 700 }}>
              Cargando productos destacados...
            </div>
          ) : productoActual ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: 0 }}>
                <img
                  src={
                    productoActual.imagen_url?.trim() ||
                    `https://placehold.co/72x72/f59e0b/ffffff?text=${productoActual.posicion}`
                  }
                  alt={productoActual.nombre_producto}
                  onError={(evento) => {
                    evento.currentTarget.src = `https://placehold.co/72x72/f59e0b/ffffff?text=${productoActual.posicion}`;
                  }}
                  style={{
                    width: '62px',
                    height: '62px',
                    flexShrink: 0,
                    borderRadius: '13px',
                    objectFit: 'cover',
                    border: '2px solid rgba(255,255,255,0.45)',
                    backgroundColor: 'rgba(255,255,255,0.15)',
                  }}
                />

                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: '0.75rem', opacity: 0.9, fontWeight: 700 }}>
                    MÁS VENDIDOS · ÚLTIMOS 30 DÍAS
                  </div>
                  <div
                    style={{
                      fontWeight: 800,
                      fontSize: '1.12rem',
                      marginTop: '4px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                    title={productoActual.nombre_producto}
                  >
                    #{productoActual.posicion} {productoActual.nombre_producto}
                  </div>
                  <div style={{ marginTop: '5px', fontSize: '0.9rem', fontWeight: 700 }}>
                    {productoActual.cantidad_vendida} unidades vendidas
                  </div>
                </div>
              </div>

              <div
                style={{
                  marginTop: '14px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '12px',
                  flexWrap: 'wrap',
                }}
              >
                <div>
                  <div style={{ fontSize: '0.7rem', opacity: 0.82 }}>
                    {formatearFecha(topData?.periodo.inicio)} al {formatearFecha(topData?.periodo.fin)}
                  </div>
                  <div style={{ display: 'flex', gap: '5px', marginTop: '7px' }}>
                    {productosTop.map((producto, indice) => (
                      <button
                        key={producto.producto_id}
                        type="button"
                        aria-label={`Mostrar ${producto.nombre_producto}`}
                        onClick={() => setIndiceProducto(indice)}
                        style={{
                          width: indice === indiceProducto ? '18px' : '7px',
                          height: '7px',
                          border: 'none',
                          padding: 0,
                          borderRadius: '999px',
                          backgroundColor:
                            indice === indiceProducto ? '#ffffff' : 'rgba(255,255,255,0.48)',
                          cursor: 'pointer',
                          transition: 'width 0.2s ease',
                        }}
                      />
                    ))}
                  </div>
                </div>

                {puedeVerAnalisis && (
                  <Link
                    to={`/analisis-predictivo?producto=${productoActual.producto_id}`}
                    style={{
                      textDecoration: 'none',
                      backgroundColor: '#ffffff',
                      color: '#92400e',
                      padding: '9px 13px',
                      borderRadius: '9px',
                      fontSize: '0.82rem',
                      fontWeight: 800,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    Ver análisis →
                  </Link>
                )}
              </div>
            </>
          ) : (
            <div style={{ alignSelf: 'center', margin: 'auto', textAlign: 'center' }}>
              <strong>No existen ventas recientes</strong>
              <div style={{ marginTop: '6px', fontSize: '0.82rem', opacity: 0.86 }}>
                La tarjeta se actualizará cuando se registren ventas.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardVentas;
