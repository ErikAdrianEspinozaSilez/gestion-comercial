import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { toast } from 'react-hot-toast';

const GestionUsuarios: React.FC = () => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({ nombre_completo: '', usuario_login: '', correo: '', password: '', rol_id: 3 });

  const { data: usuarios, isLoading } = useQuery({
    queryKey: ['usuarios'],
    queryFn: async () => (await axios.get('https://gestion-comercial-j3ed.onrender.com/usuarios')).data
  });

  const createMutation = useMutation({
    mutationFn: (nuevoUsuario: any) => axios.post('https://gestion-comercial-j3ed.onrender.com/usuarios', nuevoUsuario),
    onSuccess: () => {
      toast.success("✅ Usuario registrado");
      setFormData({ nombre_completo: '', usuario_login: '', correo: '', password: '', rol_id: 3 });
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
    },
    onError: (err: any) => toast.error("Error al crear usuario")
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => axios.delete(`https://gestion-comercial-j3ed.onrender.com/usuarios/${id}`),
    onSuccess: () => {
      toast.success("Usuario dado de baja");
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
    }
  });

  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); createMutation.mutate(formData); };

  if (isLoading) return <p>Cargando panel...</p>;

  // Estilos de inputs unificados
  const inputStyle = { padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', width: '100%', boxSizing: 'border-box' as const };

  return (
    <div style={{ padding: '20px' }}>
      <h2 style={{ marginBottom: '25px', color: '#1e293b', fontWeight: '800' }}>👥 Gestión de Usuarios</h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '25px' }}>
        
        {/* FORMULARIO */}
        <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', borderLeft: '6px solid #2563eb' }}>
          <h3 style={{ marginTop: 0, color: '#1e293b', marginBottom: '20px' }}>Nuevo Usuario</h3>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <input required placeholder="Nombre Completo" value={formData.nombre_completo} onChange={(e) => setFormData({...formData, nombre_completo: e.target.value})} style={inputStyle} />
            <input required placeholder="Usuario (Login)" value={formData.usuario_login} onChange={(e) => setFormData({...formData, usuario_login: e.target.value})} style={inputStyle} />
            <input required type="email" placeholder="Correo" value={formData.correo} onChange={(e) => setFormData({...formData, correo: e.target.value})} style={inputStyle} />
            <input required type="password" placeholder="Contraseña" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} style={inputStyle} />
            <select value={formData.rol_id} onChange={(e) => setFormData({...formData, rol_id: Number(e.target.value)})} style={inputStyle}>
              <option value={1}>Administrador</option>
              <option value={2}>Encargado</option>
              <option value={3}>Empleado</option>
            </select>
            <button type="submit" style={{ padding: '12px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
              {createMutation.isPending ? 'Guardando...' : '➕ Registrar Usuario'}
            </button>
          </form>
        </div>

        {/* TABLA */}
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '500px' }}>
            <thead>
              <tr style={{ textAlign: 'left', backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                {['Nombre', 'Credenciales', 'Rol', 'Acción'].map(h => <th key={h} style={{ padding: '16px', color: '#64748b', fontSize: '0.8rem', textTransform: 'uppercase' }}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {usuarios?.map((u: any) => (
                <tr key={u.usuario_id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '12px', fontWeight: 'bold', color: '#1e293b' }}>{u.nombre_completo}</td>
                  <td style={{ padding: '12px', fontSize: '0.85rem' }}><div>@{u.usuario_login}</div><div style={{ color: '#94a3b8' }}>{u.correo}</div></td>
                  <td style={{ padding: '12px' }}>
                    <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 'bold', backgroundColor: Number(u.rol_id) === 1 ? '#fee2e2' : '#dcfce7', color: Number(u.rol_id) === 1 ? '#991b1b' : '#166534' }}>
                      {Number(u.rol_id) === 1 ? 'Admin' : 'Empleado'}
                    </span>
                  </td>
                  <td style={{ padding: '12px' }}>
                    <button onClick={() => { if(confirm("¿Dar de baja?")) deleteMutation.mutate(u.usuario_id) }} style={{ padding: '6px 10px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem' }}>Baja</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default GestionUsuarios;