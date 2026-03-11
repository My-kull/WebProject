import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem("auth_token"));
  const [email, setEmail] = useState(localStorage.getItem("auth_email"));

  const isAuthenticated = !!token;

  useEffect(() => {
    if (token) {
      localStorage.setItem("auth_token", token);
      localStorage.setItem("auth_email", email);
    }
  }, [token, email]);

  const saveAuth = (newToken, newEmail) => {
    setToken(newToken);
    setEmail(newEmail);
    localStorage.setItem("auth_token", newToken);
    localStorage.setItem("auth_email", newEmail);
  };

  const clearAuth = () => {
    setToken(null);
    setEmail(null);
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_email");
  };

  return (
    <AuthContext.Provider
      value={{ token, email, isAuthenticated, saveAuth, clearAuth }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
