import React, { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(() => JSON.parse(localStorage.getItem('admin')) || null);

  useEffect(() => {
    localStorage.setItem('admin', JSON.stringify(admin));
  }, [admin]);

  const adminLogin = async (credentials) => {
    
    const response = { email: credentials.email, token: "admin-token" };
    setAdmin(response);
  };

  const logout = () => {
    setAdmin(null);
    localStorage.removeItem('admin');
  };

  return (
    <AuthContext.Provider value={{ admin, adminLogin, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
