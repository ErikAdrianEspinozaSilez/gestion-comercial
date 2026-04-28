import React from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

const AlertasInventario: React.FC = () => {
  const { data: stockBajo } = useQuery({
    queryKey: ['stock-bajo'],
    queryFn: async () => {
      // Agregamos un timestamp para evitar que el navegador guarde una versión vieja (cache busting)
      const res = await axios.get(`http://localhost:3000/productos/stock-bajo?t=${Date.now()}`);
      return res.data;
    },
    refetchInterval: 2000, // Se actualiza cada 2 segundos igual que la lista
    refetchOnWindowFocus: true, // Si cambias de pestaña y vuelves, se actualiza
    staleTime: 0, // Considera los datos "viejos" inmediatamente para forzar la recarga
  });

  if (!stockBajo || stockBajo.length === 0) return null;

  return (
    <div style={{ 
      backgroundColor: '#fff3cd', 
      borderLeft: '5px solid #ffc107', 
      padding: '15px', 
      borderRadius: '8px',
      marginBottom: '20px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    }}>
      <h4 style={{ margin: 0, color: '#856404' }}>⚠️ Alerta de Reabastecimiento</h4>
      <ul style={{ margin: '10px 0 0 0', fontSize: '14px', color: '#856404' }}>
        {stockBajo.map((p: any) => (
          <li key={`${p.producto_id}-${p.stock_total}`}> 
            <strong>{p.nombre_producto}</strong>: Solo quedan 
            <span style={{ fontWeight: 'bold', color: '#dc3545' }}> {Number(p.stock_total).toFixed(0)} </span> 
            unidades.
          </li>
        ))}
      </ul>
    </div>
  );
};

export default AlertasInventario;