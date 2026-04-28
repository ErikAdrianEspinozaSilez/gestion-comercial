import React from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

const ListaProductos: React.FC = () => {
  const { data: productos, isLoading } = useQuery({
    queryKey: ['productos'],
    queryFn: async () => {
      const response = await axios.get('http://localhost:3000/productos');
      return response.data;
    },
    refetchInterval: 2000 
  });

  if (isLoading) return <p>Cargando productos...</p>;

  return (
    <div style={{ padding: '20px', backgroundColor: '#fff', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', marginBottom: '20px' }}>
      <h3>📦 Inventario de Productos</h3>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ textAlign: 'left', borderBottom: '2px solid #eee' }}>
            <th style={{ padding: '10px' }}>Producto</th>
            <th style={{ padding: '10px' }}>Categoría</th>
            <th style={{ padding: '10px' }}>Precio (Bs.)</th>
            <th style={{ padding: '10px' }}>Stock Actual</th>
          </tr>
        </thead>
        <tbody>{productos?.map((p: any) => (
          <tr key={`${p.producto_id}-${p.stock_total}`} style={{ borderBottom: '1px solid #eee' }}>
            <td style={{ padding: '10px' }}>{p.nombre_producto}</td>
            <td style={{ padding: '10px' }}>{p.categoria}</td>
            <td style={{ padding: '10px' }}>{p.precio_unitario}</td>
            <td style={{ padding: '10px', fontWeight: 'bold', color: Number(p.stock_total) > 5 ? '#28a745' : '#dc3545' }}>
              {p.stock_total || 0} unidades
            </td>
          </tr>
        ))}</tbody>
      </table>
    </div>
  );
};

export default ListaProductos;