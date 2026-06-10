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
{stockBajo.map((p: any) => {

  console.log(
    p.nombre_producto,
    p.stock_bodega,
    p.stock_estante,
    p.stock_total
  );

  return (
      <div
        key={p.producto_id}
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
              <div
                style={{
                  fontSize: '14px',
                  color: '#856404',
                }}
              >
                <strong>{p.nombre_producto}</strong>

{p.tipo_alerta === 'REPOSICION' ? (
  <span style={{ color: '#fd7e14' }}>
    ⚠️ Reponer desde bodega al estante
  </span>
) : (
  <span style={{ color: '#dc3545' }}>
    🚨 Comprar al proveedor
  </span>
)}            </div>

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
                📧 Notificar
              </button>
            </div>
          );
        })}
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