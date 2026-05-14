import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import ModalComunicacion from './ModalComunicacion';

const AlertasInventario: React.FC = () => {
  const queryClient = useQueryClient();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedData, setSelectedData] = useState<any>(null);

  const { data: stockBajo } = useQuery({
    queryKey: ['stock-bajo'],
    queryFn: async () => {
      const res = await axios.get(
        `http://localhost:3000/productos/stock-bajo?t=${Date.now()}`
      );
      return res.data;
    },
    refetchInterval: 2000,
    refetchOnWindowFocus: true,
    staleTime: 0,
  });

  const mutation = useMutation({
    mutationFn: async (newEmail: any) => {
      const res = await axios.post(
        'http://localhost:3000/api/comunicaciones/enviar-correo',
        newEmail
      );
      return res.data;
    },
    onSuccess: () => {
      alert('✅ Notificación enviada al proveedor con éxito.');
      setIsModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['stock-bajo'] });
    },
    onError: (error) => {
      console.error('Error al enviar:', error);
      alert('❌ Error al enviar. Revisa que el backend esté encendido y la ruta exista.');
    },
  });

  const handleNotificarClick = (producto: any) => {
    setSelectedData({
      producto_id: producto.producto_id,
      nombre_producto: producto.nombre_producto,
      cantidad_actual: Number(producto.stock_total),
      stock_minimo: producto.stock_minimo || 5,
      correo_principal: producto.correo_principal || '',
      proveedor_id: producto.proveedor_id || 1,
      codigo_barra: producto.codigo_barra || '',
      
    });

    setIsModalOpen(true);
  };

  const handleConfirmarEnvio = (formData: any) => {
    mutation.mutate(formData);
  };

  if (!stockBajo || stockBajo.length === 0) return null;

  return (
    <div
      style={{
        backgroundColor: '#fff3cd',
        borderLeft: '5px solid #ffc107',
        padding: '15px',
        borderRadius: '8px',
        marginBottom: '20px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      }}
    >
      <h4 style={{ margin: 0, color: '#856404' }}>
        ⚠️ Alerta de Reabastecimiento
      </h4>

      <div style={{ marginTop: '10px' }}>
        {stockBajo.map((p: any) => (
          <div
            key={`${p.producto_id}-${p.stock_total}`}
            style={{
              backgroundColor: '#ffffff',
              border: '1px solid #ffeeba',
              borderRadius: '6px',
              padding: '10px',
              marginBottom: '8px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <div style={{ fontSize: '14px', color: '#856404' }}>
              <strong>{p.nombre_producto}</strong>: Solo quedan
              <span style={{ fontWeight: 'bold', color: '#dc3545' }}>
                {' '}
                {Number(p.stock_total).toFixed(0)}{' '}
              </span>
              unidades.
            </div>

            <button
              onClick={() => handleNotificarClick(p)}
              disabled={mutation.isPending}
              style={{
                backgroundColor: '#0d6efd',
                color: '#ffffff',
                border: 'none',
                borderRadius: '5px',
                padding: '7px 10px',
                fontSize: '12px',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              📧 Notificar Proveedor
            </button>
          </div>
        ))}
      </div>

      <ModalComunicacion
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        datosPredefinidos={selectedData}
        onEnviar={handleConfirmarEnvio}
      />
    </div>
  );
};

export default AlertasInventario;