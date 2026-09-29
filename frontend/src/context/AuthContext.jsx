import { createContext, useContext, useEffect, useState } from "react";
import api from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,setUser] = useState(null);
  const [loading,setLoading] = useState(true);

  useEffect(() => {
    if (!localStorage.getItem("blockattend_token")) return setLoading(false);
    api.get("/auth/me").then(r => setUser(r.data)).catch(() => {
      localStorage.removeItem("blockattend_token");
    }).finally(() => setLoading(false));
  },[]);

  async function login(email,password) {
    const r = await api.post("/auth/login",{email,password});
    localStorage.setItem("blockattend_token",r.data.token);
    setUser(r.data.user);
  }

  function logout() {
    localStorage.removeItem("blockattend_token");
    setUser(null);
  }

  return <AuthContext.Provider value={{user,login,logout,loading}}>
    {children}
  </AuthContext.Provider>;
}
export const useAuth = () => useContext(AuthContext);
