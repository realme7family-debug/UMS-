import { createContext, useCallback, useContext, useEffect, useState } from "react";
import toast from "react-hot-toast";
import api from "../api/client";
import { storage } from "../utils/storage";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(storage.get("ums_role"));
  const [loading, setLoading] = useState(!!storage.get("ums_token"));

  const logout = useCallback(() => {
    storage.remove("ums_token");
    storage.remove("ums_role");
    setUser(null);
    setRole(null);
  }, []);

  const refreshUser = useCallback(async () => {
    const { data } = await api.get("/auth/me");
    setUser(data.user);
    setRole(data.role);
    return data.user;
  }, []);

  useEffect(() => {
    const onExpired = () => {
      setUser((current) => {
        if (current) toast.error("Your session expired, please login again.");
        return null;
      });
      setRole(null);
    };
    window.addEventListener("ums:session-expired", onExpired);
    return () => window.removeEventListener("ums:session-expired", onExpired);
  }, []);

  // restore session on page reload
  useEffect(() => {
    if (!storage.get("ums_token")) return;
    refreshUser()
      .catch(logout)
      .finally(() => setLoading(false));
  }, [refreshUser, logout]);

  const login = async (payload) => {
    const { data } = await api.post("/auth/login", payload);
    storage.set("ums_token", data.token);
    storage.set("ums_role", data.role);
    setUser(data.user);
    setRole(data.role);
    return data;
  };

  return (
    <AuthContext.Provider value={{ user, role, loading, login, logout, setUser, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
