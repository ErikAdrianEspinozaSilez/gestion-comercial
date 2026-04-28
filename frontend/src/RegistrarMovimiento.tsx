import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

const RegistrarMovimiento: React.FC = () => {
  const [productoId, setProductoId] = useState('');
  const [tipo, setTipo] = useState('ingreso_compra'); // <-- IMPORTANTE: Que coincida con el value
  const [cantidad, setCantidad] = useState(1); // Empezar en 1 para evitar el check de <= 0
  const queryClient = useQueryClient();

  // Obtenemos productos para el desplegable (Select)
  const { data: productos } = useQuery({
    queryKey: ['productos'],
    queryFn: async () => (await axios.get('http://localhost:3000/productos')).data,
  });

const mutation = useMutation({
    mutationFn: (nuevoMov: any) => axios.post('http://localhost:3000/movimientos', nuevoMov),
    onSuccess: async () => {
      // 1. Forzamos la actualización de las consultas y esperamos a que termine
      await queryClient.invalidateQueries({ queryKey: ['productos'] });
      await queryClient.invalidateQueries({ queryKey: ['movimientos'] });
      
      // 2. Limpiamos el formulario antes del alert para que se vea el cambio atrás
      setCantidad(1); 
      setProductoId(''); 

      // 3. El alert ahora no bloquea la actualización visual
      console.log("✅ Datos sincronizados con la base de datos");
    },
    onError: (error: any) => {
      alert("❌ Error: " + error.response?.data?.error);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!productoId || cantidad <= 0) return alert("Completa los datos");
    mutation.mutate({ producto_id: productoId, tipo_movimiento: tipo, cantidad });
  };

  return (
    <div style={{ padding: '20px', backgroundColor: '#fff', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
      <h3>🚀 Registrar Entrada/Salida de Stock</h3>
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <select 
          value={productoId} 
          onChange={(e) => setProductoId(e.target.value)}
          style={{ padding: '10px', borderRadius: '8px', flex: 1 }}
        >
          <option value="">Selecciona Producto...</option>
          {productos?.map((p: any) => (
            <option key={p.producto_id} value={p.producto_id}>{p.nombre_producto}</option>
          ))}
        </select>

<select value={tipo} onChange={(e) => setTipo(e.target.value)} style={{ padding: '10px', borderRadius: '8px' }}>
  <option value="ingreso_compra">Entrada (+)</option>
  <option value="salida_venta">Salida (-)</option>
</select>
        <input 
          type="number" 
          value={cantidad} 
          onChange={(e) => setCantidad(Number(e.target.value))}
          placeholder="Cantidad"
          style={{ padding: '10px', borderRadius: '8px', width: '100px' }}
        />

        <button type="submit" style={{ padding: '10px 20px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
          Registrar
        </button>
      </form>
    </div>
  );
};

export default RegistrarMovimiento;