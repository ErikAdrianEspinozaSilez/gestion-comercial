import React from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

const HistorialMovimientos: React.FC = () => {
  const { data: movimientos, isLoading, error } = useQuery({
    queryKey: ['movimientos'],
    queryFn: async () => {
      const response = await axios.get('http://localhost:3000/movimientos');
      return response.data;
    },
    refetchInterval: 2000, // Se actualiza solo cada 2 segundos
  });

  if (isLoading) return <p>Cargando historial...</p>;
  if (error) return <p>Error al cargar movimientos</p>;

  return (
    <div style={{ marginTop: '30px', padding: '20px', backgroundColor: '#fff', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
      <h3>📋 Historial de Movimientos (Kardex)</h3>
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #eee' }}>
            <th style={{ padding: '10px' }}>ID</th>
            <th style={{ padding: '10px' }}>Producto</th>
            <th style={{ padding: '10px' }}>Cantidad</th>
            <th style={{ padding: '10px' }}>Tipo</th>
          </tr>
        </thead>
        <tbody>
          {movimientos?.map((mov: any) => (
            <tr key={mov.movimiento_id} style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: '10px' }}>{mov.movimiento_id}</td>
              <td style={{ padding: '10px' }}>{mov.nombre_producto}</td>
              <td style={{ padding: '10px', fontWeight: 'bold', color: mov.cantidad > 0 ? 'green' : 'red' }}>
                {mov.cantidad}
              </td>
              <td style={{ padding: '10px' }}>
                <span style={{ 
                  padding: '4px 8px', 
                  borderRadius: '4px', 
                  fontSize: '12px',
                  backgroundColor: mov.nombre_tipo?.includes('ingreso') ? '#d4edda' : '#f8d7da'
                }}>
                  {mov.nombre_tipo}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default HistorialMovimientos;