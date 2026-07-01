import React, { useState } from 'react';
import axios from 'axios';
import { Toaster, toast } from 'react-hot-toast';
import { useAuth } from './AuthContext';

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [cargando, setCargando] = useState(false);

  const { login } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username.trim() || !password.trim()) {
      toast.error('Completa usuario y contraseña', {
        icon: '⚠️',
        duration: 3000,
        style: {
          borderRadius: '12px',
          background: '#fee2e2',
          color: '#991b1b',
          fontWeight: '600'
        }
      });
      return;
    }

    setCargando(true);

    try {
      const res = await axios.post(
        'https://gestion-comercial-j3ed.onrender.com/auth/login',
        {
          username: username,
          password: password
        }
      );

      if (res.data.user?.activo === false) {
        toast.error('Este usuario fue dado de baja. No puede ingresar al sistema.', {
          icon: '🚫',
          duration: 3500,
          style: {
            borderRadius: '12px',
            background: '#fee2e2',
            color: '#991b1b',
            fontWeight: '600'
          }
        });
        return;
      }

      toast.success('Inicio de sesión correcto', {
        icon: '✅',
        duration: 2000,
        style: {
          borderRadius: '12px',
          background: '#dcfce7',
          color: '#166534',
          fontWeight: '600'
        }
      });

      login(res.data.user);
    } catch (err: any) {
      console.error("Error completo:", err);

      const mensajeBackend =
        err.response?.data?.message ||
        err.response?.data?.mensaje ||
        err.response?.data?.error;

      toast.error(mensajeBackend || 'No se pudo iniciar sesión', {
        icon: '❌',
        duration: 3500,
        style: {
          borderRadius: '12px',
          background: '#fee2e2',
          color: '#991b1b',
          fontWeight: '600'
        }
      });
    } finally {
      setCargando(false);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: 'linear-gradient(135deg, #1e3a8a, #0f172a)',
        padding: '20px',
        boxSizing: 'border-box'
      }}
    >
      <Toaster position="top-right" />

      <form
        onSubmit={handleLogin}
        style={{
          background: 'white',
          padding: '40px',
          borderRadius: '20px',
          width: '320px',
          maxWidth: '100%',
          boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
          display: 'flex',
          flexDirection: 'column',
          gap: '15px'
        }}
      >
        <h2
          style={{
            textAlign: 'center',
            marginBottom: '20px',
            color: '#1e3a8a'
          }}
        >
          🔐 Iniciar Sesión
        </h2>

        <input
          placeholder="Usuario"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          style={{
            width: '100%',
            padding: '12px',
            margin: '0',
            boxSizing: 'border-box',
            borderRadius: '10px',
            border: '1px solid #cbd5e1',
            fontSize: '14px',
            outline: 'none',
            transition: 'all 0.2s ease-in-out'
          }}
          onFocus={(e) => (e.currentTarget.style.borderColor = '#3b82f6')}
          onBlur={(e) => (e.currentTarget.style.borderColor = '#cbd5e1')}
        />

        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{
            width: '100%',
            padding: '12px',
            margin: '0',
            boxSizing: 'border-box',
            borderRadius: '10px',
            border: '1px solid #cbd5e1',
            fontSize: '14px',
            outline: 'none',
            transition: 'all 0.2s ease-in-out'
          }}
          onFocus={(e) => (e.currentTarget.style.borderColor = '#3b82f6')}
          onBlur={(e) => (e.currentTarget.style.borderColor = '#cbd5e1')}
        />

        <button
          type="submit"
          disabled={cargando}
          style={{
            width: '100%',
            padding: '12px',
            background: cargando ? '#94a3b8' : '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '10px',
            cursor: cargando ? 'not-allowed' : 'pointer',
            fontWeight: 'bold',
            fontSize: '15px',
            transition: 'all 0.2s ease-in-out'
          }}
          onMouseEnter={(e) => {
            if (!cargando) e.currentTarget.style.backgroundColor = '#2563eb';
          }}
          onMouseLeave={(e) => {
            if (!cargando) e.currentTarget.style.backgroundColor = '#3b82f6';
          }}
        >
          {cargando ? 'Ingresando...' : 'Entrar'}
        </button>
      </form>
    </div>
  );
};

export default Login;