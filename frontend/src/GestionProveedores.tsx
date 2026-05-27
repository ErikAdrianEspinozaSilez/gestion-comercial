import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

const GestionProveedores: React.FC = () => {
  const queryClient = useQueryClient();
  
  // Estados del formulario
  const [formData, setFormData] = useState({
    razon_social: '',
    nit: '',
    correo_principal: '',
    telefono_principal: ''
  });

  const [selectedProds, setSelectedProds] = useState<number[]>([]); // Productos seleccionados

  // NUEVOS ESTADOS PARA EDICIÓN
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState<number | null>(null);

  // Obtener lista de productos
  const { data: listaProductos } = useQuery({
    queryKey: ['productos'],
    queryFn: async () => {
      const response = await axios.get('https://gestion-comercial-j3ed.onrender.com/productos');
      return response.data;
    }
  });

  // Obtener proveedores
  const { data: proveedores, isLoading } = useQuery({
    queryKey: ['proveedores'],
    queryFn: async () => {
      const response = await axios.get('https://gestion-comercial-j3ed.onrender.com/api/proveedores');
      return response.data;
    }
  });

  // MUTACIÓN: POST o PUT según isEditing
  const mutation = useMutation({
    mutationFn: (data: any) => {
      if (isEditing && currentId) {
        return axios.put(`https://gestion-comercial-j3ed.onrender.com/api/proveedores/${currentId}`, data);
      }
      return axios.post('https://gestion-comercial-j3ed.onrender.com/api/proveedores', data);
    },
    onSuccess: () => {
      alert(isEditing ? "✅ Proveedor actualizado" : "✅ Proveedor registrado");
      cancelarEdicion();
      queryClient.invalidateQueries({ queryKey: ['proveedores'] });
    },
    onError: () => {
      alert("❌ Error al guardar proveedor. Verifica el servidor.");
    }
  });

  // Toggle checkbox productos
  const toggleProducto = (id: number) => {
    setSelectedProds(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);
  };

  // ENVIAR FORMULARIO
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.razon_social || !formData.correo_principal) {
      alert("Por favor, completa los campos obligatorios.");
      return;
    }
    mutation.mutate({ ...formData, productos_ids: selectedProds });
  };

  // PREPARAR EDICIÓN
  const prepararEdicion = (prov: any) => {
    setIsEditing(true);
    setCurrentId(prov.proveedor_id);
    setFormData({
      razon_social: prov.razon_social,
      nit: prov.nit || '',
      correo_principal: prov.correo_principal,
      telefono_principal: prov.telefono_principal || ''
    });
    // Si el backend devuelve IDs de productos vinculados, los usamos
    setSelectedProds(prov.productos_ids || []);
  };

  // CANCELAR EDICIÓN
  const cancelarEdicion = () => {
    setIsEditing(false);
    setCurrentId(null);
    setFormData({ razon_social: '', nit: '', correo_principal: '', telefono_principal: '' });
    setSelectedProds([]);
  };

  if (isLoading) return <p>Cargando proveedores...</p>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      
      {/* FORMULARIO */}
      <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
        <h3 style={{ marginTop: 0, color: '#1e293b' }}>
          {isEditing ? '✏️ Editar Proveedor' : '➕ Registrar Nuevo Proveedor'}
        </h3>
        <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
          {/* Inputs */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <label style={{ fontSize: '14px', color: '#64748b' }}>Razón Social *</label>
            <input 
              type="text" 
              placeholder="Ej: Coca Cola S.A." 
              value={formData.razon_social}
              onChange={(e) => setFormData({...formData, razon_social: e.target.value})}
              style={{ padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <label style={{ fontSize: '14px', color: '#64748b' }}>NIT / Documento</label>
            <input 
              type="text" 
              placeholder="NIT del proveedor" 
              value={formData.nit}
              onChange={(e) => setFormData({...formData, nit: e.target.value})}
              style={{ padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <label style={{ fontSize: '14px', color: '#64748b' }}>Correo Electrónico *</label>
            <input 
              type="email" 
              placeholder="ventas@proveedor.com" 
              value={formData.correo_principal}
              onChange={(e) => setFormData({...formData, correo_principal: e.target.value})}
              style={{ padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <label style={{ fontSize: '14px', color: '#64748b' }}>Teléfono de Contacto</label>
            <input 
              type="text" 
              placeholder="Ej: 44223344" 
              value={formData.telefono_principal}
              onChange={(e) => setFormData({...formData, telefono_principal: e.target.value})}
              style={{ padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
            />
          </div>

          {/* Checkbox Productos */}
          <div style={{ gridColumn: 'span 2', marginTop: '10px' }}>
            <label style={{ fontSize: '14px', color: '#64748b', marginBottom: '5px', display: 'block' }}>
              Relacionar con Productos Existentes:
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', maxHeight: '150px', overflowY: 'auto', border: '1px solid #e2e8f0', padding: '10px', borderRadius: '6px', backgroundColor: '#f8fafc' }}>
              {listaProductos?.map((p: any) => (
                <label key={p.producto_id} style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                  <input 
                    type="checkbox" 
                    checked={selectedProds.includes(p.producto_id)}
                    onChange={() => toggleProducto(p.producto_id)}
                  />
                  <span>{p.nombre_producto}</span>
                </label>
              ))}
            </div>
          </div>

          <button 
            type="submit" 
            disabled={mutation.isPending}
            style={{ 
              gridColumn: 'span 2', 
              backgroundColor: isEditing ? '#f59e0b' : '#007bff', 
              color: 'white', 
              padding: '12px', 
              border: 'none', 
              borderRadius: '8px', 
              cursor: 'pointer',
              fontWeight: 'bold',
              marginTop: '10px'
            }}
          >
            {mutation.isPending ? 'Guardando...' : isEditing ? '💾 Actualizar Proveedor' : '💾 Guardar Proveedor'}
          </button>
          {isEditing && (
            <button 
              type="button"
              onClick={cancelarEdicion}
              style={{ gridColumn: 'span 2', backgroundColor: '#6b7280', color: 'white', padding: '12px', border: 'none', borderRadius: '8px', cursor: 'pointer', marginTop: '5px' }}
            >
              ❌ Cancelar Edición
            </button>
          )}
        </form>
      </div>

      {/* TABLA PROVEEDORES */}
      <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
        <h3 style={{ marginTop: 0, color: '#1e293b' }}>📋 Directorio de Proveedores</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '2px solid #f1f5f9' }}>
              <th style={{ padding: '12px', color: '#475569' }}>Razón Social</th>
              <th style={{ padding: '12px', color: '#475569' }}>NIT</th>
              <th style={{ padding: '12px', color: '#475569' }}>Correo</th>
              <th style={{ padding: '12px', color: '#475569' }}>Teléfono</th>
              <th style={{ padding: '12px', color: '#475569' }}>Productos Vinculados</th>
              <th style={{ padding: '12px', color: '#475569' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {proveedores?.map((prov: any) => (
              <tr key={prov.proveedor_id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '12px', fontWeight: '500' }}>{prov.razon_social}</td>
                <td style={{ padding: '12px', color: '#64748b' }}>{prov.nit || 'S/N'}</td>
                <td style={{ padding: '12px', color: '#007bff' }}>{prov.correo_principal}</td>
                <td style={{ padding: '12px', color: '#64748b' }}>{prov.telefono_principal || '---'}</td>
                <td style={{ padding: '12px' }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {prov.productos.map((nom: string, i: number) => (
                      <span key={i} style={{ backgroundColor: '#e0f2fe', color: '#0369a1', fontSize: '12px', padding: '2px 6px', borderRadius: '4px' }}>{nom}</span>
                    ))}
                  </div>
                </td>
                <td style={{ padding: '12px' }}>
                  <button 
                    onClick={() => prepararEdicion(prov)}
                    style={{ backgroundColor: '#ffc107', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}
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