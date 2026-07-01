import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { Toaster, toast } from 'react-hot-toast';

const GestionUsuarios: React.FC = () => {
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    nombre_completo: '',
    usuario_login: '',
    password: '',
    rol_id: 3
  });

  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState<any>(null);

  const { data: usuarios, isLoading } = useQuery({
    queryKey: ['usuarios'],
    queryFn: async () =>
      (await axios.get('https://gestion-comercial-j3ed.onrender.com/usuarios')).data
  });

  const createMutation = useMutation({
    mutationFn: (nuevoUsuario: any) =>
      axios.post('https://gestion-comercial-j3ed.onrender.com/usuarios', nuevoUsuario),

    onSuccess: () => {
      toast.success('Usuario registrado correctamente', {
        icon: '✅',
        duration: 3000,
        style: {
          borderRadius: '12px',
          background: '#dcfce7',
          color: '#166534',
          fontWeight: '600'
        }
      });

      setFormData({
        nombre_completo: '',
        usuario_login: '',
        password: '',
        rol_id: 3
      });

      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
    },

    onError: (err: any) => {
      const mensaje =
        err.response?.data?.error ||
        err.response?.data?.message ||
        'No se pudo crear el usuario';

      toast.error(mensaje, {
        icon: '⚠️',
        duration: 3500,
        style: {
          borderRadius: '12px',
          background: '#fee2e2',
          color: '#991b1b',
          fontWeight: '600'
        }
      });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number | string) =>
      axios.delete(`https://gestion-comercial-j3ed.onrender.com/usuarios/${id}`),

    onSuccess: () => {
      toast.success('Usuario dado de baja correctamente', {
        icon: '🗑️',
        duration: 3000,
        style: {
          borderRadius: '12px',
          background: '#dcfce7',
          color: '#166534',
          fontWeight: '600'
        }
      });

      setUsuarioSeleccionado(null);
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
    },

    onError: () => {
      toast.error('No se pudo dar de baja al usuario', {
        icon: '⚠️',
        duration: 3000,
        style: {
          borderRadius: '12px',
          background: '#fee2e2',
          color: '#991b1b',
          fontWeight: '600'
        }
      });
    }
  });

  const activarMutation = useMutation({
    mutationFn: (id: number | string) =>
      axios.put(`https://gestion-comercial-j3ed.onrender.com/usuarios/${id}/activar`),

    onSuccess: () => {
      toast.success('Usuario activado correctamente', {
        icon: '✅',
        duration: 3000,
        style: {
          borderRadius: '12px',
          background: '#dcfce7',
          color: '#166534',
          fontWeight: '600'
        }
      });

      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
    },

    onError: () => {
      toast.error('No se pudo activar el usuario', {
        icon: '⚠️',
        duration: 3000,
        style: {
          borderRadius: '12px',
          background: '#fee2e2',
          color: '#991b1b',
          fontWeight: '600'
        }
      });
    }
  });

  const mostrarAlertaError = (mensaje: string) => {
    toast.error(mensaje, {
      icon: '⚠️',
      duration: 3500,
      style: {
        borderRadius: '12px',
        background: '#fee2e2',
        color: '#991b1b',
        fontWeight: '600'
      }
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const nombre = formData.nombre_completo.trim();
    const usuario = formData.usuario_login.trim();
    const password = formData.password.trim();

    if (!nombre || !usuario || !password || !formData.rol_id) {
      mostrarAlertaError('Completa nombre, usuario, contraseña y rol');
      return;
    }

    const usuarioYaExiste = usuarios?.some(
      (u: any) =>
        String(u.usuario_login).trim().toLowerCase() === usuario.toLowerCase()
    );

    if (usuarioYaExiste) {
      mostrarAlertaError('El nombre de usuario ya existe. Usa otro usuario.');
      return;
    }

    createMutation.mutate({
      nombre_completo: nombre,
      usuario_login: usuario,
      password: password,
      rol_id: formData.rol_id,
      correo: null
    });
  };

  const confirmarBaja = () => {
    if (usuarioSeleccionado) {
      deleteMutation.mutate(usuarioSeleccionado.usuario_id);
    }
  };

  const obtenerRol = (rolId: number) => {
    if (rolId === 1) return 'Admin';
    if (rolId === 2) return 'Encargado';
    return 'Empleado';
  };

  if (isLoading) return <p>Cargando panel...</p>;

  const inputStyle = {
    padding: '12px',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
    fontSize: '14px',
    width: '100%',
    boxSizing: 'border-box' as const
  };

  return (
    <div style={{ padding: '20px' }}>
      <Toaster position="top-right" />

      <h2 style={{ marginBottom: '25px', color: '#1e293b', fontWeight: '800' }}>
        👥 Gestión de Usuarios
      </h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>

        {/* FORMULARIO ARRIBA */}
        <div
          style={{
            backgroundColor: 'white',
            padding: '25px',
            borderRadius: '16px',
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
            borderLeft: '6px solid #2563eb',
            width: '100%',
            boxSizing: 'border-box'
          }}
        >
          <h3 style={{ marginTop: 0, color: '#1e293b', marginBottom: '20px' }}>
            Nuevo Usuario
          </h3>

          <form
            onSubmit={handleSubmit}
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '15px',
              alignItems: 'end'
            }}
          >
            <input
              required
              placeholder="Nombre Completo"
              value={formData.nombre_completo}
              onChange={(e) =>
                setFormData({ ...formData, nombre_completo: e.target.value })
              }
              style={inputStyle}
            />

            <input
              required
              placeholder="Usuario (Login)"
              value={formData.usuario_login}
              onChange={(e) =>
                setFormData({ ...formData, usuario_login: e.target.value })
              }
              style={inputStyle}
            />

            <input
              required
              type="password"
              placeholder="Contraseña"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              style={inputStyle}
            />

            <select
              required
              value={formData.rol_id}
              onChange={(e) =>
                setFormData({ ...formData, rol_id: Number(e.target.value) })
              }
              style={inputStyle}
            >
              <option value={1}>Administrador</option>
              <option value={2}>Encargado</option>
              <option value={3}>Empleado</option>
            </select>

            <button
              type="submit"
              disabled={createMutation.isPending}
              style={{
                padding: '12px',
                backgroundColor: createMutation.isPending ? '#94a3b8' : '#2563eb',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 'bold',
                cursor: createMutation.isPending ? 'not-allowed' : 'pointer',
                width: '100%'
              }}
            >
              {createMutation.isPending ? 'Guardando...' : '➕ Registrar Usuario'}
            </button>
          </form>
        </div>

        {/* TABLA ABAJO */}
        <div
          style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '16px',
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
            overflowX: 'auto',
            width: '100%',
            boxSizing: 'border-box'
          }}
        >
          <h3 style={{ marginTop: 0, color: '#1e293b', marginBottom: '20px' }}>
            Lista de Usuarios
          </h3>

          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '760px' }}>
            <thead>
              <tr
                style={{
                  textAlign: 'left',
                  backgroundColor: '#f8fafc',
                  borderBottom: '2px solid #e2e8f0'
                }}
              >
                {['Nombre', 'Usuario', 'Rol', 'Estado', 'Acción'].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: '16px',
                      color: '#64748b',
                      fontSize: '0.8rem',
                      textTransform: 'uppercase'
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {usuarios?.map((u: any) => (
                <tr
                  key={u.usuario_id}
                  style={{
                    borderBottom: '1px solid #f1f5f9',
                    backgroundColor: u.activo === false ? '#f1f5f9' : 'white',
                    opacity: u.activo === false ? 0.65 : 1
                  }}
                >
                  <td
                    style={{
                      padding: '12px',
                      fontWeight: 'bold',
                      color: u.activo === false ? '#64748b' : '#1e293b'
                    }}
                  >
                    {u.nombre_completo}
                  </td>

                  <td style={{ padding: '12px', fontSize: '0.85rem' }}>
                    <div style={{ color: u.activo === false ? '#64748b' : '#1e293b' }}>
                      @{u.usuario_login}
                    </div>
                  </td>

                  <td style={{ padding: '12px' }}>
                    <span
                      style={{
                        padding: '4px 10px',
                        borderRadius: '20px',
                        fontSize: '0.75rem',
                        fontWeight: 'bold',
                        backgroundColor:
                          Number(u.rol_id) === 1
                            ? '#fee2e2'
                            : Number(u.rol_id) === 2
                            ? '#fef3c7'
                            : '#dcfce7',
                        color:
                          Number(u.rol_id) === 1
                            ? '#991b1b'
                            : Number(u.rol_id) === 2
                            ? '#92400e'
                            : '#166534'
                      }}
                    >
                      {obtenerRol(Number(u.rol_id))}
                    </span>
                  </td>

                  <td style={{ padding: '12px' }}>
                    <span
                      style={{
                        padding: '4px 10px',
                        borderRadius: '20px',
                        fontSize: '0.75rem',
                        fontWeight: 'bold',
                        backgroundColor: u.activo === false ? '#e2e8f0' : '#dcfce7',
                        color: u.activo === false ? '#475569' : '#166534'
                      }}
                    >
                      {u.activo === false ? 'Dado de baja' : 'Activo'}
                    </span>
                  </td>

                  <td style={{ padding: '12px' }}>
                    {u.activo === false ? (
                      <button
                        onClick={() => activarMutation.mutate(u.usuario_id)}
                        disabled={activarMutation.isPending}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: activarMutation.isPending ? '#94a3b8' : '#16a34a',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: activarMutation.isPending ? 'not-allowed' : 'pointer',
                          fontSize: '0.8rem',
                          fontWeight: 'bold'
                        }}
                      >
                        {activarMutation.isPending ? 'Activando...' : 'Activar'}
                      </button>
                    ) : (
                      <button
                        onClick={() => setUsuarioSeleccionado(u)}
                        style={{
                          padding: '6px 10px',
                          backgroundColor: '#ef4444',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '0.8rem',
                          fontWeight: 'bold'
                        }}
                      >
                        Baja
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>

      {/* MODAL BONITO PARA CONFIRMAR BAJA */}
      {usuarioSeleccionado && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.55)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '20px',
            zIndex: 999
          }}
        >
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '18px',
              padding: '28px',
              width: '100%',
              maxWidth: '420px',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.25)',
              textAlign: 'center'
            }}
          >
            <div
              style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                backgroundColor: '#fee2e2',
                color: '#dc2626',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '28px',
                margin: '0 auto 15px'
              }}
            >
              ⚠️
            </div>

            <h3 style={{ margin: '0 0 10px', color: '#1e293b', fontSize: '1.3rem' }}>
              Confirmar baja de usuario
            </h3>

            <p style={{ color: '#64748b', marginBottom: '8px', lineHeight: '1.5' }}>
              ¿Estás seguro de que deseas dar de baja a este usuario?
            </p>

            <p style={{ color: '#1e293b', fontWeight: 'bold', marginBottom: '22px' }}>
              {usuarioSeleccionado.nombre_completo}
            </p>

            <div
              style={{
                display: 'flex',
                gap: '12px',
                justifyContent: 'center',
                flexWrap: 'wrap'
              }}
            >
              <button
                onClick={() => setUsuarioSeleccionado(null)}
                disabled={deleteMutation.isPending}
                style={{
                  padding: '10px 16px',
                  backgroundColor: '#e2e8f0',
                  color: '#334155',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: deleteMutation.isPending ? 'not-allowed' : 'pointer',
                  fontWeight: 'bold'
                }}
              >
                Cancelar
              </button>

              <button
                onClick={confirmarBaja}
                disabled={deleteMutation.isPending}
                style={{
                  padding: '10px 16px',
                  backgroundColor: deleteMutation.isPending ? '#94a3b8' : '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: deleteMutation.isPending ? 'not-allowed' : 'pointer',
                  fontWeight: 'bold'
                }}
              >
                {deleteMutation.isPending ? 'Procesando...' : 'Sí, dar de baja'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GestionUsuarios;