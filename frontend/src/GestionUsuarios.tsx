import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

const GestionUsuarios: React.FC = () => {
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({ 
    nombre_completo: '', 
    usuario_login: '', 
    correo: '', 
    password: '', 
    rol_id: 3 
  });

  const { data: usuarios, isLoading } = useQuery({
    queryKey: ['usuarios'],
    queryFn: async () => {
      const res = await axios.get('http://localhost:3000/usuarios');
      return res.data;
    }
  });

  const createMutation = useMutation({
    mutationFn: (nuevoUsuario: any) => axios.post('http://localhost:3000/usuarios', nuevoUsuario),
    onSuccess: () => {
      alert("✅ Usuario registrado exitosamente");
      setFormData({ nombre_completo: '', usuario_login: '', correo: '', password: '', rol_id: 3 });
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
    },
    onError: (err: any) => alert("❌ Error al crear usuario: " + err.message)
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => axios.delete(`http://localhost:3000/usuarios/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  if (isLoading) return <p>Cargando panel de usuarios...</p>;

  return (
    <div style={{ padding: '20px', backgroundColor: '#fff', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
      <h2 style={{ margin: '0 0 20px 0', color: '#1e293b', fontSize: '24px', fontWeight: 'bold' }}>
        👥 Gestión de Usuarios
      </h2>

      {/* AQUÍ ESTÁ LA MAGIA RESPONSIVA: flexWrap hace que se apilen en celular */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '30px' }}>
        
        {/* FORMULARIO DE CREACIÓN */}
        {/* flex: '1 1 300px' significa: crece, encógete, pero no midas menos de 300px */}
        <div style={{ flex: '1 1 300px', backgroundColor: '#f8fafc', padding: '20px', borderRadius: '10px', border: '1px solid #e2e8f0', height: 'fit-content' }}>
          <h3 style={{ margin: '0 0 15px 0', color: '#334155', fontSize: '16px' }}>Nuevo Usuario</h3>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <input required placeholder="Nombre Completo" value={formData.nombre_completo} onChange={(e) => setFormData({...formData, nombre_completo: e.target.value})} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
            <input required placeholder="Usuario (Login)" value={formData.usuario_login} onChange={(e) => setFormData({...formData, usuario_login: e.target.value})} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
            
            <input required type="email" placeholder="Correo Electrónico" value={formData.correo} onChange={(e) => setFormData({...formData, correo: e.target.value})} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
            
            <input required type="password" placeholder="Contraseña" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
            
            <select value={formData.rol_id} onChange={(e) => setFormData({...formData, rol_id: Number(e.target.value)})} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
              <option value={1}>Administrador (Control Total)</option>
              <option value={2}>Encargado (Inventario)</option>
              <option value={3}>Empleado (Cajero)</option>
            </select>
            
            <button type="submit" style={{ padding: '12px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', marginTop: '5px' }}>
              ➕ Registrar Usuario
            </button>
          </form>
        </div>

        {/* LISTA DE USUARIOS */}
        {/* minWidth: 0 evita que la tabla rompa el contenedor en pantallas pequeñas */}
        <div style={{ flex: '2 1 400px', minWidth: 0 }}>
          {/* overflowX: 'auto' permite deslizar la tabla en celular */}
          <div style={{ overflowX: 'auto' }}>
            {/* minWidth: '600px' fuerza a la tabla a mantener su forma, creando el scroll */}
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
                  <th style={{ padding: '12px 10px' }}>ID</th>
                  <th style={{ padding: '12px 10px' }}>Nombre</th>
                  <th style={{ padding: '12px 10px' }}>Credenciales</th>
                  <th style={{ padding: '12px 10px' }}>Rol</th>
                  <th style={{ padding: '12px 10px' }}>Acción</th>
                </tr>
              </thead>
              <tbody>
                {usuarios?.map((u: any) => (
                  <tr key={u.usuario_id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px 10px', color: '#64748b' }}>#{u.usuario_id}</td>
                    <td style={{ padding: '12px 10px', fontWeight: 'bold', color: '#1e293b' }}>{u.nombre_completo}</td>
                    {/* wordBreak: 'break-all' ARREGLA EL ERROR DEL CORREO LARGO */}
                    <td style={{ padding: '12px 10px', wordBreak: 'break-all', maxWidth: '200px' }}>
                      <div style={{ color: '#3b82f6', fontWeight: '500' }}>@{u.usuario_login}</div>
                      <div style={{ fontSize: '11px', color: '#94a3b8' }}>{u.correo}</div>
                    </td>
                    <td style={{ padding: '12px 10px' }}>
                      <span style={{ 
                        padding: '4px 10px', 
                        borderRadius: '20px', 
                        fontSize: '11px', 
                        fontWeight: 'bold', 
                        textTransform: 'uppercase', 
                        backgroundColor: Number(u.rol_id) === 1 ? '#fee2e2' : Number(u.rol_id) === 2 ? '#fef3c7' : '#d1fae5', 
                        color: Number(u.rol_id) === 1 ? '#ef4444' : Number(u.rol_id) === 2 ? '#d97706' : '#059669' 
                      }}>
                        {Number(u.rol_id) === 1 ? 'Admin' : Number(u.rol_id) === 2 ? 'Encargado' : 'Empleado'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 10px' }}>
                      <button onClick={() => { if(confirm(`¿Seguro que quieres dar de baja a ${u.nombre_completo}?`)) deleteMutation.mutate(u.usuario_id) }} style={{ padding: '6px 12px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '12px' }}>
                        Baja
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GestionUsuarios;
