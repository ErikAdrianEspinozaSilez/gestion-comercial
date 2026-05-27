import React from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

const DashboardStats: React.FC = () => {
  const { data: stats } = useQuery({
    queryKey: ['stats-dashboard'],
    queryFn: async () => {
      const res = await axios.get('https://gestion-comercial-j3ed.onrender.com/productos/stats');
      // Convertimos los valores a número seguro
      return {
        total_items: Number(res.data.total_items || 0),
        bajo_stock: Number(res.data.bajo_stock || 0),
        ventas_hoy: parseFloat(res.data.ventas_hoy || 0).toFixed(2)
      };
    },
    // 🔑 Refetch automático cada 3 segundos
    refetchInterval: 3000,
    refetchOnWindowFocus: true,
    staleTime: 0,
  });

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '20px' }}>
      <div style={{ background: '#4e73df', color: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
        <h5 style={{ margin: 0, opacity: 0.8 }}>Total Productos</h5>
        <h2 style={{ margin: '10px 0 0 0' }}>{stats?.total_items}</h2>
      </div>
      
      <div style={{ background: '#e74a3b', color: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
        <h5 style={{ margin: 0, opacity: 0.8 }}>Alertas de Stock</h5>
        <h2 style={{ margin: '10px 0 0 0' }}>{stats?.bajo_stock}</h2>
      </div>

      <div style={{ background: '#1cc88a', color: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
        <h5 style={{ margin: 0, opacity: 0.8 }}>Ventas Hoy (Estimado)</h5>
        <h2 style={{ margin: '10px 0 0 0' }}>{stats?.ventas_hoy} Bs.</h2>
      </div>
    </div>
  );
};

export default DashboardStats;