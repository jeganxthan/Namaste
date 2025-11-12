import React, { useContext } from "react";
import { UserContext } from "../../context/UserProvider";

const DashboardHome = () => {
  const { user } = useContext(UserContext);
  return (
    <div className="bg-white p-8 rounded-lg shadow text-center">
      <h2 className="text-3xl font-bold mb-4">Dashboard</h2>
      <p className="text-gray-600">
        Welcome back, <strong>{user?.name}</strong>!
      </p>
      <p className="text-gray-500 mt-2">
        Use the sidebar to manage your conditions.
      </p>
    </div>
  );
};

export default DashboardHome;
