import React, { createContext, useContext, useState, useEffect } from "react";
import API from "../services/api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem("coupon_jwt_token"));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      if (token) {
        try {
          const res = await API.get("/auth/me");
          if (res.data.success) {
            setUser(res.data.user);
          }
        } catch (err) {
          console.error("Auth fetch error:", err);
          logout();
        }
      }
      setLoading(false);
    };

    fetchUser();
  }, [token]);

  const login = async (email, password) => {
    const res = await API.post("/auth/login", { email, password });
    if (res.data.success) {
      localStorage.setItem("coupon_jwt_token", res.data.token);
      setToken(res.data.token);
      setUser(res.data.user);
      return res.data;
    }
    throw new Error(res.data.message || "Login failed");
  };

  const register = async (formData) => {
    const res = await API.post("/auth/register", formData);
    if (res.data.success) {
      localStorage.setItem("coupon_jwt_token", res.data.token);
      setToken(res.data.token);
      setUser(res.data.user);
      return res.data;
    }
    throw new Error(res.data.message || "Registration failed");
  };

  const loginWithWeb3 = async (walletAddress, signer, role = "customer") => {
    // 1. Request cryptographic nonce
    const nonceRes = await API.post("/auth/nonce", { walletAddress });
    const nonce = nonceRes.data.nonce;

    // 2. Personal sign the nonce challenge
    const signature = await signer.signMessage(nonce);

    // 3. Verify signature on backend
    const verifyRes = await API.post("/auth/verify-signature", {
      walletAddress,
      signature,
      role,
    });

    if (verifyRes.data.success) {
      localStorage.setItem("coupon_jwt_token", verifyRes.data.token);
      setToken(verifyRes.data.token);
      setUser(verifyRes.data.user);
      return verifyRes.data;
    }
    throw new Error(verifyRes.data.message || "Web3 authentication failed");
  };

  const logout = () => {
    localStorage.removeItem("coupon_jwt_token");
    setToken(null);
    setUser(null);
  };

  const updateProfile = async (data) => {
    const res = await API.put("/auth/profile", data);
    if (res.data.success) {
      setUser((prev) => ({ ...prev, ...res.data.user }));
    }
    return res.data;
  };

  const isCustomer = user?.role === "customer";
  const isMerchant = user?.role === "merchant";
  const isAdmin = user?.role === "admin";

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        loginWithWeb3,
        logout,
        updateProfile,
        isAuthenticated: !!user,
        isCustomer,
        isMerchant,
        isAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
