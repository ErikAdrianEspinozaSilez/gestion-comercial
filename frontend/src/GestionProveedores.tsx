import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import toast from 'react-hot-toast';

const GestionProveedores: React.FC = () => {
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    razon_social: '',
    nit: '',
    correo_principal: '',
    telefono_principal: ''
  });

  const [selectedProds, setSelectedProds] = useState<number[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState<number | null>(null);

  // Buscador y apertura del selector de productos relacionados
  const [busquedaProducto, setBusquedaProducto] = useState('');
  const [mostrarSelectorProductos, setMostrarSelectorProductos] = useState(false);

  const { data: listaProductos } = useQuery({
    queryKey: ['productos'],
    queryFn: async () =>
      (await axios.get('https://gestion-comercial-j3ed.onrender.com/productos')).data
  });

  const { data: proveedores, isLoading } = useQuery({
    queryKey: ['proveedores'],
    queryFn: async () =>
      (await axios.get('https://gestion-comercial-j3ed.onrender.com/api/proveedores')).data
  });

  const mutation = useMutation({
    mutationFn: (data: any) =>
      isEditing
        ? axios.put(`https://gestion-comercial-j3ed.onrender.com/api/proveedores/${currentId}`, data)
        : axios.post('https://gestion-comercial-j3ed.onrender.com/api/proveedores', data),

    onSuccess: () => {
      toast.success(isEditing ? "Proveedor actualizado" : "Proveedor registrado");
      cancelarEdicion();
      queryClient.invalidateQueries({ queryKey: ['proveedores'] });
    },

    onError: () => {
      toast.error("Error al guardar.");
    }
  });

  const toggleProducto = (id: number) => {
    setSelectedProds(prev =>
      prev.includes(id)
        ? prev.filter(p => p !== id)
        : [...prev, id]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.razon_social || !formData.correo_principal) {
      toast.error("Completa campos obligatorios");
      return;
    }

    mutation.mutate({
      ...formData,
      productos_ids: selectedProds
    });
  };

  const prepararEdicion = (prov: any) => {
    setIsEditing(true);
    setCurrentId(prov.proveedor_id);

    setFormData({
      razon_social: prov.razon_social,
      nit: prov.nit || '',
      correo_principal: prov.correo_principal,
      telefono_principal: prov.telefono_principal || ''
    });

    setSelectedProds(prov.productos_ids || []);
    setBusquedaProducto('');
    setMostrarSelectorProductos(false);
  };

  const cancelarEdicion = () => {
    setIsEditing(false);
    setCurrentId(null);

    setFormData({
      razon_social: '',
      nit: '',
      correo_principal: '',
      telefono_principal: ''
    });

    setSelectedProds([]);
    setBusquedaProducto('');
    setMostrarSelectorProductos(false);
  };

  const productosFiltrados = listaProductos?.filter((p: any) => {
    const termino = busquedaProducto.toLowerCase();

    return (
      p.nombre_producto?.toLowerCase().includes(termino) ||
      p.codigo_barra?.toLowerCase().includes(termino)
    );
  });

  if (isLoading) return <p>Cargando proveedores...</p>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* FORMULARIO */}
      <div style={{
        backgroundColor: 'white',
        padding: '25px',
        borderRadius: '16px',
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
        borderLeft: '6px solid #2563eb'
      }}>
        <h3 style={{
          marginTop: 0,
          color: '#1e293b',
          marginBottom: '20px'
        }}>
          {isEditing ? '✏️ Editar Proveedor' : '➕ Registrar Proveedor'}
        </h3>

        <form
          onSubmit={handleSubmit}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '15px'
          }}
        >
          {[
            { label: 'Razón Social', key: 'razon_social' },
            { label: 'NIT', key: 'nit' },
            { label: 'Correo Principal', key: 'correo_principal' },
            { label: 'Teléfono Principal', key: 'telefono_principal' }
          ].map(field => (
            <div
              key={field.key}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '5px'
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
                type="text"
                value={formData[field.key as keyof typeof formData]}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    [field.key]: e.target.value
                  })
                }
                style={{
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  outline: 'none'
                }}
              />
            </div>
          ))}

          {/* PRODUCTOS RELACIONADOS COMPACTO */}
          <div style={{ gridColumn: '1/-1' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '10px',
              flexWrap: 'wrap',
              marginBottom: '8px'
            }}>
              <label style={{
                fontSize: '13px',
                fontWeight: '700',
                color: '#64748b'
              }}>
                Productos Relacionados:
              </label>

              <span style={{
                fontSize: '12px',
                backgroundColor: '#eff6ff',
                color: '#2563eb',
                padding: '4px 9px',
                borderRadius: '999px',
                fontWeight: 'bold'
              }}>
                {selectedProds.length} seleccionados
              </span>
            </div>

            <input
              type="text"
              value={busquedaProducto}
              onClick={() => setMostrarSelectorProductos(true)}
              onFocus={() => setMostrarSelectorProductos(true)}
              onChange={(e) => {
                setBusquedaProducto(e.target.value);
                setMostrarSelectorProductos(true);
              }}
              placeholder="🔍 Presiona aquí para buscar y agregar productos..."
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                outline: 'none',
                fontSize: '13px',
                boxSizing: 'border-box',
                marginBottom: mostrarSelectorProductos ? '8px' : '0'
              }}
            />

            {mostrarSelectorProductos && (
              <div style={{
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '10px',
                overflow: 'hidden',
                maxHeight: '180px',
                overflowY: 'auto'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '8px 10px',
                  backgroundColor: '#f8fafc',
                  borderBottom: '1px solid #e2e8f0'
                }}>
                  <span style={{
                    fontSize: '12px',
                    color: '#64748b',
                    fontWeight: '600'
                  }}>
                    Selecciona productos
                  </span>

                  <button
                    type="button"
                    onClick={() => setMostrarSelectorProductos(false)}
                    style={{
                      border: 'none',
                      backgroundColor: '#fee2e2',
                      color: '#ef4444',
                      borderRadius: '6px',
                      padding: '4px 8px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: 'bold'
                    }}
                  >
                    Cerrar
                  </button>
                </div>

                {productosFiltrados?.length > 0 ? (
                  productosFiltrados.map((p: any) => {
                    const seleccionado = selectedProds.includes(p.producto_id);

                    return (
                      <div
                        key={p.producto_id}
                        onClick={() => toggleProducto(p.producto_id)}
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '34px 1fr auto',
                          gap: '10px',
                          alignItems: 'center',
                          padding: '8px 10px',
                          borderBottom: '1px solid #f1f5f9',
                          cursor: 'pointer',
                          backgroundColor: seleccionado ? '#eff6ff' : '#ffffff'
                        }}
                      >
                        <div style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '7px',
                          backgroundColor: '#e2e8f0',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          overflow: 'hidden'
                        }}>
                          {p.imagen_url && !p.imagen_url.includes('via.placeholder.com') ? (
                            <img
                              src={p.imagen_url}
                              alt={p.nombre_producto}
                              style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover'
                              }}
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          ) : (
                            <span style={{ fontSize: '16px' }}>📦</span>
                          )}
                        </div>

                        <div>
                          <div style={{
                            fontWeight: '700',
                            color: '#1e293b',
                            fontSize: '13px'
                          }}>
                            {p.nombre_producto}
                          </div>

                          <div style={{
                            fontSize: '11px',
                            color: '#64748b',
                            marginTop: '2px'
                          }}>
                            Código: {p.codigo_barra || 'Sin código'} · Stock: {p.stock_total || 0}
                          </div>
                        </div>

                        <input
                          type="checkbox"
                          checked={seleccionado}
                          onChange={() => toggleProducto(p.producto_id)}
                          onClick={(e) => e.stopPropagation()}
                          style={{
                            width: '16px',
                            height: '16px',
                            cursor: 'pointer'
                          }}
                        />
                      </div>
                    );
                  })
                ) : (
                  <div style={{
                    padding: '15px',
                    textAlign: 'center',
                    color: '#64748b',
                    fontSize: '13px'
                  }}>
                    No se encontraron productos.
                  </div>
                )}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={mutation.isPending}
            style={{
              gridColumn: '1/-1',
              padding: '12px',
              backgroundColor: mutation.isPending ? '#94a3b8' : '#2563eb',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: mutation.isPending ? 'not-allowed' : 'pointer',
              fontWeight: 'bold'
            }}
          >
            {mutation.isPending
              ? 'Guardando...'
              : isEditing
                ? ' Actualizar'
                : ' Guardar'}
          </button>

          {isEditing && (
            <button
              type="button"
              onClick={cancelarEdicion}
              style={{
                gridColumn: '1/-1',
                padding: '10px',
                backgroundColor: '#94a3b8',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              Cancelar
            </button>
          )}
        </form>
      </div>

      {/* TABLA */}
      <div style={{
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '16px',
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
        overflowX: 'auto'
      }}>
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          minWidth: '600px'
        }}>
          <thead>
            <tr style={{
              textAlign: 'left',
              backgroundColor: '#f8fafc',
              borderBottom: '2px solid #e2e8f0'
            }}>
              {['Razón Social', 'NIT', 'Correo', 'Teléfono', 'Productos', 'Acciones'].map(h => (
                <th
                  key={h}
                  style={{
                    padding: '15px',
                    color: '#475569',
                    fontSize: '0.85rem'
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {proveedores?.map((prov: any) => (
              <tr
                key={prov.proveedor_id}
                style={{ borderBottom: '1px solid #f1f5f9' }}
              >
                <td style={{ padding: '15px', fontWeight: '600' }}>
                  {prov.razon_social}
                </td>

                <td style={{ padding: '15px' }}>
                  {prov.nit}
                </td>

                <td style={{ padding: '15px', color: '#2563eb' }}>
                  {prov.correo_principal}
                </td>

                <td style={{ padding: '15px' }}>
                  {prov.telefono_principal}
                </td>

                <td style={{ padding: '15px' }}>
                  {prov.productos?.map((n: string, i: number) => (
                    <span
                      key={i}
                      style={{
                        padding: '3px 8px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        backgroundColor: '#e0f2fe',
                        color: '#0369a1',
                        margin: '2px',
                        display: 'inline-block'
                      }}
                    >
                      {n}
                    </span>
                  ))}
                </td>

                <td style={{ padding: '15px' }}>
                  <button
                    onClick={() => prepararEdicion(prov)}
                    style={{
                      backgroundColor: '#f59e0b',
                      color: 'white',
                      border: 'none',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      cursor: 'pointer'
                    }}
                  >
                    ✏️ Editar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default GestionProveedores;