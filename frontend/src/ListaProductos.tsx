import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import ModalComunicacion from './ModalComunicacion';

const ListaProductos: React.FC = () => {
  const queryClient = useQueryClient();
  const [isComuModalOpen, setIsComuModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  // Estados para la edición dentro del modal
  const [editData, setEditData] = useState({
    nombre_producto: '',
    precio: '',
    codigo_barra: '',
    imagen_url: ''
  });

  const { data: productos, isLoading } = useQuery({
    queryKey: ['productos'],
    queryFn: async () => {
      const response = await axios.get('http://localhost:3000/productos');
      return response.data;
    },
    refetchInterval: 2000
  });

  // MUTACIÓN: Eliminar Producto
  const deleteMutation = useMutation({
    mutationFn: (id: number) => axios.delete(`http://localhost:3000/productos/${id}`),
    onSuccess: () => {
      alert("🗑️ Producto eliminado");
      setIsDetailModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['productos'] });
    },
    onError: (err: any) => alert("❌ Error al eliminar: " + err.message)
  });

  // MUTACIÓN: Guardar Cambios (Edición)
  const updateMutation = useMutation({
    mutationFn: (data: any) => axios.put(`http://localhost:3000/productos/${selectedProduct.producto_id}`, data),
    onSuccess: () => {
      alert("✅ Cambios guardados");
      setIsDetailModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['productos'] });
    },
    onError: (err: any) => alert("❌ Error al editar: " + err.message)
  });

  const openDetails = (p: any) => {
    setSelectedProduct(p);
    setEditData({
      nombre_producto: p.nombre_producto,
      precio: p.precio || p.precio_unitario || '',
      codigo_barra: p.codigo_barra || '',
      imagen_url: p.imagen_url || ''
    });
    setIsDetailModalOpen(true);
  };

  if (isLoading) return <p>Cargando inventario...</p>;

  return (
    <div style={{ padding: '20px', backgroundColor: '#fff', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
      <h3>📦 Inventario de Productos</h3>

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ textAlign: 'left', borderBottom: '2px solid #eee' }}>
            <th style={{ padding: '10px' }}>Imagen</th>
            <th style={{ padding: '10px' }}>Código</th>
            <th style={{ padding: '10px' }}>Producto</th>
            <th style={{ padding: '10px' }}>Precio (Bs.)</th>
            <th style={{ padding: '10px' }}>Stock</th>
            <th style={{ padding: '10px' }}>Acción</th>
          </tr>
        </thead>
        <tbody>
          {productos?.map((p: any) => (
            <tr key={p.producto_id} style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: '10px' }}>
                <img src={p.imagen_url || 'https://via.placeholder.com/150'} alt="" style={{ width: '40px', height: '40px', borderRadius: '6px', objectFit: 'cover' }} />
              </td>
              <td style={{ padding: '10px', fontSize: '13px', color: '#64748b' }}>{p.codigo_barra}</td>
              <td style={{ padding: '10px', fontWeight: 'bold' }}>{p.nombre_producto}</td>
              <td style={{ padding: '10px' }}>{p.precio || p.precio_unitario}</td>
              <td style={{ padding: '10px', color: p.stock_total < 5 ? 'red' : 'green', fontWeight: 'bold' }}>
                {p.stock_total}
              </td>
              <td style={{ padding: '10px' }}>
                <button onClick={() => openDetails(p)} style={{ padding: '5px 10px', cursor: 'pointer', borderRadius: '5px', backgroundColor: '#6366f1', color: 'white', border: 'none' }}>
                  👁️ Ver producto
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* --- PESTAÑA / MODAL DE DETALLES Y EDICIÓN --- */}
      {isDetailModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '15px', width: '400px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
            <h4 style={{ margin: '0 0 15px 0' }}>Gestión de Producto</h4>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <label style={{ fontSize: '12px', color: '#666' }}>Nombre</label>
              <input type="text" value={editData.nombre_producto} onChange={(e) => setEditData({...editData, nombre_producto: e.target.value})} style={{ padding: '8px', borderRadius: '5px', border: '1px solid #ddd' }} />
              
              <label style={{ fontSize: '12px', color: '#666' }}>Precio (Bs.)</label>
              <input type="number" value={editData.precio} onChange={(e) => setEditData({...editData, precio: e.target.value})} style={{ padding: '8px', borderRadius: '5px', border: '1px solid #ddd' }} />
              
              <label style={{ fontSize: '12px', color: '#666' }}>Código de Barras</label>
              <input type="text" value={editData.codigo_barra} onChange={(e) => setEditData({...editData, codigo_barra: e.target.value})} style={{ padding: '8px', borderRadius: '5px', border: '1px solid #ddd' }} />
              
              <label style={{ fontSize: '12px', color: '#666' }}>URL Imagen</label>
              <input type="text" value={editData.imagen_url} onChange={(e) => setEditData({...editData, imagen_url: e.target.value})} style={{ padding: '8px', borderRadius: '5px', border: '1px solid #ddd' }} />
            </div>

            <div style={{ marginTop: '20px', display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              <button onClick={() => updateMutation.mutate(editData)} style={{ flex: 1, padding: '10px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>
                💾 Guardar
              </button>
              
              <button onClick={() => setIsComuModalOpen(true)} style={{ flex: 1, padding: '10px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
                📧 Pedir más
              </button>

              <button onClick={() => { if(confirm("¿Seguro que quieres eliminar este producto?")) deleteMutation.mutate(selectedProduct.producto_id) }} style={{ width: '100%', padding: '10px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', marginTop: '5px' }}>
                🗑️ Eliminar Producto
              </button>

              <button onClick={() => setIsDetailModalOpen(false)} style={{ width: '100%', padding: '8px', backgroundColor: '#f1f5f9', border: 'none', borderRadius: '5px', cursor: 'pointer', color: '#64748b' }}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Comunicación (Nodemailer) */}
      <ModalComunicacion 
        isOpen={isComuModalOpen} 
        onClose={() => setIsComuModalOpen(false)} 
        datosPredefinidos={{...selectedProduct, correo_principal: 'proveedor@test.com'}} 
        onEnviar={(data) => { console.log("Enviando...", data); setIsComuModalOpen(false); alert("Correo enviado"); }}
      />
    </div>
  );
};

export default ListaProductos;