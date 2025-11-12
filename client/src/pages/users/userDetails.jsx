import React, { useEffect, useState, useContext } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { BASE_URL } from "../../constants/apiPaths";
import { UserContext } from "../../context/UserProvider";

const UserDetails = () => {
  const { id } = useParams();
  const { token } = useContext(UserContext);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/api/user/${id}/conditions`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUserData(res.data);
      } catch (err) {
        console.error("❌ Error fetching user details:", err);
        setError(err.response?.data?.message || "Failed to load user details");
      } finally {
        setLoading(false);
      }
    };

    if (token) fetchUserDetails();
  }, [id, token]);

  if (loading)
    return <div className="text-center py-10 text-lg">Loading user details...</div>;

  if (error)
    return <div className="text-center py-10 text-red-500">{error}</div>;

  if (!userData)
    return <div className="text-center py-10 text-gray-600">No user data found.</div>;

  const { user, conditions, totalConditions } = userData;

  return (
    <div className="max-w-5xl mx-auto p-6 bg-white shadow rounded-lg mt-10">
      {/* ✅ User Info Section */}
      <div className="border-b pb-4 mb-4">
        <h1 className="text-2xl font-bold text-center mb-4">User Details</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-700">
          <p><strong>Name:</strong> {user.name}</p>
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>Role:</strong> {user.role}</p>
          <p><strong>Joined:</strong> {new Date(user.createdAt).toLocaleString()}</p>
        </div>
      </div>

      {/* ✅ Conditions List */}
      <h2 className="text-xl font-semibold mb-3 text-center">
        Assigned Conditions ({totalConditions})
      </h2>

      {conditions.length === 0 ? (
        <p className="text-center text-gray-500">No conditions found for this user.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-100 text-gray-700">
                <th className="border p-2">Code</th>
                <th className="border p-2">Category</th>
                <th className="border p-2">Severity</th>
                <th className="border p-2">Status</th>
                <th className="border p-2">Created At</th>
              </tr>
            </thead>
            <tbody>
              {conditions.map((c) => (
                <tr key={c._id} className="text-center hover:bg-gray-50">
                  <td className="border p-2">
                    {c.code?.coding?.map((cd) => (
                      <div key={cd.code}>
                        <span className="font-medium">{cd.code}</span> ({cd.system})
                      </div>
                    ))}
                  </td>
                  <td className="border p-2">{c.category?.join(", ") || "N/A"}</td>
                  <td className="border p-2">{c.severity || "N/A"}</td>
                  <td className="border p-2">{c.clinicalStatus || "N/A"}</td>
                  <td className="border p-2">
                    {new Date(c.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ✅ Back Button */}
      <div className="text-center mt-6">
        <Link
          to="/dashboard/users"
          className="bg-[#1947a8] text-white px-4 py-2 rounded hover:bg-[#638ee8]"
        >
          ← Back to Users
        </Link>
      </div>
    </div>
  );
};

export default UserDetails;
