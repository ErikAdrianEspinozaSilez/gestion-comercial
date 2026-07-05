import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { useAuth } from './AuthContext';

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [cargando, setCargando] = useState(false);

  const { login } = useAuth();

  const toastStyle = {
    borderRadius: '12px',
    fontWeight: '600',
    boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username.trim() || !password.trim()) {
      toast.error('Completa usuario y contraseña', {
        id: 'campos-vacios-login',
        icon: '⚠️',
        duration: 3000,
        style: {
          ...toastStyle,
          background: '#fee2e2',
          color: '#991b1b',
        },
      });
      return;
    }

    if (cargando) return;

    setCargando(true);

    try {
      const res = await axios.post(
        'https://gestion-comercial-j3ed.onrender.com/auth/login',
        {
          username,
          password,
        }
      );

      if (res.data.user?.activo === false) {
        toast.error('Este usuario fue dado de baja. No puede ingresar al sistema.', {
          id: 'usuario-inactivo-login',
          icon: '🚫',
          duration: 3500,
          style: {
            ...toastStyle,
            background: '#fee2e2',
            color: '#991b1b',
          },
        });
        return;
      }

      toast.success('Inicio de sesión correcto', {
        id: 'login-correcto',
        icon: '✅',
        duration: 2000,
        style: {
          ...toastStyle,
          background: '#dcfce7',
          color: '#166534',
        },
      });

      login(res.data.user);
    } catch (err: any) {
      console.error('Error completo:', err);

      const mensajeBackend =
        err.response?.data?.message ||
        err.response?.data?.mensaje ||
        err.response?.data?.error;

      toast.error(mensajeBackend || 'No se pudo iniciar sesión', {
        id: 'error-login',
        icon: '❌',
        duration: 3500,
        style: {
          ...toastStyle,
          background: '#fee2e2',
          color: '#991b1b',
        },
      });
    } finally {
      setCargando(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        display: 'flex',
        background:
          'radial-gradient(circle at top left, #2563eb 0%, #0f172a 42%, #020617 100%)',
        overflow: 'hidden',
        position: 'relative',
        fontFamily: 'Inter, system-ui, Arial, sans-serif',
      }}
    >
      {/* Decoración de fondo */}
      <div
        style={{
          position: 'absolute',
          width: '420px',
          height: '420px',
          borderRadius: '50%',
          background: 'rgba(59, 130, 246, 0.25)',
          filter: 'blur(80px)',
          top: '-120px',
          left: '-120px',
        }}
      />

      <div
        style={{
          position: 'absolute',
          width: '380px',
          height: '380px',
          borderRadius: '50%',
          background: 'rgba(16, 185, 129, 0.20)',
          filter: 'blur(90px)',
          bottom: '-120px',
          right: '-100px',
        }}
      />

      {/* Contenedor principal */}
      <div
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px',
          boxSizing: 'border-box',
          gap: '70px',
          flexWrap: 'wrap',
          position: 'relative',
          zIndex: 2,
        }}
      >
        {/* Formulario */}
        <form
          onSubmit={handleLogin}
          style={{
            width: '380px',
            maxWidth: '100%',
            background: 'rgba(255, 255, 255, 0.96)',
            padding: '36px',
            borderRadius: '26px',
            boxShadow: '0 25px 60px rgba(0,0,0,0.35)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            border: '1px solid rgba(255,255,255,0.5)',
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '18px',
              background: 'linear-gradient(135deg, #2563eb, #10b981)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '30px',
              margin: '0 auto 8px auto',
              boxShadow: '0 12px 25px rgba(37, 99, 235, 0.35)',
            }}
          >
            🛒
          </div>

          <div style={{ textAlign: 'center', marginBottom: '8px' }}>
            <h2
              style={{
                margin: 0,
                color: '#0f172a',
                fontSize: '28px',
                fontWeight: '900',
                letterSpacing: '-0.5px',
              }}
            >
              Iniciar Sesión
            </h2>

            <p
              style={{
                margin: '8px 0 0 0',
                color: '#64748b',
                fontSize: '14px',
              }}
            >
              Ingresa tus datos para acceder al sistema
            </p>
          </div>

          <div>
            <label
              style={{
                display: 'block',
                marginBottom: '6px',
                color: '#334155',
                fontSize: '13px',
                fontWeight: '700',
              }}
            >
              Usuario
            </label>

            <input
              placeholder="Escribe tu usuario"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              style={{
                width: '100%',
                padding: '14px 15px',
                boxSizing: 'border-box',
                borderRadius: '14px',
                border: '1px solid #cbd5e1',
                fontSize: '15px',
                outline: 'none',
                transition: 'all 0.2s ease-in-out',
                background: '#f8fafc',
                color: '#0f172a',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#2563eb';
                e.currentTarget.style.background = '#ffffff';
                e.currentTarget.style.boxShadow =
                  '0 0 0 4px rgba(37, 99, 235, 0.12)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#cbd5e1';
                e.currentTarget.style.background = '#f8fafc';
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
          </div>

          <div>
            <label
              style={{
                display: 'block',
                marginBottom: '6px',
                color: '#334155',
                fontSize: '13px',
                fontWeight: '700',
              }}
            >
              Contraseña
            </label>

            <input
              type="password"
              placeholder="Escribe tu contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              style={{
                width: '100%',
                padding: '14px 15px',
                boxSizing: 'border-box',
                borderRadius: '14px',
                border: '1px solid #cbd5e1',
                fontSize: '15px',
                outline: 'none',
                transition: 'all 0.2s ease-in-out',
                background: '#f8fafc',
                color: '#0f172a',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#2563eb';
                e.currentTarget.style.background = '#ffffff';
                e.currentTarget.style.boxShadow =
                  '0 0 0 4px rgba(37, 99, 235, 0.12)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#cbd5e1';
                e.currentTarget.style.background = '#f8fafc';
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
          </div>

          <button
            type="submit"
            disabled={cargando}
            style={{
              width: '100%',
              padding: '15px',
              marginTop: '8px',
              background: cargando
                ? '#94a3b8'
                : 'linear-gradient(135deg, #2563eb, #1d4ed8)',
              color: 'white',
              border: 'none',
              borderRadius: '15px',
              cursor: cargando ? 'not-allowed' : 'pointer',
              fontWeight: '900',
              fontSize: '15px',
              transition: 'all 0.2s ease-in-out',
              boxShadow: cargando
                ? 'none'
                : '0 12px 25px rgba(37, 99, 235, 0.32)',
            }}
            onMouseEnter={(e) => {
              if (!cargando) {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow =
                  '0 16px 30px rgba(37, 99, 235, 0.42)';
              }
            }}
            onMouseLeave={(e) => {
              if (!cargando) {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow =
                  '0 12px 25px rgba(37, 99, 235, 0.32)';
              }
            }}
          >
            {cargando ? 'Ingresando...' : 'Entrar al sistema'}
          </button>

          <div
            style={{
              marginTop: '10px',
              padding: '12px',
              background: '#f1f5f9',
              borderRadius: '14px',
              textAlign: 'center',
              color: '#64748b',
              fontSize: '12px',
              fontWeight: '600',
            }}
          >
            Sistema de gestión comercial
          </div>
        </form>

        {/* Texto grande derecho */}
        <div
          style={{
            maxWidth: '560px',
            color: 'white',
            textAlign: 'left',
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 14px',
              borderRadius: '999px',
              background: 'rgba(255,255,255,0.12)',
              border: '1px solid rgba(255,255,255,0.18)',
              color: '#bfdbfe',
              fontSize: '14px',
              fontWeight: '700',
              marginBottom: '22px',
              backdropFilter: 'blur(8px)',
            }}
          >
            🛍️ Sistema de ventas e inventario
          </div>

          <h1
            style={{
              margin: 0,
              fontSize: '72px',
              lineHeight: '0.95',
              fontWeight: '1000',
              letterSpacing: '-3px',
              textTransform: 'uppercase',
              textShadow: '0 18px 45px rgba(0,0,0,0.35)',
            }}
          >
            SUPER
            <br />
            VALLE
            <br />
            MARKET
          </h1>

          <p
            style={{
              marginTop: '24px',
              fontSize: '18px',
              lineHeight: '1.6',
              color: '#cbd5e1',
              maxWidth: '450px',
            }}
          >
            Controla tus productos, ventas, stock y movimientos desde una sola
            plataforma moderna, rápida y segura.
          </p>

          <div
            style={{
              display: 'flex',
              gap: '12px',
              flexWrap: 'wrap',
              marginTop: '26px',
            }}
          >
            <span
              style={{
                padding: '10px 14px',
                background: 'rgba(16, 185, 129, 0.18)',
                border: '1px solid rgba(16, 185, 129, 0.35)',
                borderRadius: '12px',
                color: '#bbf7d0',
                fontWeight: '700',
                fontSize: '13px',
              }}
            >
              ✅ Ventas
            </span>

            <span
              style={{
                padding: '10px 14px',
                background: 'rgba(59, 130, 246, 0.18)',
                border: '1px solid rgba(59, 130, 246, 0.35)',
                borderRadius: '12px',
                color: '#bfdbfe',
                fontWeight: '700',
                fontSize: '13px',
              }}
            >
              📦 Inventario
            </span>

            <span
              style={{
                padding: '10px 14px',
                background: 'rgba(245, 158, 11, 0.18)',
                border: '1px solid rgba(245, 158, 11, 0.35)',
                borderRadius: '12px',
                color: '#fde68a',
                fontWeight: '700',
                fontSize: '13px',
              }}
            >
              📊 Reportes
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;