import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios, { AxiosError } from 'axios';

const AgregarProducto: React.FC = () => {
  const [formData, setFormData] = useState({
    nombre_producto: '',
    precio: '', // <--- ÚNICO PRECIO
    codigo_barra: '',
    imagen_url: ''
  });

  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (nuevoProducto: typeof formData) => {
      return await axios.post('https://gestion-comercial-j3ed.onrender.com/productos', nuevoProducto);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productos'] });

      setFormData({
        nombre_producto: '',
        precio: '', // <--- ÚNICO PRECIO
        codigo_barra: '',
        imagen_url: ''
      });

      alert("¡Producto registrado en Super Valle!");
    },
    onError: (error: AxiosError) => {
      console.error("Error detallado:", error.response?.data);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nombre_producto.trim()) return;

    mutation.mutate(formData);
  };

  // Esta es la función que intercepta el "Enter"
  const handleEnterKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();  // Prevenimos el envío del formulario al presionar "Enter"
    }
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

      <form onSubmit={handleSubmit}>
        {/* Campos para Nombre del Producto, Precio, etc. */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginBottom: '10px' }}>
          <label style={{ fontSize: '14px', color: '#64748b' }}>Nombre del Producto</label>
          <input
            type="text"
            value={formData.nombre_producto}
            onChange={(e) => setFormData({ ...formData, nombre_producto: e.target.value })}
            placeholder="Ingrese nombre del producto"
            disabled={mutation.isPending}
            style={{
              padding: '10px',
              borderRadius: '6px',
              border: '1px solid #cbd5e1'
            }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginBottom: '10px' }}>
          <label style={{ fontSize: '14px', color: '#64748b' }}>Precio</label>
          <input
            type="number"
            value={formData.precio}
            onChange={(e) => setFormData({ ...formData, precio: e.target.value })}
            placeholder="Ingrese precio"
            disabled={mutation.isPending}
            style={{
              padding: '10px',
              borderRadius: '6px',
              border: '1px solid #cbd5e1'
            }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginBottom: '10px' }}>
          <label style={{ fontSize: '14px', color: '#64748b' }}>Imagen URL</label>
          <input
            type="text"
            value={formData.imagen_url}
            onChange={(e) => setFormData({ ...formData, imagen_url: e.target.value })}
            placeholder="Ingrese URL de la imagen"
            disabled={mutation.isPending}
            style={{
              padding: '10px',
              borderRadius: '6px',
              border: '1px solid #cbd5e1'
            }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginBottom: '10px' }}>
          <label style={{ fontSize: '14px', color: '#64748b' }}>Código de Barra (Opcional para productos sueltos)</label>
          <input
            type="text"
            value={formData.codigo_barra}
            onChange={(e) => setFormData({ ...formData, codigo_barra: e.target.value })}
            onKeyDown={handleEnterKey}  // Aquí estamos interceptando la tecla "Enter"
            placeholder="Escanee o deje en blanco"
            disabled={mutation.isPending}
            style={{
              padding: '10px',
              borderRadius: '6px',
              border: '1px solid #cbd5e1'
            }}
          />
        </div>

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
            fontWeight: 'bold',
            width: '100%'
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