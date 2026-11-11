import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import ModalComunicacion from './ModalComunicacion';
import toast from 'react-hot-toast';

const AlertasInventario: React.FC = () => {
  const queryClient = useQueryClient();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedData, setSelectedData] = useState<any>(null);
  const [hoveredBtn, setHoveredBtn] = useState<number | null>(null);

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
      toast.success('Notificación enviada al proveedor con éxito.');
      setIsModalOpen(false);
      queryClient.invalidateQueries({
        queryKey: ['stock-bajo'],
      });
    },
    onError: (error: any) => {
      console.error('Error al enviar:', error);
      const mensajeError =
        error?.response?.data?.message ||
        'No se pudo enviar la notificación al proveedor.';
      toast.error(mensajeError);
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
    (p: any) => p.alertas && p.alertas.includes('REPOSICION')
  );

  const proveedor = stockBajo.filter(
    (p: any) => p.alertas && p.alertas.includes('PROVEEDOR')
  );

  return (
    <div
      style={{
        backgroundColor: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '14px',
        padding: '22px',
        marginBottom: '24px',
        boxShadow: '0 4px 12px rgba(15, 23, 42, 0.04)',
      }}
    >
      {/* Encabezado Principal */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '18px',
          paddingBottom: '14px',
          borderBottom: '1px solid #f1f5f9',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              color: '#0f172a',
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
          <div>
            <h4
              style={{
                margin: 0,
                fontSize: '16px',
                fontWeight: 700,
                color: '#0f172a',
                letterSpacing: '-0.2px',
              }}
            >
              Centro de Control de Abastecimiento
            </h4>
            <span style={{ fontSize: '12px', color: '#64748b' }}>
              Monitoreo automático de stock en sala de ventas y almacén
            </span>
          </div>
        </div>
      </div>

      {/* Grid de 2 Columnas */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
          gap: '18px',
        }}
      >
        {/* COLUMNA 1: REPONER ESTANTES */}
        {reposicion.length > 0 && (
          <div
            style={{
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderTop: '4px solid #f59e0b',
              borderRadius: '10px',
              padding: '16px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '14px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span
                  style={{
                    color: '#d97706',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="17 1 21 5 17 9" />
                    <path d="M3 11V9a4 4 0 0 1 4-4h14" />
                    <polyline points="7 23 3 19 7 15" />
                    <path d="M21 13v2a4 4 0 0 1-4 4H3" />
                  </svg>
                </span>
                <h5
                  style={{
                    margin: 0,
                    fontSize: '14px',
                    fontWeight: 700,
                    color: '#1e293b',
                  }}
                >
                  Reposición de Estantes
                </h5>
              </div>

              <span
                style={{
                  backgroundColor: '#fffbeb',
                  color: '#b45309',
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '3px 9px',
                  borderRadius: '999px',
                  border: '1px solid #fde68a',
                }}
              >
                {reposicion.length} {reposicion.length === 1 ? 'pendiente' : 'pendientes'}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {reposicion.map((p: any) => {
                const estanteVal = Number(p.stock_estante ?? 0);
                const bodegaVal = Number(p.stock_bodega ?? 0);

                return (
                  <div
                    key={p.producto_id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '10px',
                      backgroundColor: '#f8fafc',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '14px',
                        fontWeight: 600,
                        color: '#0f172a',
                        textTransform: 'capitalize',
                      }}
                    >
                      {p.nombre_producto}
                    </span>

                    {/* OPCIÓN A: Pastillas limpias con punto de estado */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          backgroundColor: '#fef2f2',
                          color: '#b91c1c',
                          border: '1px solid #fecaca',
                          fontSize: '12px',
                          fontWeight: 600,
                          padding: '4px 10px',
                          borderRadius: '999px',
                        }}
                      >
                        <span
                          style={{
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            backgroundColor: '#ef4444',
                          }}
                        />
                        Estante: {estanteVal}
                      </span>

                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          backgroundColor: bodegaVal > 0 ? '#f0fdf4' : '#f1f5f9',
                          color: bodegaVal > 0 ? '#15803d' : '#64748b',
                          border:
                            bodegaVal > 0
                              ? '1px solid #bbf7d0'
                              : '1px solid #cbd5e1',
                          fontSize: '12px',
                          fontWeight: 600,
                          padding: '4px 10px',
                          borderRadius: '999px',
                        }}
                      >
                        <span
                          style={{
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            backgroundColor: bodegaVal > 0 ? '#22c55e' : '#94a3b8',
                          }}
                        />
                        Bodega: {bodegaVal}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* COLUMNA 2: NOTIFICAR PROVEEDOR */}
        {proveedor.length > 0 && (
          <div
            style={{
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderTop: '4px solid #ef4444',
              borderRadius: '10px',
              padding: '16px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '14px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span
                  style={{
                    color: '#dc2626',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                  </svg>
                </span>
                <h5
                  style={{
                    margin: 0,
                    fontSize: '14px',
                    fontWeight: 700,
                    color: '#1e293b',
                  }}
                >
                  Solicitud a Proveedores
                </h5>
              </div>

              <span
                style={{
                  backgroundColor: '#fef2f2',
                  color: '#b91c1c',
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '3px 9px',
                  borderRadius: '999px',
                  border: '1px solid #fecaca',
                }}
              >
                {proveedor.length} {proveedor.length === 1 ? 'crítico' : 'críticos'}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {proveedor.map((p: any) => {
                const bodegaVal = Number(p.stock_bodega ?? 0);
                const totalVal = Number(p.stock_total ?? 0);
                const isHovered = hoveredBtn === p.producto_id;

                return (
                  <div
                    key={p.producto_id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '12px',
                      backgroundColor: '#f8fafc',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <span
                        style={{
                          fontSize: '14px',
                          fontWeight: 600,
                          color: '#0f172a',
                          textTransform: 'capitalize',
                        }}
                      >
                        {p.nombre_producto}
                      </span>

                      {/* OPCIÓN A: Pastillas limpias con punto de estado */}
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            backgroundColor: '#ffffff',
                            color: '#475569',
                            border: '1px solid #cbd5e1',
                            fontSize: '11px',
                            fontWeight: 600,
                            padding: '3px 9px',
                            borderRadius: '999px',
                          }}
                        >
                          <span
                            style={{
                              width: '6px',
                              height: '6px',
                              borderRadius: '50%',
                              backgroundColor: '#64748b',
                            }}
                          />
                          Bodega: {bodegaVal}
                        </span>

                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            backgroundColor: '#fef2f2',
                            color: '#b91c1c',
                            border: '1px solid #fecaca',
                            fontSize: '11px',
                            fontWeight: 600,
                            padding: '3px 9px',
                            borderRadius: '999px',
                          }}
                        >
                          <span
                            style={{
                              width: '6px',
                              height: '6px',
                              borderRadius: '50%',
                              backgroundColor: '#ef4444',
                            }}
                          />
                          Total: {totalVal}
                        </span>
                      </div>
                    </div>

                    {/* OPCIÓN 1: Botón Ejecutivo Oscuro con Icono SVG */}
                    <button
                      onClick={() => handleNotificarClick(p)}
                      onMouseEnter={() => setHoveredBtn(p.producto_id)}
                      onMouseLeave={() => setHoveredBtn(null)}
                      disabled={mutation.isPending}
                      style={{
                        backgroundColor: mutation.isPending
                          ? '#94a3b8'
                          : isHovered
                          ? '#1e293b'
                          : '#0f172a',
                        color: '#ffffff',
                        border: '1px solid #0f172a',
                        borderRadius: '8px',
                        padding: '8px 14px',
                        fontSize: '12px',
                        fontWeight: 600,
                        letterSpacing: '0.2px',
                        cursor: mutation.isPending ? 'not-allowed' : 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '7px',
                        boxShadow: isHovered
                          ? '0 4px 8px rgba(15, 23, 42, 0.18)'
                          : '0 1px 2px rgba(15, 23, 42, 0.1)',
                        transform: isHovered ? 'translateY(-1px)' : 'none',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <line x1="22" y1="2" x2="11" y2="13" />
                        <polygon points="22 2 15 22 11 13 2 9 22 2" />
                      </svg>
                      {mutation.isPending ? 'Enviando...' : 'Notificar'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
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