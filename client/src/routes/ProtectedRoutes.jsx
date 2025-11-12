// src/routes/ProtectedRoutes.jsx
import React, { useContext } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { UserContext } from "../context/UserProvider";

const ProtectedRoute = ({ adminOnly = false, children }) => {
  const { user, token } = useContext(UserContext);

  // ⛔ Not logged in
  if (!token || !user) return <Navigate to="/" replace />;

  // ⛔ Not admin but trying to access admin-only route
  if (adminOnly && user.role !== "admin") {
    return (
      <div className="text-center py-10 text-red-500">
        Access denied: Admins only.
      </div>
    );
  }

  // ✅ If wrapped manually with children
  if (children) return children;

  // ✅ If used as a wrapper for nested routes
  return <Outlet />;
};

export default ProtectedRoute;
