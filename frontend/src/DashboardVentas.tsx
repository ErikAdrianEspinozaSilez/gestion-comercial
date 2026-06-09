import React from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

// Paleta definida para coherencia total
const COLORS = {
  azul: '#2563eb',
  verde: '#10b981',
  ambar: '#f59e0b',
  morado: '#8b5cf6',
  grisOscuro: '#1e293b',
  grisClaro: '#64748b'
};

const DashboardVentas: React.FC = () => {
  const { data: sales, isLoading: loadingSales } = useQuery({
    queryKey: ['dashboard-ventas'],
    queryFn: async () => {
      const res = await axios.get('https://gestion-comercial-j3ed.onrender.com/productos/dashboard-ventas');
      return res.data;
    },
    refetchInterval: 5000
  });

  const { data: stats, isLoading: loadingStats } = useQuery({
    queryKey: ['stats-dashboard-unificado'],
    queryFn: async () => {
      const res = await axios.get('https://gestion-comercial-j3ed.onrender.com/productos/stats');
      return res.data;
    },
    refetchInterval: 5000
  });

  if (loadingSales || loadingStats) return <div style={{ padding: '20px', textAlign: 'center', color: COLORS.grisClaro }}>Cargando métricas...</div>;

  // Componente pequeño para tarjetas uniformes
  const StatCard = ({ title, value, color, icon }: any) => (
    <div style={{ 
      padding: '20px', 
      backgroundColor: '#ffffff', 
      borderRadius: '16px', 
      borderLeft: `5px solid ${color}`,
      boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between'
    }}>
      <span style={{ fontSize: '0.85rem', color: COLORS.grisClaro, fontWeight: '600', textTransform: 'uppercase' }}>{title}</span>
      <span style={{ fontSize: '1.8rem', fontWeight: '800', color: COLORS.grisOscuro, marginTop: '8px' }}>{value}</span>
    </div>
  );

  return (
    <div style={{ padding: '10px 0' }}>
      <h3 style={{ marginBottom: '20px', color: COLORS.grisOscuro, fontWeight: '800', fontSize: '1.5rem' }}> Resumen Ejecutivo</h3>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
        <StatCard title="Ventas Hoy" value={`Bs. ${sales?.ventas_hoy || '0.00'}`} color={COLORS.verde} />
        <StatCard title="Esta Semana" value={`Bs. ${sales?.ventas_semana || '0.00'}`} color={COLORS.azul} />
        <StatCard title="Este Mes" value={`Bs. ${sales?.ventas_mes || '0.00'}`} color={COLORS.morado} />
        <StatCard title="Productos Activos" value={`${stats?.total_items || '0'} ítems`} color={COLORS.grisOscuro} />
        <StatCard title="Stock Bajo" value={`${stats?.bajo_stock || '0'} alertas`} color={Number(stats?.bajo_stock) > 0 ? '#ef4444' : COLORS.grisClaro} />
        
        {/* Producto Estrella con diseño especial */}
        <div style={{ 
          padding: '20px', backgroundColor: COLORS.ambar, color: 'white', borderRadius: '16px', 
          display: 'flex', alignItems: 'center', gap: '15px', boxShadow: '0 4px 10px rgba(245, 158, 11, 0.3)' 
        }}>
          <img 
            src={sales?.producto_estrella?.imagen_url || 'https://placehold.co/60x60/f59e0b/white?text=⭐'} 
            alt="Estrella" 
            style={{ width: '50px', height: '50px', borderRadius: '12px', objectFit: 'cover' }} 
          />
          <div>
            <div style={{ fontSize: '0.8rem', opacity: 0.9 }}>Producto Estrella</div>
            <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{sales?.producto_estrella?.nombre_producto || 'N/A'}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardVentas;
