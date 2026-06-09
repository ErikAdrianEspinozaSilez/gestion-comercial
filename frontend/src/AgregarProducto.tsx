import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios, { AxiosError } from 'axios';
import toast from 'react-hot-toast';

const AgregarProducto: React.FC = () => {
  const [formData, setFormData] = useState({
    nombre_producto: '',
    precio: '',
    codigo_barra: '',
    imagen_url: ''
  });

  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (nuevoProducto: typeof formData) => {
      return await axios.post(
        'https://gestion-comercial-j3ed.onrender.com/productos',
        nuevoProducto
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productos'] });

      setFormData({
        nombre_producto: '',
        precio: '',
        codigo_barra: '',
        imagen_url: ''
      });

      toast.success("¡Producto registrado con éxito!");
    },
    onError: (error: AxiosError) => {
      toast.error("Error al registrar el producto.");
      console.error("Error detallado:", error.response?.data);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nombre_producto.trim()) {
      toast.error("El nombre del producto es obligatorio.");
      return;
    }

    mutation.mutate(formData);
  };

  // Estilos reutilizables
  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
    fontSize: '14px',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s'
  };

  return (
    <div style={{
      marginBottom: '20px',
      padding: '25px',
      backgroundColor: '#ffffff',
      borderRadius: '16px',
      borderLeft: '6px solid #2563eb',
      boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
      transition: 'all 0.3s ease'
    }}>
      <h3 style={{
        marginTop: 0,
        color: '#1e293b',
        marginBottom: '20px',
        fontSize: '1.25rem',
        fontWeight: '700'
      }}>
         Registrar nueva mercadería
      </h3>

      <form
        onSubmit={handleSubmit}
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '15px'
        }}
      >
        {[
          {
            label: 'Nombre del Producto',
            key: 'nombre_producto',
            type: 'text',
            placeholder: 'Ej. Coca Cola 2L'
          },
          {
            label: 'Precio (Bs.)',
            key: 'precio',
            type: 'number',
            placeholder: '0.00'
          },
          {
            label: 'Imagen URL',
            key: 'imagen_url',
            type: 'text',
            placeholder: 'https://...'
          },
          {
            label: 'Código de Barra',
            key: 'codigo_barra',
            type: 'text',
            placeholder: 'Escanee o digite código'
          }
        ].map((field) => (
          <div
            key={field.key}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '6px'
            }}
          >
            <label style={{
              fontSize: '13px',
              fontWeight: '600',
              color: '#64748b'
            }}>
              {field.label}
            </label>

            <input
              type={field.type}
              value={formData[field.key as keyof typeof formData]}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  [field.key]: e.target.value
                })
              }
              placeholder={field.placeholder}
              disabled={mutation.isPending}
              style={inputStyle}
            />
          </div>
        ))}

        <button
          type="submit"
          disabled={mutation.isPending}
          style={{
            marginTop: '10px',
            padding: '14px',
            backgroundColor: mutation.isPending ? '#94a3b8' : '#2563eb',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: mutation.isPending ? 'not-allowed' : 'pointer',
            fontWeight: 'bold',
            fontSize: '15px',
            transition: 'background-color 0.2s'
          }}
        >
          {mutation.isPending ? 'Guardando...' : ' Guardar Producto'}
        </button>
      </form>
    </div>
  );
};

export default AgregarProducto;