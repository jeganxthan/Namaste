import React, { useEffect, useState, useContext } from "react";
import { getAllConditions, deleteCondition } from "../../api/ConditionService";
import { UserContext } from "../../context/UserProvider";
import { Link } from "react-router-dom";
import axios from "axios";
import { API_PATHS, BASE_URL } from "../../constants/apiPaths";

const ConditionList = () => {
  const { user, token } = useContext(UserContext);
  const [conditions, setConditions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ✅ Fetch conditions from backend
  const fetchConditions = async () => {
    try {
      const data = await getAllConditions(token);
      setConditions(data.conditions || []);
    } catch (err) {
      console.error("❌ Error fetching conditions:", err);
      const message =
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Failed to fetch conditions";
      if (message.toLowerCase().includes("token")) {
        setError("Session expired. Please log in again.");
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchConditions();
    }
  }, [token]);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this condition?"))
      return;

    try {
      console.log(`🗑️ Deleting condition: ${id}`);

      await axios.delete(`${BASE_URL}/fhir/conditions/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // ✅ Remove from local state immediately
      setConditions((prev) => prev.filter((c) => c.id !== id));

      alert("✅ Condition deleted successfully!");
    } catch (err) {
      console.error("❌ Delete failed:", err);
      alert(err.response?.data?.message || "Failed to delete condition.");
    }
  };

  if (!token) {
    return (
      <div className="text-center py-10 text-gray-500">
        Initializing session...
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-center py-10 text-lg">Loading conditions...</div>
    );
  }

  return (
    <div className="w-full mx-auto p-6 bg-white shadow rounded-lg mt-10">
      <h1 className="text-2xl font-bold mb-6 text-center text-[#1947a8]">
        Conditions
      </h1>

      {error && <p className="text-red-500 text-center mb-4">{error}</p>}

      {conditions.length === 0 ? (
        <p className="text-center text-gray-600">No conditions found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-300 text-sm">
            <thead>
              <tr className="bg-gray-200 text-gray-700">
                <th className="border p-2">Code</th>
                <th className="border p-2">Category</th>
                <th className="border p-2">Severity</th>
                <th className="border p-2">Assigned To</th>
                <th className="border p-2">Assigned By</th>
                <th className="border p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {conditions.map((c) => (
                <tr key={c._id} className="text-center hover:bg-gray-50">
                  {/* Code */}
                  <td className="border p-2">
                    {c.code?.coding?.map((cd) => (
                      <div key={cd.code}>
                        <span className="font-medium">{cd.code}</span> (
                        {cd.system})
                      </div>
                    ))}
                  </td>

                  {/* Category */}
                  <td className="border p-2">
                    {c.category?.join(", ") || "N/A"}
                  </td>

                  {/* Severity */}
                  <td className="border p-2 capitalize">
                    <span
                      className={`px-2 py-1 rounded text-white text-xs ${
                        c.severity === "severe"
                          ? "bg-red-500"
                          : c.severity === "moderate"
                          ? "bg-yellow-500"
                          : "bg-green-500"
                      }`}
                    >
                      {c.severity || "N/A"}
                    </span>
                  </td>

                  {/* Assigned To */}
                  <td className="border p-2">
                    {c.assignedTo?.name || "N/A"} <br />
                    <span className="text-gray-500 text-xs">
                      {c.assignedTo?.email}
                    </span>
                  </td>

                  {/* Assigned By */}
                  <td className="border p-2">
                    {c.createdBy?.name || c.assignedBy?.name || "N/A"} <br />
                    <span className="text-gray-500 text-xs">
                      {c.createdBy?.email || c.assignedBy?.email}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="border p-2 flex justify-center gap-2">
                    <Link
                      to={`/dashboard/conditions/${c.id}`}
                      className="text-blue-600 hover:underline"
                    >
                      View
                    </Link>

                    {user?.role === "admin" && (
                      <button
                        onClick={() => handleDelete(c.id)}
                        className="text-red-600 hover:underline"
                      >
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {user?.role === "admin" && (
        <div className="text-center mt-6">
          <Link
            to="/dashboard/create/condition"
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            + Add Condition
          </Link>
        </div>
      )}
    </div>
  );
};

export default ConditionList;
