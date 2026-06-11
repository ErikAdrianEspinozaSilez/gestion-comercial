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
        `https://gestion-comercial-j3ed.onrender.com/productos/stock-bajo?t=${Date.now()}`
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
        'https://gestion-comercial-j3ed.onrender.com/api/comunicaciones/enviar-correo',
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
      alert('❌ Error al enviar. Revisa la consola para más detalles.');
    },
  });

  const handleNotificarClick = (producto: any) => {
    const stockReal = producto.stock_total ?? 0;
    const provId = producto.proveedor_id ?? 1;

    setSelectedData({
      producto_id: producto.producto_id,
      nombre_producto: producto.nombre_producto,
      cantidad_actual: Number(stockReal),
      stock_actual: Number(stockReal),
      stock_minimo: producto.stock_minimo ?? 5,
      correo_principal:
        producto.correo_principal ||
        'cb.erik.espinoza.s@upds.net.bo',
      proveedor_id: Number(provId),
      codigo_barra: producto.codigo_barra || '',
    });

    setIsModalOpen(true);
  };

  const handleConfirmarEnvio = (formData: any) => {
    const finalData = {
      ...formData,
      proveedor_id:
        formData.proveedor_id || selectedData.proveedor_id,
    };

    mutation.mutate(finalData);
  };

  if (!stockBajo || stockBajo.length === 0) return null;
const reposicion = stockBajo.filter(
  (p: any) => p.alertas.includes('REPOSICION')
);

const proveedor = stockBajo.filter(
  (p: any) => p.alertas.includes('PROVEEDOR')
);
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
      <h4
        style={{
          margin: 0,
          color: '#856404',
        }}
      >
        ⚠️ Alerta de Reabastecimiento
      </h4>

<div style={{ marginTop: '10px' }}>
  {reposicion.length > 0 && (
    <>
      <h5
        style={{
          color: '#fd7e14',
          marginBottom: '8px',
        }}
      >
        ⚠️ Reponer Estantes
      </h5>

      {reposicion.map((p: any) => (
        <div
          key={p.producto_id}
          style={{
            padding: '4px 0',
            fontSize: '14px',
            color: '#856404',
          }}
        >
          <strong>{p.nombre_producto}</strong>
          {' '}
          🏪{p.stock_estante}
          {' | '}
          📦{p.stock_bodega}
        </div>
      ))}
    </>
  )}

  {proveedor.length > 0 && (
    <>
      <hr
        style={{
          margin: '12px 0',
          borderColor: '#ffeeba',
        }}
      />

      <h5
        style={{
          color: '#dc3545',
          marginBottom: '8px',
        }}
      >
        🚨 Notificar Proveedor
      </h5>

      {proveedor.map((p: any) => (
        <div
          key={p.producto_id}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '8px',
          }}
        >
          <span
            style={{
              fontSize: '14px',
              color: '#856404',
            }}
          >
            <strong>{p.nombre_producto}</strong>
            {' '}
            📦{p.stock_bodega}
            {' | '}
            🔢{p.stock_total}
          </span>

          <button
            onClick={() => handleNotificarClick(p)}
            disabled={mutation.isPending}
            style={{
              backgroundColor: '#0d6efd',
              color: '#ffffff',
              border: 'none',
              borderRadius: '5px',
              padding: '6px 10px',
              cursor: 'pointer',
            }}
          >
            📧 Notificar
          </button>
        </div>
      ))}
    </>
  )}
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