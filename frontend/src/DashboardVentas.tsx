import React from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

const DashboardVentas: React.FC = () => {
  // 1. Consulta a la ruta de ventas (Hoy, Semana, Mes, Producto Estrella)
  const { data: sales, isLoading: loadingSales } = useQuery({
    queryKey: ['dashboard-ventas'],
    queryFn: async () => {
      const res = await axios.get('http://localhost:3000/productos/dashboard-ventas');
      return res.data;
    },
    refetchInterval: 5000
  });

  // 2. Consulta a la ruta de estadísticas (Productos totales y stock bajo)
  const { data: stats, isLoading: loadingStats } = useQuery({
    queryKey: ['stats-dashboard-unificado'],
    queryFn: async () => {
      const res = await axios.get('http://localhost:3000/productos/stats');
      return res.data;
    },
    refetchInterval: 5000
  });

  if (loadingSales || loadingStats) return <p>Cargando estadísticas de Super Valle...</p>;

  return (
    <div style={{ padding: '20px', backgroundColor: '#ffffff', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.02)', marginBottom: '20px' }}>
      <h3 style={{ margin: '0 0 20px 0', color: '#1e293b', fontWeight: 'bold' }}>📊 Resumen Ejecutivo Comercial</h3>
      
      {/* Contenedor Grid responsivo para las 6 tarjetas */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '15px' }}>
        
        {/* Tarjeta 1: Ventas de Hoy */}
        <div style={{ padding: '15px', backgroundColor: '#10b981', color: 'white', borderRadius: '12px', boxShadow: '0 4px 10px rgba(16, 185, 129, 0.2)' }}>
          <h4 style={{ margin: '0 0 5px 0', fontSize: '0.9rem', fontWeight: '500', opacity: 0.9 }}>Ventas de Hoy</h4>
          <p style={{ margin: '0', fontSize: '1.6rem', fontWeight: 'bold' }}>Bs. {sales?.ventas_hoy || '0.00'}</p>
        </div>

        {/* Tarjeta 2: Ventas de la Semana */}
        <div style={{ padding: '15px', backgroundColor: '#3b82f6', color: 'white', borderRadius: '12px', boxShadow: '0 4px 10px rgba(59, 130, 246, 0.2)' }}>
          <h4 style={{ margin: '0 0 5px 0', fontSize: '0.9rem', fontWeight: '500', opacity: 0.9 }}>Esta Semana</h4>
          <p style={{ margin: '0', fontSize: '1.6rem', fontWeight: 'bold' }}>Bs. {sales?.ventas_semana || '0.00'}</p>
        </div>

        {/* Tarjeta 3: Ventas del Mes */}
        <div style={{ padding: '15px', backgroundColor: '#8b5cf6', color: 'white', borderRadius: '12px', boxShadow: '0 4px 10px rgba(139, 92, 246, 0.2)' }}>
          <h4 style={{ margin: '0 0 5px 0', fontSize: '0.9rem', fontWeight: '500', opacity: 0.9 }}>Este Mes</h4>
          <p style={{ margin: '0', fontSize: '1.6rem', fontWeight: 'bold' }}>Bs. {sales?.ventas_mes || '0.00'}</p>
        </div>

        {/* MIGRADO - Tarjeta 4: Productos Totales */}
        <div style={{ padding: '15px', backgroundColor: '#475569', color: 'white', borderRadius: '12px', boxShadow: '0 4px 10px rgba(71, 85, 105, 0.2)' }}>
          <h4 style={{ margin: '0 0 5px 0', fontSize: '0.9rem', fontWeight: '500', opacity: 0.9 }}>Productos Activos</h4>
          <p style={{ margin: '0', fontSize: '1.6rem', fontWeight: 'bold' }}>{stats?.total_items || '0'} ítems</p>
        </div>

        {/* MIGRADO - Tarjeta 5: Alertas de Stock Bajo */}
        <div style={{ 
          padding: '15px', 
          backgroundColor: Number(stats?.bajo_stock) > 0 ? '#ef4444' : '#64748b', 
          color: 'white', 
          borderRadius: '12px', 
          boxShadow: Number(stats?.bajo_stock) > 0 ? '0 4px 10px rgba(239, 68, 68, 0.3)' : 'none',
          transition: 'all 0.3s ease'
        }}>
          <h4 style={{ margin: '0 0 5px 0', fontSize: '0.9rem', fontWeight: '500', opacity: 0.9 }}>⚠️ Alertas Stock Bajo</h4>
          <p style={{ margin: '0', fontSize: '1.6rem', fontWeight: 'bold' }}>{stats?.bajo_stock || '0'} productos</p>
        </div>

        {/* Tarjeta 6: Producto Estrella */}
        <div style={{ padding: '12px 15px', backgroundColor: '#f59e0b', color: 'white', borderRadius: '12px', boxShadow: '0 4px 10px rgba(245, 158, 11, 0.2)', display: 'flex', alignItems: 'center', gap: '12px' }}>
          {sales?.producto_estrella ? (
            <>
              <img 
                src={sales.producto_estrella.imagen_url || 'https://placehold.co/60x60/e2e8f0/64748b?text=SVM'} 
                alt="Estrella" 
                style={{ width: '45px', height: '45px', borderRadius: '50%', objectFit: 'cover', border: '2px solid white', flexShrink: 0 }} 
              />
              <div style={{ overflow: 'hidden' }}>
                <h4 style={{ margin: '0', fontSize: '0.8rem', fontWeight: '500', opacity: 0.9 }}>⭐ Más Vendido</h4>
                <p style={{ margin: '0', fontSize: '1rem', fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {sales.producto_estrella.nombre_producto}
                </p>
                <small style={{ fontSize: '0.75rem', opacity: 0.95 }}>
                  {sales.producto_estrella.total_vendido} Bs.
                </small>
              </div>
            </>
          ) : (
            <div>
              <h4 style={{ margin: '0 0 2px 0', fontSize: '0.85rem', fontWeight: '500' }}>⭐ Producto Estrella</h4>
              <p style={{ margin: '0', fontSize: '0.75rem', opacity: 0.9 }}>Sin registros de venta</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default DashboardVentas;