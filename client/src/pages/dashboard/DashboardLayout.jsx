import React, { useContext } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { UserContext } from "../../context/UserProvider";
import { LogOut } from "lucide-react";

const DashboardLayout = () => {
  const { user, clearUser } = useContext(UserContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    clearUser();
    navigate("/"); // ✅ fixed
  };

  const activeLinkClass =
    "block p-2 rounded bg-blue-700 font-semibold text-white transition";
  const defaultLinkClass =
    "block p-2 rounded hover:bg-blue-600 text-white transition";

  return (
    <div className="flex min-h-screen bg-gray-100 text-gray-800">
      {/* Sidebar */}
      <aside className="w-64 bg-[#1947a8] text-white flex flex-col">
        <div className="p-4 text-2xl font-bold border-b border-blue-700 text-center">
          NAMASTE Admin
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <NavLink
            to="/dashboard/conditions"
            className={({ isActive }) =>
              isActive ? activeLinkClass : defaultLinkClass
            }
          >
            Conditions
          </NavLink>

          {user?.role === "admin" && (
            <NavLink
              to="/dashboard/create/condition"
              className={({ isActive }) =>
                isActive ? activeLinkClass : defaultLinkClass
              }
            >
              Add Condition
            </NavLink>
          )}

          {/* ✅ Corrected link */}
          <NavLink
            to="/dashboard/translate"
            className={({ isActive }) =>
              isActive ? activeLinkClass : defaultLinkClass
            }
          >
            Translate
          </NavLink>
        </nav>

        <div className="p-4 border-t border-blue-700">
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-sm bg-blue-800 hover:bg-blue-700 px-3 py-2 rounded"
          >
            <LogOut size={16} /> Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold">
            Welcome, {user?.name || "User"}
          </h1>
          <p className="text-gray-500 text-sm">
            Role: <span className="font-medium">{user?.role}</span>
          </p>
        </div>
        <Outlet />
      </main>
    </div>
  );
};

export default DashboardLayout;
