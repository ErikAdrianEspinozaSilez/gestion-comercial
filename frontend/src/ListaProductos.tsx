import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import toast from 'react-hot-toast';
import ModalComunicacion from './ModalComunicacion';
import { useAuth } from './AuthContext';

const ListaProductos: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [isComuModalOpen, setIsComuModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [editData, setEditData] = useState({
    nombre_producto: '',
    precio: '',
    codigo_barra: '',
    imagen_url: '',
    stock_bodega: '',
    stock_estante: ''
  });

  const { data: productos, isLoading } = useQuery({
    queryKey: ['productos'],
    queryFn: async () => {
      const response = await axios.get('https://gestion-comercial-j3ed.onrender.com/productos');
      return response.data;
    },
    refetchInterval: 2000
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) =>
      axios.delete(`https://gestion-comercial-j3ed.onrender.com/productos/${id}`),
    onSuccess: () => {
      toast.success("Producto eliminado correctamente");
      setIsDetailModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['productos'] });
    },
    onError: (err: any) => {
      toast.error("Error al eliminar: " + err.message);
    }
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) =>
      axios.put(
        `https://gestion-comercial-j3ed.onrender.com/productos/${selectedProduct.producto_id}`,
        data
      ),
    onSuccess: () => {
      toast.success("Cambios guardados correctamente");
      setIsDetailModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['productos'] });
    },
    onError: (err: any) => {
      toast.error("Error al editar: " + err.message);
    }
  });

  const emailMutation = useMutation({
    mutationFn: async (newEmail: any) => {
      const res = await axios.post(
        'https://gestion-comercial-j3ed.onrender.com/api/comunicaciones/enviar-correo',
        newEmail
      );
      return res.data;
    },
    onSuccess: () => {
      toast.success('Notificación enviada al proveedor con éxito.');
      setIsComuModalOpen(false);
    },
    onError: (error) => {
      console.error('Error al enviar:', error);
      toast.error('Error al enviar. Revisa la consola.');
    },
  });

  const openDetails = (p: any) => {
    setSelectedProduct(p);

    setEditData({
      nombre_producto: p.nombre_producto,
      precio: p.precio || '',
      codigo_barra: p.codigo_barra || '',
      imagen_url: p.imagen_url || '',
      stock_bodega: p.stock_bodega || 0,
      stock_estante: p.stock_estante || 0
    });

    setIsDetailModalOpen(true);
  };

  const handleEnviarCorreo = (formData: any) => {
    const finalData = {
      ...formData,
      proveedor_id: formData.proveedor_id || selectedProduct?.proveedor_id || 1
    };

    emailMutation.mutate(finalData);
  };

  const productosFiltrados = productos?.filter((p: any) => {
    const termino = searchTerm.toLowerCase();

    const coincideNombre = p.nombre_producto?.toLowerCase().includes(termino);
    const coincideCodigo = p.codigo_barra?.toLowerCase().includes(termino);

    return coincideNombre || coincideCodigo;
  });

  if (isLoading) return <p>Cargando inventario...</p>;

  const rol = Number(user?.rol_id);

  const inputModalStyle: React.CSSProperties = {
    padding: '12px',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
    outline: 'none',
    fontSize: '14px',
    boxSizing: 'border-box'
  };

  return (
    <div style={{
      padding: '20px',
      backgroundColor: '#ffffff',
      borderRadius: '16px',
      boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
      borderLeft: '6px solid #2563eb',
      marginBottom: '20px'
    }}>

      <h2 style={{
        margin: '0 0 20px 0',
        color: '#1e293b',
        fontSize: '1.5rem',
        fontWeight: '800',
        textAlign: 'center'
      }}>
         Inventario General
      </h2>

      <input
        type="text"
        placeholder="🔍 Buscar producto por nombre o código..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        style={{
          width: '100%',
          padding: '14px',
          marginBottom: '20px',
          borderRadius: '10px',
          border: '1px solid #e2e8f0',
          fontSize: '15px',
          boxSizing: 'border-box',
          outline: 'none'
        }}
      />

      <div style={{
        overflowX: 'auto',
        borderRadius: '10px',
        border: '1px solid #f1f5f9'
      }}>
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          minWidth: '700px'
        }}>
          <thead>
            <tr style={{
              backgroundColor: '#f8fafc',
              textAlign: 'left'
            }}>
              {['Img', 'Código', 'Producto', 'Precio', 'Bodega', 'Estante', 'Total', 'Acción'].map(h => (
                <th
                  key={h}
                  style={{
                    padding: '16px',
                    fontSize: '0.8rem',
                    color: '#64748b',
                    textTransform: 'uppercase'
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {productosFiltrados?.map((p: any) => (
              <tr
                key={p.producto_id}
                style={{
                  borderBottom: '1px solid #f1f5f9'
                }}
              >
                <td style={{ padding: '12px' }}>
                  <img
                    src={
                      p.imagen_url && !p.imagen_url.includes('via.placeholder.com')
                        ? p.imagen_url
                        : 'https://placehold.co/40x40/e2e8f0/64748b?text=📦'
                    }
                    alt="P"
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '8px',
                      objectFit: 'cover'
                    }}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://placehold.co/40x40/e2e8f0/64748b?text=📦';
                    }}
                  />
                </td>

                <td style={{
                  padding: '12px',
                  fontSize: '0.9rem'
                }}>
                  {p.codigo_barra}
                </td>

                <td style={{
                  padding: '12px',
                  fontWeight: '600'
                }}>
                  {p.nombre_producto}
                </td>

                <td style={{ padding: '12px' }}>
                  Bs. {Number(p.precio || 0).toFixed(2)}
                </td>

                <td style={{
                  padding: '12px',
                  color: '#64748b'
                }}>
                  {p.stock_bodega || 0}
                </td>

                <td style={{
                  padding: '12px',
                  color: '#2563eb',
                  fontWeight: 'bold'
                }}>
                  {p.stock_estante || 0}
                </td>

                <td style={{
                  padding: '12px',
                  fontWeight: 'bold',
                  color: p.stock_total < 5 ? '#ef4444' : '#10b981'
                }}>
                  {p.stock_total || 0}
                </td>

                <td style={{ padding: '12px' }}>
                  <button
                    onClick={() => openDetails(p)}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '6px',
                      backgroundColor: '#2563eb',
                      color: 'white',
                      border: 'none',
                      cursor: 'pointer',
                      fontWeight: '600'
                    }}
                  >
                    Gestionar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>


{/* MODAL DE EDICIÓN */}
{isDetailModalOpen && (
  <div
    style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(15, 23, 42, 0.5)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
      padding: '10px',
      boxSizing: 'border-box'
    }}
  >
    {/* X visible para cerrar */}
    <button
      type="button"
      onClick={() => setIsDetailModalOpen(false)}
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        width: '45px',
        height: '45px',
        borderRadius: '50%',
        border: '2px solid #ffffff',
        backgroundColor: '#ef4444',
        color: '#ffffff',
        fontSize: '28px',
        fontWeight: 'bold',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        lineHeight: 1,
        zIndex: 2000,
        boxShadow: '0 8px 20px rgba(0,0,0,0.35)'
      }}
      title="Cerrar"
    >
      ×
    </button>

    <div
      style={{
        backgroundColor: 'white',
        padding: '30px',
        borderRadius: '20px',
        width: '100%',
        maxWidth: '400px',
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
        borderLeft: '8px solid #2563eb'
      }}
    >
      <h4
        style={{
          margin: '0 0 20px 0',
          fontSize: '1.4rem',
          color: '#1e293b'
        }}
      >
        Editar Producto
      </h4>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '15px'
        }}
      >
        {[
          { label: 'Nombre', key: 'nombre_producto', type: 'text' },
          { label: 'Precio (Bs.)', key: 'precio', type: 'number' },
          { label: 'Código de Barra', key: 'codigo_barra', type: 'text' },
          { label: 'URL Imagen', key: 'imagen_url', type: 'text' }
        ].map((field) => (
          <div
            key={field.key}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '5px'
            }}
          >
            <label
              style={{
                fontSize: '0.85rem',
                fontWeight: '600',
                color: '#64748b'
              }}
            >
              {field.label}
            </label>

            <input
              type={field.type}
              value={editData[field.key as keyof typeof editData]}
              onChange={(e) =>
                setEditData({
                  ...editData,
                  [field.key]: e.target.value
                })
              }
              style={{
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                fontSize: '14px',
                outline: 'none'
              }}
            />
          </div>
        ))}

        {/* STOCK SOLO DE LECTURA */}
        <div
          style={{
            display: 'flex',
            gap: '10px'
          }}
        >
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              gap: '5px'
            }}
          >
            <label
              style={{
                fontSize: '0.85rem',
                fontWeight: '600',
                color: '#64748b'
              }}
            >
              Bodega
            </label>

            <input
              type="number"
              value={editData.stock_bodega}
              readOnly
              style={{
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                fontSize: '14px',
                outline: 'none',
                backgroundColor: '#f1f5f9',
                color: '#64748b',
                cursor: 'not-allowed'
              }}
            />
          </div>

          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              gap: '5px'
            }}
          >
            <label
              style={{
                fontSize: '0.85rem',
                fontWeight: '600',
                color: '#64748b'
              }}
            >
              Estante
            </label>

            <input
              type="number"
              value={editData.stock_estante}
              readOnly
              style={{
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                fontSize: '14px',
                outline: 'none',
                backgroundColor: '#f1f5f9',
                color: '#64748b',
                cursor: 'not-allowed'
              }}
            />
          </div>
        </div>
      </div>

      <div
        style={{
          marginTop: '25px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}
      >
        {(rol === 1 || rol === 2) && (
          <button
            onClick={() => updateMutation.mutate(editData)}
            disabled={updateMutation.isPending}
            style={{
              padding: '12px',
              backgroundColor: updateMutation.isPending ? '#94a3b8' : '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: updateMutation.isPending ? 'not-allowed' : 'pointer',
              fontWeight: 'bold'
            }}
          >
            {updateMutation.isPending ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        )}

        <button
          onClick={() => setIsComuModalOpen(true)}
          disabled={emailMutation.isPending}
          style={{
            padding: '12px',
            backgroundColor: emailMutation.isPending ? '#94a3b8' : '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: emailMutation.isPending ? 'not-allowed' : 'pointer',
            fontWeight: 'bold'
          }}
        >
          {emailMutation.isPending ? 'Enviando...' : '📧 Pedir más'}
        </button>

        {rol === 1 && (
          <button
            onClick={() => {
              if (confirm('¿Eliminar producto?')) {
                deleteMutation.mutate(selectedProduct.producto_id);
              }
            }}
            disabled={deleteMutation.isPending}
            style={{
              padding: '12px',
              backgroundColor: deleteMutation.isPending ? '#94a3b8' : '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: deleteMutation.isPending ? 'not-allowed' : 'pointer',
              fontWeight: 'bold'
            }}
          >
            {deleteMutation.isPending ? 'Eliminando...' : '🗑️ Eliminar'}
          </button>
        )}

        <button
          onClick={() => setIsDetailModalOpen(false)}
          style={{
            padding: '10px',
            backgroundColor: '#f1f5f9',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            color: '#64748b',
            fontWeight: '600'
          }}
        >
          Cerrar
        </button>
      </div>
    </div>
  </div>
)}

<ModalComunicacion
  isOpen={isComuModalOpen}
  onClose={() => setIsComuModalOpen(false)}
  datosPredefinidos={{
    ...selectedProduct,
    correo_principal:
      selectedProduct?.correo_principal || 'cb.erik.espinoza.s@upds.net.bo',
    stock_actual: selectedProduct?.stock_total || 0,
    cantidad_actual: selectedProduct?.stock_total || 0
  }}
  onEnviar={handleEnviarCorreo}
/>

    </div>
  );
};

export default ListaProductos;