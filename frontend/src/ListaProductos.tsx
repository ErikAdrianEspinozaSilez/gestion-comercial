import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
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
    mutationFn: (id: number) => axios.delete(`https://gestion-comercial-j3ed.onrender.com/productos/${id}`),
    onSuccess: () => {
      alert("🗑️ Producto eliminado");
      setIsDetailModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['productos'] });
    },
    onError: (err: any) => alert("❌ Error al eliminar: " + err.message)
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => axios.put(`https://gestion-comercial-j3ed.onrender.com/productos/${selectedProduct.producto_id}`, data),
    onSuccess: () => {
      alert("✅ Cambios guardados");
      setIsDetailModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['productos'] });
    },
    onError: (err: any) => alert("❌ Error al editar: " + err.message)
  });

  // 🔥 NUEVA MUTACIÓN: El cable real hacia la nube para los correos
  const emailMutation = useMutation({
    mutationFn: async (newEmail: any) => {
      const res = await axios.post(
        'https://gestion-comercial-j3ed.onrender.com/api/comunicaciones/enviar-correo',
        newEmail
      );
      return res.data;
    },
    onSuccess: () => {
      alert('✅ Notificación enviada al proveedor con éxito.');
      setIsComuModalOpen(false);
    },
    onError: (error) => {
      console.error('Error al enviar:', error);
      alert('❌ Error al enviar. Revisa la consola.');
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
    // Salvavidas: aseguramos el proveedor_id
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

  const rol = Number(user.rol_id);

  return (
    <div style={{ padding: '20px', backgroundColor: '#fff', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
      
      <h2 
        style={{ 
          margin: '0 0 20px 0', 
          color: '#1e293b', 
          fontSize: '24px', 
          fontWeight: 'bold', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          gap: '10px',
          width: '100%',
          textAlign: 'center'
        }}
      >
        📦 Inventario General
      </h2>

      <div style={{ marginBottom: '20px' }}>
        <input
          type="text"
          placeholder="🔍 Buscar por nombre o código de barras..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ width: '100%', padding: '12px 15px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '15px', boxSizing: 'border-box' }}
        />
      </div>

      <div style={{ overflowX: 'auto', width: '100%' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '2px solid #eee' }}>
              <th style={{ padding: '10px' }}>Imagen</th>
              <th style={{ padding: '10px' }}>Código</th>
              <th style={{ padding: '10px' }}>Producto</th>
              <th style={{ padding: '10px' }}>Precio (Bs.)</th>
              <th style={{ padding: '10px', color: '#475569' }}>📦 Bodega</th>
              <th style={{ padding: '10px', color: '#2563eb' }}>🛒 Estante</th>
              <th style={{ padding: '10px' }}>Stock Total</th>
              <th style={{ padding: '10px' }}>Acción</th>
            </tr>
          </thead>
          <tbody>
            {productosFiltrados?.map((p: any) => (
              <tr key={p.producto_id} style={{ borderBottom: '1px solid #eee' }}>
<td style={{ padding: '10px' }}>
  {p.imagen_url && !p.imagen_url.includes('via.placeholder.com') ? (
    <img 
      src={p.imagen_url} 
      alt="Producto" 
      style={{ width: '40px', height: '40px', borderRadius: '6px', objectFit: 'cover' }} 
      onError={(e) => {
        (e.target as HTMLImageElement).style.display = 'none';
      }}
    />
  ) : (
    <div style={{ width: '40px', height: '40px', borderRadius: '6px', backgroundColor: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }} title="Sin imagen">
      📦
    </div>
  )}
</td>                <td style={{ padding: '10px', fontSize: '13px', color: '#64748b' }}>{p.codigo_barra}</td>
                <td style={{ padding: '10px', fontWeight: 'bold' }}>{p.nombre_producto}</td>
                <td style={{ padding: '10px' }}>{p.precio}</td>
                <td style={{ padding: '10px', color: '#64748b', fontWeight: '500' }}>{p.stock_bodega || 0}</td>
                <td style={{ padding: '10px', color: '#2563eb', fontWeight: 'bold' }}>{p.stock_estante || 0}</td>
                <td style={{ padding: '10px', color: p.stock_total < 5 ? '#ef4444' : '#10b981', fontWeight: 'bold' }}>{p.stock_total || 0}</td>
                <td style={{ padding: '10px' }}>
                  <button onClick={() => openDetails(p)} style={{ padding: '5px 10px', cursor: 'pointer', borderRadius: '5px', backgroundColor: '#6366f1', color: 'white', border: 'none' }}>
                    👁️ Gestionar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

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
              
              <label style={{ fontSize: '12px', color: '#666' }}>Stock en Bodega</label>
              <input type="number" value={editData.stock_bodega} onChange={(e) => setEditData({...editData, stock_bodega: e.target.value})} style={{ padding: '8px', borderRadius: '5px', border: '1px solid #ddd' }} />
              
              <label style={{ fontSize: '12px', color: '#666' }}>Stock en Estante</label>
              <input type="number" value={editData.stock_estante} onChange={(e) => setEditData({...editData, stock_estante: e.target.value})} style={{ padding: '8px', borderRadius: '5px', border: '1px solid #ddd' }} />

              <label style={{ fontSize: '12px', color: '#666' }}>URL Imagen</label>
              <input type="text" value={editData.imagen_url} onChange={(e) => setEditData({...editData, imagen_url: e.target.value})} style={{ padding: '8px', borderRadius: '5px', border: '1px solid #ddd' }} />
            </div>

            <div style={{ marginTop: '20px', display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              
              {(rol === 1 || rol === 2) && (
                <button onClick={() => updateMutation.mutate(editData)} style={{ flex: 1, padding: '10px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>
                  💾 Guardar
                </button>
              )}
              
              <button 
                onClick={() => setIsComuModalOpen(true)} 
                disabled={emailMutation.isPending}
                style={{ flex: 1, padding: '10px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
              >
                {emailMutation.isPending ? 'Enviando...' : '📧 Pedir más'}
              </button>

              {rol === 1 && (
                <button onClick={() => { if(confirm("¿Seguro que quieres eliminar este producto?")) deleteMutation.mutate(selectedProduct.producto_id) }} style={{ width: '100%', padding: '10px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', marginTop: '5px' }}>
                  🗑️ Eliminar Producto
                </button>
              )}

              <button onClick={() => setIsDetailModalOpen(false)} style={{ width: '100%', padding: '8px', backgroundColor: '#f1f5f9', border: 'none', borderRadius: '5px', cursor: 'pointer', color: '#64748b' }}>
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
          correo_principal: selectedProduct?.correo_principal || 'cb.erik.espinoza.s@upds.net.bo',
          stock_actual: selectedProduct?.stock_total || 0,
          cantidad_actual: selectedProduct?.stock_total || 0
        }} 
        onEnviar={handleEnviarCorreo}
      />
    </div>
  );
};

export default ListaProductos;