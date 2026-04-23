import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios, { AxiosError } from 'axios';

const AgregarProducto: React.FC = () => {
  const [nombre, setNombre] = useState('');
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (nuevoNombre: string) => {
      // Enviamos un objeto que el backend pueda entender
      return await axios.post('http://localhost:3000/productos', { 
        nombre_producto: nuevoNombre 
      });
    },
    onSuccess: () => {
      // Esta es la clave de la Clase 7: Sincronización de estado
      queryClient.invalidateQueries({ queryKey: ['productos'] });
      setNombre('');
      alert("¡Producto registrado en Super Valle!");
    },
    onError: (error: AxiosError) => {
      console.error("Error detallado:", error.response?.data);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) return;
    mutation.mutate(nombre);
  };

  return (
    <div style={{ 
      marginBottom: '20px', 
      padding: '20px', 
      backgroundColor: '#f4f7f6', 
      borderRadius: '12px',
      borderLeft: '5px solid #007bff',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)' 
    }}>
      <h3 style={{ marginTop: 0, color: '#333' }}>📦 Registro de Mercadería</h3>
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '10px' }}>
        <input
          type="text"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Nombre del producto (ej: Fanta 2L)"
          disabled={mutation.isPending}
          style={{ 
            padding: '10px', 
            borderRadius: '6px', 
            border: '1px solid #ccc',
            flex: 1
          }}
        />
        <button 
          type="submit" 
          disabled={mutation.isPending}
          style={{ 
            padding: '10px 20px', 
            backgroundColor: mutation.isPending ? '#ccc' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: mutation.isPending ? 'not-allowed' : 'pointer',
            fontWeight: 'bold'
          }}
        >
          {mutation.isPending ? 'Procesando...' : 'Guardar en Inventario'}
        </button>
      </form>
      
      {mutation.isError && (
        <p style={{ color: '#d9534f', fontSize: '14px', marginTop: '10px' }}>
          ❌ Error: {(mutation.error as any)?.response?.data?.error || "No se pudo conectar con el servidor"}
        </p>
      )}
    </div>
  );
};

export default AgregarProducto;