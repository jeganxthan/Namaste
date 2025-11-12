import React, { useState, useContext, useEffect } from "react";
import axios from "axios";
import { createCondition } from "../../api/ConditionService";
import { UserContext } from "../../context/UserProvider";
import { useNavigate } from "react-router-dom";
import Input from "../../component/input/Input";
import { BASE_URL, API_PATHS } from "../../constants/apiPaths";

const ConditionForm = () => {
  const { user, token } = useContext(UserContext);
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({
    userId: "", // ✅ store user ID internally
    name: "", // display name for UI
    system: "NAMASTE",
    code: "",
    category: "",
    severity: "",
    clinicalStatus: "",
    verificationStatus: "",
  });
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // ✅ Fetch all users (admin only)
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await axios.get(
          `${BASE_URL}${API_PATHS.USER.GET_ALL_USERS}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setUsers(res.data.users || []);
      } catch (err) {
        console.error("❌ Failed to fetch users:", err);
        setError(err.response?.data?.message || "Error fetching users");
      }
    };
    if (token) fetchUsers();
  }, [token]);

  // ✅ Handle form changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));

    // ✅ Suggest users by name dynamically
    if (name === "name") {
      const filtered = users.filter((u) =>
        u.name.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredUsers(filtered);
      setShowSuggestions(true);
    }
  };

  // ✅ Select user → store ID + name
  const handleUserSelect = (selectedUser) => {
    setForm((prev) => ({
      ...prev,
      userId: selectedUser._id,
      name: selectedUser.name,
    }));
    setShowSuggestions(false);
  };

  // ✅ Submit handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (!form.userId) {
        setError("Please select a valid user from suggestions.");
        setLoading(false);
        return;
      }

      const payload = {
        userId: form.userId, // ✅ backend expects this
        category: form.category ? [form.category] : [],
        severity: form.severity,
        clinicalStatus: form.clinicalStatus,
        verificationStatus: form.verificationStatus,
        code: {
          coding: [
            {
              system: form.system,
              code: form.code,
              display: "AYUSH Condition",
            },
          ],
          text: form.code || "Unnamed Condition",
        },
      };

      console.log("📤 Sending payload:", payload);
      await createCondition(payload, token);
      navigate("/dashboard/conditions");
    } catch (err) {
      console.error("❌ Condition creation error:", err);
      setError(err.response?.data?.message || "Error creating condition");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Restrict access
  if (!user) return <div className="text-center py-10">Loading user...</div>;
  if (user.role !== "admin")
    return (
      <div className="text-center py-10 text-red-500">
        Only admins can create conditions.
      </div>
    );

  return (
    <div className="max-w-lg mx-auto p-8 bg-white shadow rounded-lg mt-10 relative">
      <h1 className="text-2xl font-bold mb-6 text-center text-[#1947a8]">
        Create New Condition
      </h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* ✅ User Name Input + Suggestion Dropdown */}
        <div className="relative">
          <Input
            label="User Name"
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Start typing user name..."
            autoComplete="off"
          />
          {showSuggestions && filteredUsers.length > 0 && (
            <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-lg max-h-48 overflow-y-auto shadow-lg">
              {filteredUsers.map((u) => (
                <li
                  key={u._id}
                  className="p-2 hover:bg-blue-100 cursor-pointer"
                  onClick={() => handleUserSelect(u)}
                >
                  <span className="font-medium">{u.name}</span>{" "}
                  <span className="text-gray-500 text-sm">({u.email})</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* ✅ System Selector */}
        <div>
          <label className="block text-sm font-medium mb-1">System</label>
          <select
            name="system"
            value={form.system}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-400"
          >
            <option value="NAMASTE">NAMASTE</option>
            <option value="SIDDHA">SIDDHA</option>
          </select>
        </div>

        <Input
          label="AYUSH Code"
          name="code"
          value={form.code}
          onChange={handleChange}
          placeholder="Enter AYUSH code (e.g., AYU002)"
        />

        <Input
          label="Category"
          name="category"
          value={form.category}
          onChange={handleChange}
          placeholder="e.g., endocrine"
        />

        {/* ✅ Severity */}
        <div>
          <label className="block text-sm font-medium mb-1">Severity</label>
          <select
            name="severity"
            value={form.severity}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-400"
          >
            <option value="">Select severity</option>
            <option value="mild">Mild</option>
            <option value="moderate">Moderate</option>
            <option value="severe">Severe</option>
          </select>
        </div>

        {/* ✅ Clinical Status */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Clinical Status
          </label>
          <select
            name="clinicalStatus"
            value={form.clinicalStatus}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-400"
          >
            <option value="">Select status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>

        {/* ✅ Verification Status */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Verification Status
          </label>
          <select
            name="verificationStatus"
            value={form.verificationStatus}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-400"
          >
            <option value="">Select verification</option>
            <option value="confirmed">Confirmed</option>
            <option value="provisional">Provisional</option>
            <option value="refuted">Refuted</option>
            <option value="entered-in-error">Entered in Error</option>
          </select>
        </div>

        {/* ✅ Submit */}
        <button
          type="submit"
          disabled={loading}
          className="bg-[#1947a8] w-full text-white py-2 rounded-lg hover:bg-[#638ee8] disabled:opacity-50 transition"
        >
          {loading ? "Creating..." : "Create Condition"}
        </button>
      </form>

      {error && <p className="text-red-500 text-sm text-center mt-3">{error}</p>}
    </div>
  );
};

export default ConditionForm;
