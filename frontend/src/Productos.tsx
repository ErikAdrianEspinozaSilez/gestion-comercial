// src/Productos.tsx
import React from 'react';
import { useQuery } from '@tanstack/react-query';

// Definir el tipo Producto
interface Producto {
  producto_id: number;
  nombre_producto: string;
  descripcion: string;
  // Agrega más propiedades si es necesario
}

// Función para obtener los productos del backend
const fetchProductos = async (): Promise<Producto[]> => {
  const response = await fetch('http://localhost:3000/productos');
  
  // Manejo de errores
  if (!response.ok) {
    throw new Error('Error al obtener productos');
  }
  
  return response.json();  // Retorna los productos en formato JSON
};

const Productos: React.FC = () => {
  const { data, error, isLoading } = useQuery<Producto[], Error>({
    queryKey: ['productos'], // La llave siempre va en un array
    queryFn: fetchProductos,  // La función que hace el fetch
  });

  // ... resto del código

  // Si los productos están cargando
  if (isLoading) return <div>Cargando...</div>;

  // Si ocurre un error en la solicitud
  if (error instanceof Error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <h1>Lista de Productos</h1>
      {/* Mostrar los productos */}
      <ul>
        {/* Verificamos que `data` no sea undefined y luego mapeamos */}
        {data && data.length > 0 ? (
          data.map((producto) => (
            <li key={producto.producto_id}>{producto.nombre_producto}</li>
          ))
        ) : (
          <li>No hay productos disponibles.</li>
        )}
      </ul>
    </div>
  );
};

export default Productos;