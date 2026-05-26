import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useQueryClient } from '@tanstack/react-query';

const LectorVentas: React.FC = () => {
  const [codigo, setCodigo] = useState('');
  const [carrito, setCarrito] = useState<any[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Función para limpiar cualquier precio recibido y convertirlo en número
  const limpiarPrecio = (precio: string | number) => {
    if (typeof precio === 'number') return precio;
    if (!precio) return 0;
    // Elimina símbolos (Bs, espacios) y reemplaza coma por punto
    return parseFloat(precio.toString().replace(/[^\d.-]/g, '').replace(',', '.')) || 0;
  };

  const manejarEscaneo = async (e: React.FormEvent) => {
    e.preventDefault();
    const codigoEscaneado = codigo.trim();
    if (!codigoEscaneado) return;
    setCodigo('');

    try {
      const res = await axios.get(`http://localhost:3000/productos/buscar/${codigoEscaneado}`);
      if (res.data) {
        const precioLimpio = limpiarPrecio(res.data.precio || res.data.precio_unitario);
        const nuevoProducto = {
          ...res.data,
          id_fila_local: Date.now() + Math.random(),
          precio_venta: precioLimpio
        };
        setCarrito(prev => [...prev, nuevoProducto]);
      }
    } catch (err) {
      console.error("Producto no encontrado:", codigoEscaneado);
      alert("Producto no encontrado");
    }
  };

  // Total seguro sumando solo números válidos
  const calcularTotal = () => {
    return carrito.reduce((acum, item) => acum + (item.precio_venta || 0), 0).toFixed(2);
  };

  const eliminarProducto = (idFilaLocal: number) => {
    setCarrito(prev => prev.filter(item => item.id_fila_local !== idFilaLocal));
    inputRef.current?.focus();
  };

  const cancelarVenta = () => {
    if (window.confirm("¿Estás seguro de que quieres cancelar toda la venta?")) {
      setCarrito([]);
      setCodigo('');
      inputRef.current?.focus();
    }
  };

  const finalizarVenta = async () => {
    if (carrito.length === 0) return;
    try {
      const res = await axios.post('http://localhost:3000/productos/finalizar-venta', { productos: carrito });
      if (res.status === 200) {
        alert("✅ Venta exitosa");
        setCarrito([]);
queryClient.invalidateQueries({ queryKey: ['dashboard-ventas'] });
queryClient.invalidateQueries({ queryKey: ['movimientos'] });
queryClient.invalidateQueries({ queryKey: ['productos'] });        setTimeout(() => inputRef.current?.focus(), 100);
      }
    } catch (err) {
      console.error(err);
      alert("❌ Error al finalizar la venta");
    }
  };

  return (
    <div style={{ padding: 20, background: '#fff', borderRadius: 12, boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
      <h3 style={{ margin: '0 0 15px 0', color: '#1e293b' }}>🛒 Terminal de Venta (Lector Activo)</h3>
      <form onSubmit={manejarEscaneo}>
        <input
          ref={inputRef}
          type="text"
          value={codigo}
          onChange={e => setCodigo(e.target.value)}
          placeholder="Escanee el código de barras aquí..."
          style={{
            width: '100%',
            padding: 15,
            fontSize: 18,
            borderRadius: 8,
            border: '2px solid #3b82f6',
            backgroundColor: '#000000',
            fontWeight: 'bold',
            outline: 'none',
            boxSizing: 'border-box'
          }}
        />
      </form>

      {carrito.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', borderRadius: 8, overflow: 'hidden', backgroundColor: '#f8fafc' }}>
            <thead style={{ backgroundColor: '#1e293b', color: '#fff' }}>
              <tr>
                <th style={{ textAlign: 'center', padding: 12 }}>#</th>
                <th style={{ textAlign: 'left', padding: 12 }}>Producto</th>
                <th style={{ textAlign: 'right', padding: 12 }}>Precio</th>
                <th style={{ textAlign: 'center', padding: 12 }}>Quitar</th>
              </tr>
            </thead>
            <tbody>
              {carrito.map((item, index) => (
                <tr key={item.id_fila_local} style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: 12, textAlign: 'center', fontWeight: 'bold', color: '#64748b' }}>{index + 1}</td>
                  <td style={{ padding: 12, fontWeight: 500, color: '#333' }}>{item.nombre_producto}</td>
                  <td style={{ padding: 12, textAlign: 'right', fontWeight: 'bold', color: '#10b981' }}>
                    Bs. {item.precio_venta.toFixed(2)}
                  </td>
                  <td style={{ textAlign: 'center', padding: 12 }}>
                    <button
                      onClick={() => eliminarProducto(item.id_fila_local)}
                      style={{ backgroundColor: '#ef4444', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', padding: '6px 12px', fontWeight: 'bold' }}
                    >
                      X
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ textAlign: 'right', marginTop: 20, fontSize: '1.5rem', fontWeight: 'bold', color: '#10b981', background: '#f0fdf4', padding: 15, borderRadius: 8, border: '1px solid #bbf7d0' }}>
            TOTAL A COBRAR: Bs. {calcularTotal()}
          </div>

          <div style={{ display: 'flex', gap: 15, marginTop: 20 }}>
            <button
              onClick={cancelarVenta}
              style={{ flex: 1, padding: 15, backgroundColor: '#94a3b8', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold' }}
            >
              Vaciar Carrito
            </button>

            <button
              onClick={finalizarVenta}
              style={{ flex: 2, padding: 15, backgroundColor: '#10b981', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold', fontSize: '1.2rem', boxShadow: '0 4px 6px rgba(16,185,129,0.3)' }}
            >
              💸 FINALIZAR VENTA
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LectorVentas;