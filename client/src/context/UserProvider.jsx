// src/context/UserContext.jsx
import axios from "axios";
import { createContext, useState, useEffect } from "react";
import { API_PATHS, BASE_URL } from "../constants/apiPaths";

export const UserContext = createContext();

const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);      // user info
  const [token, setToken] = useState(null);    // auth token
  const [loading, setLoading] = useState(false); // auth loading

  // Restore token from localStorage on initial load
  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    if (storedToken) {
      setToken(storedToken);
    }
  }, []);

  // Fetch user profile when token changes
  useEffect(() => {
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    const fetchUser = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`${BASE_URL}${API_PATHS.AUTH.PROFILE}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setUser(response.data);
      } catch (error) {
        console.error("Profile fetch failed:", error);
        clearUser();
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [token]);

  const updateUser = (userData) => {
    setUser(userData);
    if (userData?.token) {
      localStorage.setItem("token", userData.token);
      setToken(userData.token);
    }
  };

  const clearUser = () => {
    setUser(null);
    localStorage.removeItem("token");
    setToken(null);
  };

  return (
    <UserContext.Provider
      value={{
        user,
        setUser,
        token,
        setToken,
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
