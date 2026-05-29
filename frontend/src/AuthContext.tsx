import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext<any>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  // 1️⃣ Leemos el disco duro (localStorage) justo al cargar la página
  const [user, setUser] = useState<any>(() => {
    const usuarioGuardado = localStorage.getItem('super_valle_sesion');
    return usuarioGuardado ? JSON.parse(usuarioGuardado) : null;
  });

  // 2️⃣ Al iniciar sesión, guardamos en RAM (setUser) y en el disco duro (localStorage)
  const login = (userData: any) => {
    setUser(userData);
    localStorage.setItem('super_valle_sesion', JSON.stringify(userData));
  };

  // 3️⃣ Al cerrar sesión, borramos de ambos lados
  const logout = () => {
    setUser(null);
    localStorage.removeItem('super_valle_sesion');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe usarse dentro de un AuthProvider");
  }
  return context;
};