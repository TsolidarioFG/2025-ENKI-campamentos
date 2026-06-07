import { createContext, useContext, useEffect, useState } from "react";
import { getMe, loginRequest } from "../services/authService";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        setAuthLoading(false);
        return;
      }

      try {
        const result = await getMe();
        setUser(result.user);
      } catch {
        localStorage.removeItem("token");
        setUser(null);
      } finally {
        setAuthLoading(false);
      }
    };

    loadUser();
  }, []);

  const login = async ({ identifier, password }) => {
    const result = await loginRequest({ identifier, password });

    localStorage.setItem("token", result.token);
    setUser(result.user);

    return result.user;
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        authLoading,
        login,
        logout,
        isAuthenticated: Boolean(user),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}