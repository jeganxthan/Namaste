// src/context/UserProvider.jsx
import axios from "axios";
import { createContext, useState, useEffect } from "react";
import { API_PATHS, BASE_URL } from "../constants/apiPaths";

export const UserContext = createContext();

const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true); // ✅ true until initialized

  // ✅ Load from localStorage on app start
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const storedToken = localStorage.getItem("token");
    if (storedUser) setUser(JSON.parse(storedUser));
    if (storedToken) setToken(storedToken);
    setLoading(false);
  }, []);

  // ✅ Fetch user profile when token changes
  useEffect(() => {
    if (!token) return;
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${BASE_URL}${API_PATHS.AUTH.PROFILE}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(res.data);
      } catch (error) {
        console.error("❌ Profile fetch failed:", error);
        clearUser();
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [token]);

  const updateUser = (userData) => {
    if (!userData) return;
    setUser(userData);
    const newToken = userData.token || localStorage.getItem("token"); // Use new token or existing
    if (newToken) {
      setToken(newToken);
      localStorage.setItem("token", newToken);
    }
    localStorage.setItem("user", JSON.stringify(userData));
  };

  const clearUser = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
  };

  return (
    <UserContext.Provider
      value={{
        user,
        token,
        loading,
        setLoading,
        updateUser,
        clearUser,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export default UserProvider;
