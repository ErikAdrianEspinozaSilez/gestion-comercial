import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

const LectorVentas: React.FC = () => {
  const [codigo, setCodigo] = useState('');
  const [busquedaManual, setBusquedaManual] = useState('');
  const [carrito, setCarrito] = useState<any[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  // 🔥 Mantener el foco en el escáner siempre que sea posible
  useEffect(() => {
    inputRef.current?.focus();
  }, [carrito]);

  // 🔥 Consulta a la BD para tener todos los productos listos para la Búsqueda Manual
  const { data: productosInventario } = useQuery({
    queryKey: ['productos-venta-manual'],
    queryFn: async () => {
      const res = await axios.get('https://gestion-comercial-j3ed.onrender.com/productos');
      return res.data;
    }
  });

  const limpiarPrecio = (precio: string | number) => {
    if (typeof precio === 'number') return precio;
    if (!precio) return 0;
    return parseFloat(precio.toString().replace(/[^\d.-]/g, '').replace(',', '.')) || 0;
  };

  // 🔥 Función Maestra para agregar productos
  const agregarAlCarrito = (productoBD: any) => {
    const precioLimpio = limpiarPrecio(productoBD.precio || productoBD.precio_unitario);

    setCarrito(prev => {
      const existe = prev.find(item => item.producto_id === productoBD.producto_id);

      if (existe) {
        return prev.map(item =>
          item.producto_id === productoBD.producto_id
            ? { ...item, cantidad: item.cantidad + 1 }
            : item
        );
      }

      return [...prev, { ...productoBD, precio_venta: precioLimpio, cantidad: 1 }];
    });

    toast.success(`${productoBD.nombre_producto || 'Producto'} agregado al carrito`);

    setBusquedaManual('');
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  // 🔥 Disparador del Lector de Barras
  const manejarEscaneo = async (e: React.FormEvent) => {
    e.preventDefault();

    const codigoEscaneado = codigo.trim();

    if (!codigoEscaneado) return;

    setCodigo('');

    try {
      const res = await axios.get(`https://gestion-comercial-j3ed.onrender.com/productos/buscar/${codigoEscaneado}`);

      if (res.data) {
        agregarAlCarrito(res.data);
      }
    } catch (err) {
      console.error("Producto no encontrado:", codigoEscaneado);
      toast.error("Producto no encontrado en la base de datos.");
      inputRef.current?.focus();
    }
  };

  // 🔥 Controles del Carrito
  const modificarCantidad = (id: number, delta: number) => {
    setCarrito(prev =>
      prev.map(item => {
        if (item.producto_id === id) {
          const nuevaCantidad = item.cantidad + delta;
          return { ...item, cantidad: nuevaCantidad > 0 ? nuevaCantidad : 1 };
        }

        return item;
      })
    );

    inputRef.current?.focus({ preventScroll: true });
  };

  const eliminarProducto = (id: number) => {
    setCarrito(prev => prev.filter(item => item.producto_id !== id));
    toast.success("Producto eliminado del carrito");
    inputRef.current?.focus({ preventScroll: true });
  };

  const cancelarVenta = () => {
    if (window.confirm("⚠️ ¿Estás seguro de cancelar toda la venta?")) {
      setCarrito([]);
      setCodigo('');
      setBusquedaManual('');
      toast.success("Venta cancelada correctamente");
      inputRef.current?.focus();
    }
  };

  const calcularTotal = () => {
    return carrito
      .reduce((acum, item) => acum + (item.precio_venta * item.cantidad), 0)
      .toFixed(2);
  };

  const finalizarVenta = async () => {
    if (carrito.length === 0) {
      toast.error("El carrito está vacío.");
      return;
    }

    try {
      await axios.post('https://gestion-comercial-j3ed.onrender.com/productos/finalizar-venta', {
        productos: carrito
      });

      toast.success("¡Venta registrada con éxito!");

      setCarrito([]);

      queryClient.invalidateQueries({ queryKey: ['dashboard-ventas'] });
      queryClient.invalidateQueries({ queryKey: ['movimientos'] });
      queryClient.invalidateQueries({ queryKey: ['productos'] });
      queryClient.invalidateQueries({ queryKey: ['productos-venta-manual'] });

      setTimeout(() => inputRef.current?.focus(), 100);
    } catch (err) {
      console.error(err);
      toast.error("Error al finalizar la venta. Revisa la consola.");
    }
  };

  // Filtro inteligente para la búsqueda manual
  const productosFiltrados = productosInventario?.filter((p: any) => {
    if (!busquedaManual) return false;

    const termino = busquedaManual.toLowerCase();

    return (
      p.nombre_producto?.toLowerCase().includes(termino) ||
      p.codigo_barra?.toLowerCase().includes(termino)
    );
  }).slice(0, 5);

  return (
    <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', alignItems: 'flex-start' }}>

      {/* 🚀 LADO IZQUIERDO: CONTROLES DE ENTRADA */}
      <div style={{ flex: '1 1 350px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

        {/* LECTOR AUTOMÁTICO */}
        <div style={{
          background: '#fff',
          padding: '20px',
          borderRadius: '12px',
          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{
            margin: '0 0 15px 0',
            color: '#1e293b',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
             Lector de Código de Barras
          </h3>

          <form onSubmit={manejarEscaneo}>
            <input
              ref={inputRef}
              type="text"
              value={codigo}
              onChange={e => setCodigo(e.target.value)}
              placeholder="Escanea aquí..."
              style={{
                width: '100%',
                padding: '18px',
                fontSize: '20px',
                borderRadius: '8px',
                border: '2px solid #3b82f6',
                backgroundColor: '#0f172a',
                color: '#38bdf8',
                fontWeight: 'bold',
                outline: 'none',
                boxSizing: 'border-box',
                textAlign: 'center',
                letterSpacing: '2px'
              }}
            />
          </form>
        </div>

        {/* BÚSQUEDA MANUAL */}
        <div style={{
          background: '#fff',
          padding: '20px',
          borderRadius: '12px',
          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{
            margin: '0 0 15px 0',
            color: '#1e293b',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '16px'
          }}>
             Búsqueda Manual (Contingencia)
          </h3>

          <input
            type="text"
            value={busquedaManual}
            onChange={e => setBusquedaManual(e.target.value)}
            placeholder="🔍 Escribe el nombre o código..."
            style={{
              width: '100%',
              padding: '12px',
              fontSize: '15px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />

          {busquedaManual && (
            <div style={{
              marginTop: '10px',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              overflow: 'hidden'
            }}>
              {productosFiltrados?.length > 0 ? (
                productosFiltrados.map((p: any) => (
                  <div
                    key={p.producto_id}
                    onClick={() => agregarAlCarrito(p)}
                    style={{
                      padding: '12px',
                      borderBottom: '1px solid #e2e8f0',
                      backgroundColor: '#f8fafc',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 'bold', color: '#334155', fontSize: '14px' }}>
                        {p.nombre_producto}
                      </div>

                      <div style={{ fontSize: '12px', color: '#64748b' }}>
                        Stock: {p.stock_total || 0}
                      </div>
                    </div>

                    <div style={{ fontWeight: 'bold', color: '#10b981' }}>
                      Bs. {limpiarPrecio(p.precio).toFixed(2)}
                    </div>
                  </div>
                ))
              ) : (
                <div style={{
                  padding: '12px',
                  textAlign: 'center',
                  color: '#64748b',
                  fontSize: '14px'
                }}>
                  No hay resultados
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 🧾 PANEL DERECHO: TICKET ESTILO RETAIL */}
      <div style={{
        flex: '2 1 500px',
        background: '#ffffff',
        padding: '25px',
        borderRadius: '16px',
        boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)',
        border: '1px solid #e2e8f0',
        display: 'flex',
        flexDirection: 'column',
        minHeight: '600px'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px'
        }}>
          <h2 style={{ margin: 0, color: '#0f172a' }}>
             Carrito de Ventas
          </h2>

          <span style={{
            backgroundColor: '#eff6ff',
            color: '#1d4ed8',
            padding: '5px 12px',
            borderRadius: '20px',
            fontWeight: 'bold'
          }}>
            {carrito.length} Items
          </span>
        </div>

        {carrito.length === 0 ? (
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            color: '#94a3b8'
          }}>
            <div style={{ fontSize: '64px', marginBottom: '15px' }}>
              🛒
            </div>

            <p style={{ fontSize: '18px' }}>
              Esperando productos...
            </p>
          </div>
        ) : (
          <div style={{
            flex: 1,
            overflowY: 'auto',
            borderTop: '2px solid #f1f5f9'
          }}>
            {carrito.map((item) => (
              <div
                key={item.producto_id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '2fr 1fr 1fr',
                  alignItems: 'center',
                  padding: '16px 0',
                  borderBottom: '1px solid #f1f5f9',
                  gap: '10px'
                }}
              >
                {/* Columna Nombre */}
                <div>
                  <div style={{ fontWeight: 'bold', color: '#1e293b' }}>
                    {item.nombre_producto}
                  </div>

                  <div style={{ fontSize: '12px', color: '#64748b' }}>
                    Bs. {item.precio_venta.toFixed(2)} c/u
                  </div>
                </div>

                {/* Columna Cantidad */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}>
                  <button
                    onClick={() => modificarCantidad(item.producto_id, -1)}
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '6px',
                      border: 'none',
                      background: '#e2e8f0',
                      color: '#0f172a',
                      cursor: 'pointer',
                      fontWeight: 'bold'
                    }}
                  >
                    -
                  </button>

                  <span style={{
                    fontWeight: 'bold',
                    width: '20px',
                    textAlign: 'center'
                  }}>
                    {item.cantidad}
                  </span>

                  <button
                    onClick={() => modificarCantidad(item.producto_id, 1)}
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '6px',
                      border: 'none',
                      background: '#3b82f6',
                      color: 'white',
                      cursor: 'pointer',
                      fontWeight: 'bold'
                    }}
                  >
                    +
                  </button>
                </div>

                {/* Columna Subtotal y Eliminar */}
                <div style={{
                  textAlign: 'right',
                  fontWeight: 'bold',
                  color: '#059669'
                }}>
                  Bs. {(item.precio_venta * item.cantidad).toFixed(2)}

                  <button
                    onClick={() => eliminarProducto(item.producto_id)}
                    style={{
                      marginLeft: '15px',
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#ef4444',
                      fontSize: '16px'
                    }}
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TOTAL Y ACCIONES */}
        <div style={{
          marginTop: '20px',
          borderTop: '2px solid #e2e8f0',
          paddingTop: '20px'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px'
          }}>
            <span style={{ fontSize: '18px', color: '#475569' }}>
              TOTAL
            </span>

            <span style={{
              fontSize: '32px',
              fontWeight: 'bold',
              color: '#0f172a'
            }}>
              Bs. {calcularTotal()}
            </span>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={cancelarVenta}
              disabled={carrito.length === 0}
              style={{
                flex: 1,
                padding: '15px',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                background: 'transparent',
                fontWeight: 'bold',
                cursor: carrito.length === 0 ? 'not-allowed' : 'pointer',
                color: carrito.length === 0 ? '#94a3b8' : '#ef4444'
              }}
            >
              Cancelar
            </button>

            <button
              onClick={finalizarVenta}
              disabled={carrito.length === 0}
              style={{
                flex: 2,
                padding: '15px',
                background: carrito.length === 0 ? '#94a3b8' : '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 'bold',
                cursor: carrito.length === 0 ? 'not-allowed' : 'pointer',
                fontSize: '16px'
              }}
            >
              FINALIZAR VENTA
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LectorVentas;