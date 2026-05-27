import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

const RegistrarMovimiento: React.FC = () => {
  const [productoId, setProductoId] = useState('');
  const [tipo, setTipo] = useState('ingreso_compra'); 
  const [cantidad, setCantidad] = useState(1); 
  const queryClient = useQueryClient();

  const { data: productos } = useQuery({
    queryKey: ['productos'],
    queryFn: async () => (await axios.get('https://gestion-comercial-j3ed.onrender.com/productos')).data,
  });

  const mutation = useMutation({
    mutationFn: (nuevoMov: any) => axios.post('https://gestion-comercial-j3ed.onrender.com/movimientos', nuevoMov),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['productos'] });
      await queryClient.invalidateQueries({ queryKey: ['movimientos'] });
      
      setCantidad(1); 
      setProductoId(''); 
      alert("✅ Movimiento registrado correctamente");
    },
    onError: (error: any) => {
      alert("❌ Error: " + error.response?.data?.error);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!productoId || cantidad <= 0) return alert("Completa los datos correctamente");
    
    // Validar visualmente qué estamos haciendo antes de enviarlo
    const msg = tipo === 'traspaso_estante' 
      ? `¿Confirmas mover ${cantidad} unidades a los estantes de la tienda?` 
      : `¿Confirmas este registro de inventario?`;
      
    if(window.confirm(msg)) {
      mutation.mutate({ producto_id: productoId, tipo_movimiento: tipo, cantidad });
    }
  };

  return (
    <div style={{ padding: '20px', backgroundColor: '#fff', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', borderTop: '4px solid #3b82f6' }}>
      <h3 style={{ marginTop: 0, color: '#1e293b' }}>📦 Gestión Rápida de Stock</h3>
      <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '15px' }}>
        Registra compras o mueve mercadería al área de ventas.
      </p>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        
        <select 
          value={productoId} 
          onChange={(e) => setProductoId(e.target.value)}
          style={{ padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', width: '100%', fontSize: '14px' }}
        >
          <option value="">-- Selecciona un Producto --</option>
          {productos?.map((p: any) => (
            <option key={p.producto_id} value={p.producto_id}>
              {p.nombre_producto} (Bodega: {p.stock_bodega || 0} | Estante: {p.stock_estante || 0})
            </option>
          ))}
        </select>

        <div style={{ display: 'flex', gap: '10px' }}>
          <select 
            value={tipo} 
            onChange={(e) => setTipo(e.target.value)} 
            style={{ padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', flex: 2, fontSize: '14px' }}
          >
            <option value="ingreso_compra">📥 Comprar (Entra a Bodega)</option>
            <option value="traspaso_estante">🔄 Mover a Estante (Tienda)</option>
            <option value="salida_venta">📉 Ajuste / Pérdida (-)</option>
          </select>
          
          <input 
            type="number" 
            value={cantidad} 
            onChange={(e) => setCantidad(Number(e.target.value))}
            min="1"
            placeholder="Cant."
            style={{ padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', flex: 1, fontSize: '14px' }}
          />
        </div>

        <button 
          type="submit" 
          style={{ 
            padding: '12px', 
            backgroundColor: tipo === 'traspaso_estante' ? '#3b82f6' : '#10b981', 
            color: 'white', 
            border: 'none', 
            borderRadius: '8px', 
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '15px',
            transition: 'background-color 0.3s'
          }}
        >
          {tipo === 'traspaso_estante' ? '🔄 Confirmar Traspaso' : '💾 Guardar Registro'}
        </button>
      </form>
    </div>
  );
};

export default RegistrarMovimiento;