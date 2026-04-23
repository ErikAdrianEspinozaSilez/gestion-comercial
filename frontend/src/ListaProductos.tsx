import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

const ListaProductos: React.FC = () => {
  const [busqueda, setBusqueda] = useState('');
  const queryClient = useQueryClient();

  // 1. Obtener los productos del Backend
  const { data: productos, isLoading, isError } = useQuery({
    queryKey: ['productos'],
    queryFn: async () => {
      const res = await axios.get('http://localhost:3000/productos');
      return res.data;
    },
  });

  // 2. Mutación para Eliminar (Parte del CRUD completo)
  const mutationEliminar = useMutation({
    mutationFn: (id: number) => {
      return axios.delete(`http://localhost:3000/productos/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productos'] });
      alert("Producto eliminado");
    },
  });

  // 3. Lógica de búsqueda
  const productosFiltrados = productos?.filter((p: any) =>
    p.nombre_producto.toLowerCase().includes(busqueda.toLowerCase()) ||
    p.codigo_barra.toLowerCase().includes(busqueda.toLowerCase())
  );

  if (isLoading) return <p style={{ textAlign: 'center' }}>Cargando inventario...</p>;
  if (isError) return <p style={{ color: 'red' }}>Error al cargar productos.</p>;

  return (
    <div style={{ 
      padding: '20px', 
      backgroundColor: '#fff', 
      borderRadius: '12px', 
      boxShadow: '0 4px 10px rgba(0,0,0,0.1)' 
    }}>
      <h2 style={{ color: '#333', borderBottom: '2px solid #007bff', paddingBottom: '10px' }}>
        🛒 Inventario Super Valle
      </h2>

      {/* Buscador */}
      <input
        type="text"
        placeholder="🔍 Buscar por nombre o código..."
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
        style={{
          width: '100%',
          padding: '12px',
          margin: '15px 0',
          borderRadius: '8px',
          border: '1px solid #ddd',
          fontSize: '16px'
        }}
      />

      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
        <thead>
          <tr style={{ backgroundColor: '#007bff', color: 'white', textAlign: 'left' }}>
            <th style={{ padding: '12px' }}>ID</th>
            <th style={{ padding: '12px' }}>Código</th>
            <th style={{ padding: '12px' }}>Producto</th>
            <th style={{ padding: '12px' }}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {productosFiltrados?.map((p: any) => (
            <tr key={p.producto_id} style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: '12px' }}>{p.producto_id}</td>
              <td style={{ padding: '12px', color: '#666' }}>{p.codigo_barra}</td>
              <td style={{ padding: '12px', fontWeight: 'bold' }}>{p.nombre_producto}</td>
              <td style={{ padding: '12px' }}>
                <button 
                  onClick={() => {
                    if(window.confirm('¿Eliminar este producto?')) 
                      mutationEliminar.mutate(p.producto_id)
                  }}
                  style={{ 
                    backgroundColor: '#ff4d4d', 
                    color: 'white', 
                    border: 'none', 
                    padding: '5px 10px', 
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Eliminar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ListaProductos;