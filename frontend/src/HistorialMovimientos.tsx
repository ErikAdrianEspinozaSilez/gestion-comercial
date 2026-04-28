import React from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

const HistorialMovimientos: React.FC = () => {
  const { data: movimientos, isLoading, error } = useQuery({
    queryKey: ['movimientos'],
    queryFn: async () => {
      const res = await axios.get('http://localhost:3000/productos/historial'); 
      return res.data; // Asegúrate de retornar res.data y no response.data
    },
    refetchInterval: 2000, 
    refetchOnWindowFocus: true,
    staleTime: 0,
  });

  if (isLoading) return <p>Cargando historial...</p>;
  if (error) return <p style={{ color: 'red' }}>Error al cargar movimientos</p>;

  return (
    <div style={{ marginTop: '20px' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'white' }}>
        <thead>
          <tr style={{ backgroundColor: '#f2f2f2', textAlign: 'left' }}>
            <th style={{ padding: '12px', borderBottom: '2px solid #ddd' }}>Fecha/Hora</th>
            <th style={{ padding: '12px', borderBottom: '2px solid #ddd' }}>Producto</th>
            <th style={{ padding: '12px', borderBottom: '2px solid #ddd' }}>Tipo</th>
            <th style={{ padding: '12px', borderBottom: '2px solid #ddd' }}>Cant.</th>
          </tr>
        </thead>
        <tbody>
          {movimientos?.map((m: any) => (
            <tr key={m.movimiento_id}>
              {/* Aquí se muestra la fecha formateada que viene del Backend */}
              <td style={{ padding: '10px', borderBottom: '1px solid #eee' }}>{m.fecha_formateada}</td>
              <td style={{ padding: '10px', borderBottom: '1px solid #eee' }}>{m.nombre_producto}</td>
              <td style={{ padding: '10px', borderBottom: '1px solid #eee' }}>
                <span style={{ 
                  padding: '4px 8px', 
                  borderRadius: '4px', 
                  fontSize: '0.85rem',
                  backgroundColor: m.nombre_tipo === 'Entrada' ? '#d4edda' : '#f8d7da',
                  color: m.nombre_tipo === 'Entrada' ? '#155724' : '#721c24'
                }}>
                  {m.nombre_tipo}
                </span>
              </td>
              <td style={{ padding: '10px', borderBottom: '1px solid #eee' }}>{m.cantidad}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default HistorialMovimientos;