import React from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

const DashboardStats: React.FC = () => {
  const { data: stats } = useQuery({
    queryKey: ['stats-dashboard'],
    queryFn: async () => {
      const res = await axios.get('http://localhost:3000/productos/stats');
      return res.data;
    },
    // ESTA ES LA CLAVE:
    refetchInterval: 3000, // Se actualiza solo cada 3 segundos
    refetchOnWindowFocus: true, // Si cambias de pestaña y vuelves, se actualiza
    staleTime: 0, // Considera los datos "viejos" de inmediato para pedir nuevos
  });

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '20px' }}>
      <div style={{ background: '#4e73df', color: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
        <h5 style={{ margin: 0, opacity: 0.8 }}>Total Productos</h5>
        <h2 style={{ margin: '10px 0 0 0' }}>{stats?.total_items || 0}</h2>
      </div>
      
      <div style={{ background: '#e74a3b', color: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
        <h5 style={{ margin: 0, opacity: 0.8 }}>Alertas de Stock</h5>
        <h2 style={{ margin: '10px 0 0 0' }}>{stats?.bajo_stock || 0}</h2>
      </div>

      <div style={{ background: '#1cc88a', color: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
        <h5 style={{ margin: 0, opacity: 0.8 }}>Ventas Hoy (Estimado)</h5>
        <h2 style={{ margin: '10px 0 0 0' }}>{stats?.ventas_hoy || 0} Bs.</h2>
      </div>
    </div>
  );
};

export default DashboardStats;