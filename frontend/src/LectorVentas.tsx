import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useQueryClient } from '@tanstack/react-query';

const LectorVentas: React.FC = () => {
  const [codigo, setCodigo] = useState('');
  const [carrito, setCarrito] = useState<any[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Instanciamos el cliente de consultas de React Query
  const queryClient = useQueryClient();

  // Mantiene el foco en el input para que al usar el lector físico funcione siempre
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const manejarEscaneo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!codigo.trim()) return;

    try {
      const res = await axios.get(`http://localhost:3000/productos/buscar/${codigo}`);
      if (res.data) {
        setCarrito([...carrito, { ...res.data, cantidad: 1 }]);
        setCodigo('');
      }
    } catch (err) {
      alert("Producto no encontrado en Super Valle");
      setCodigo('');
    }
  };

  // Función para finalizar la venta
  const finalizarVenta = async () => {
    if (carrito.length === 0) return;

    try {
      const res = await axios.post('http://localhost:3000/productos/finalizar-venta', { productos: carrito });
      if (res.status === 200) {
        alert("✅ Venta exitosa");
        setCarrito([]); // Limpiar carrito
        
        // Refrescamos las consultas de estadísticas y movimientos
        queryClient.invalidateQueries({ queryKey: ['stats-dashboard'] });
        queryClient.invalidateQueries({ queryKey: ['movimientos'] });
      }
    } catch (err) {
      console.error(err);
      alert("❌ Error al finalizar la venta");
    }
  };

  // Eliminar un solo producto del carrito
  const eliminarProducto = (indexAEliminar: number) => {
    setCarrito(prevCarrito => prevCarrito.filter((_, index) => index !== indexAEliminar));
  };

  // Limpiar toda la venta (Cancelar)
  const cancelarVenta = () => {
    if (window.confirm("¿Estás seguro de que quieres cancelar toda la venta?")) {
      setCarrito([]);
      setCodigo('');
    }
  };

  return (
    <div style={{ padding: '20px', background: '#f8f9fa', borderRadius: '12px', marginBottom: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
      <h3 style={{ marginTop: 0 }}>🛒 Registro de Venta (Lector)</h3>
      <form onSubmit={manejarEscaneo}>
        <input
          ref={inputRef}
          type="text"
          value={codigo}
          onChange={(e) => setCodigo(e.target.value)}
          placeholder="Escanee o escriba el código del producto..."
          style={{ 
            width: '100%', 
            padding: '15px', 
            fontSize: '18px', 
            borderRadius: '8px', 
            border: '2px solid #007bff',
            boxSizing: 'border-box'
          }}
        />
      </form>

      {carrito.length > 0 && (
        <div style={{ marginTop: '20px' }}>
          <h4>Detalle de Venta</h4>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #ddd' }}>
                <th style={{ textAlign: 'left', padding: '8px' }}>Producto</th>
                <th style={{ textAlign: 'right', padding: '8px' }}>Precio</th>
                <th style={{ textAlign: 'center', padding: '8px' }}>Eliminar</th>
              </tr>
            </thead>
            <tbody>
              {carrito.map((item, index) => (
                <tr key={index} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '8px' }}>{item.nombre_producto}</td>
                  <td style={{ padding: '8px', textAlign: 'right' }}>{item.precio_unitario} Bs.</td>
                  <td style={{ textAlign: 'center', padding: '8px' }}>
                    <button 
                      onClick={() => eliminarProducto(index)}
                      style={{ 
                        backgroundColor: '#ff4d4d', 
                        color: 'white', 
                        border: 'none', 
                        borderRadius: '4px', 
                        cursor: 'pointer', 
                        padding: '5px 10px' 
                      }}
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Total a Pagar actualizado */}
          <div style={{ textAlign: 'right', marginTop: '15px', fontSize: '1.2rem', fontWeight: 'bold', color: '#2c3e50' }}>
            Total a Pagar: {
              carrito.reduce((acc, item) => {
                const precio = parseFloat(item.precio_unitario) || 0;
                return acc + precio;
              }, 0).toFixed(2)
            } Bs.
          </div>

          {/* Botones de Cancelar y Finalizar Venta */}
          <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
            <button 
              onClick={cancelarVenta}
              style={{ 
                flex: 1, 
                padding: '12px', 
                backgroundColor: '#6c757d', // Gris para cancelar
                color: 'white', 
                border: 'none', 
                borderRadius: '8px', 
                cursor: 'pointer' 
              }}
            >
              Cancelar Todo
            </button>

            <button 
              onClick={finalizarVenta}
              style={{ 
                flex: 2, 
                padding: '12px', 
                backgroundColor: '#28a745', // Verde para vender
                color: 'white', 
                border: 'none', 
                borderRadius: '8px', 
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              Finalizar Venta
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LectorVentas;