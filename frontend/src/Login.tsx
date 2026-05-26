import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Intentando enviar login a:", 'http://localhost:3000/auth/login'); 
    try {
      const res = await axios.post('http://localhost:3000/auth/login', { 
          username: username, 
          password: password 
      });
      console.log("Respuesta del servidor:", res.data);
      login(res.data.user);
    } catch (err) {
      console.error("Error completo:", err);
      alert("❌ Error: Mira la consola (F12)");
    }
  };

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh', 
      background: 'linear-gradient(135deg, #1e3a8a, #0f172a)' 
    }}>
      <form onSubmit={handleLogin} style={{ 
        background: 'white', 
        padding: '40px', 
        borderRadius: '20px', 
        width: '320px',
        boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
        display: 'flex',
        flexDirection: 'column',
        gap: '15px'
      }}>
        <h2 style={{ textAlign: 'center', marginBottom: '20px', color: '#1e3a8a' }}>🔐 Iniciar Sesión</h2>
        <input 
          placeholder="Usuario" 
          value={username} 
          onChange={e => setUsername(e.target.value)} 
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
          onFocus={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
          onBlur={(e) => e.currentTarget.style.borderColor = '#cbd5e1'}
        />
        <input 
          type="password" 
          placeholder="Contraseña" 
          value={password} 
          onChange={e => setPassword(e.target.value)} 
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
          onFocus={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
          onBlur={(e) => e.currentTarget.style.borderColor = '#cbd5e1'}
        />
        <button 
          type="submit" 
          style={{ 
            width: '100%', 
            padding: '12px', 
            background: '#3b82f6', 
            color: 'white', 
            border: 'none', 
            borderRadius: '10px', 
            cursor: 'pointer', 
            fontWeight: 'bold',
            fontSize: '15px',
            transition: 'all 0.2s ease-in-out'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#3b82f6'}
        >
          Entrar
        </button>
      </form>
    </div>
  );
};

export default Login;