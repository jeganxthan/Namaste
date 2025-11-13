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
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [form, setForm] = useState({
    userId: "",
    name: "",
    system: "NAMASTE",
    code: "",
    category: "",
    severity: "",
    clinicalStatus: "",
    verificationStatus: "",
  });

  const [drugData, setDrugData] = useState(null);
  const [drugLoading, setDrugLoading] = useState(false);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  /* ---------------------- FETCH USERS ---------------------- */
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

  /* ---------------------- HANDLE INPUT ---------------------- */
  const handleChange = (e) => {
    const { name, value } = e.target;

    // AYUSH code → auto fetch data
    if (name === "code") {
      setForm((prev) => ({ ...prev, code: value.trim() }));

      if (value.trim().length > 2) {
        fetchCodeInfo(value.trim());
      }

      return;
    }

    setForm((prev) => ({ ...prev, [name]: value }));

    // User search dropdown
    if (name === "name") {
      const filtered = users.filter((u) =>
        u.name.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredUsers(filtered);
      setShowSuggestions(true);
    }
  };

  const handleUserSelect = (u) => {
    setForm((prev) => ({
      ...prev,
      userId: u._id,
      name: u.name,
    }));
    setShowSuggestions(false);
  };

  /* ---------------------- FETCH AYUSH CODE INFO ---------------------- */
  const fetchCodeInfo = async (code) => {
    try {
      setDrugLoading(true);
      setDrugData(null);

      const res = await axios.get(
        `${BASE_URL}/concept-maps/translate?code=${code}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setDrugData(res.data);
    } catch (err) {
      console.error("Gemini Fetch Error:", err);
      setDrugData({
        error: "No medicine information found for this code.",
      });
    } finally {
      setDrugLoading(false);
    }
  };

  /* ---------------------- SUBMIT ---------------------- */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!form.userId) {
      setError("Please select a valid user from suggestions.");
      setLoading(false);
      return;
    }

    try {
      const payload = {
        userId: form.userId,
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

      await createCondition(payload, token);
      navigate("/dashboard/conditions");
    } catch (err) {
      console.error("Create Condition Error:", err);
      setError(err.response?.data?.message || "Error creating condition");
    } finally {
      setLoading(false);
    }
  };

  /* ---------------------- ACCESS CONTROL ---------------------- */
  if (!user) return <div>Loading user...</div>;
  if (user.role !== "admin")
    return (
      <div className="text-center py-10 text-red-500">
        Only admins can create conditions.
      </div>
    );

  /* ---------------------- UI ---------------------- */
  return (
    <div className="max-w-lg mx-auto p-8 bg-white shadow rounded-lg mt-10 relative">
      <h1 className="text-2xl font-bold mb-6 text-center text-[#1947a8]">
        Create New Condition
      </h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* USER FIELD */}
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
            <ul className="absolute z-10 w-full bg-white border rounded-lg max-h-48 overflow-y-auto shadow">
              {filteredUsers.map((u) => (
                <li
                  key={u._id}
                  onClick={() => handleUserSelect(u)}
                  className="p-2 hover:bg-blue-100 cursor-pointer"
                >
                  <span className="font-medium">{u.name}</span>
                  <span className="text-gray-500 text-sm"> ({u.email})</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* SYSTEM */}
        <div>
          <label className="block text-sm font-medium mb-1">System</label>
          <select
            name="system"
            value={form.system}
            onChange={handleChange}
            className="w-full border rounded-lg p-2"
          >
            <option value="NAMASTE">NAMASTE</option>
            <option value="SIDDHA">SIDDHA</option>
          </select>
        </div>

        {/* AYUSH CODE */}
        <Input
          label="AYUSH Code"
          name="code"
          value={form.code}
          onChange={handleChange}
          placeholder="AAA1.1, AYU002, etc"
        />

        {/* CATEGORY */}
        <Input
          label="Category"
          name="category"
          value={form.category}
          onChange={handleChange}
        />

        {/* SEVERITY */}
        <div>
          <label className="block text-sm font-medium mb-1">Severity</label>
          <select
            name="severity"
            value={form.severity}
            onChange={handleChange}
            className="w-full border rounded-lg p-2"
          >
            <option value="">Select</option>
            <option value="mild">Mild</option>
            <option value="moderate">Moderate</option>
            <option value="severe">Severe</option>
          </select>
        </div>

        {/* CLINICAL STATUS */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Clinical Status
          </label>
          <select
            name="clinicalStatus"
            value={form.clinicalStatus}
            onChange={handleChange}
            className="w-full border rounded-lg p-2"
          >
            <option value="">Select</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>

        {/* VERIFICATION STATUS */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Verification Status
          </label>
          <select
            name="verificationStatus"
            value={form.verificationStatus}
            onChange={handleChange}
            className="w-full border rounded-lg p-2"
          >
            <option value="">Select</option>
            <option value="confirmed">Confirmed</option>
            <option value="provisional">Provisional</option>
            <option value="refuted">Refuted</option>
          </select>
        </div>

        {/* SUBMIT */}
        <button
          type="submit"
          disabled={loading}
          className="bg-[#1947a8] w-full text-white py-2 rounded-lg hover:bg-[#638ee8] transition disabled:opacity-40"
        >
          {loading ? "Creating..." : "Create Condition"}
        </button>
      </form>

      {/* ----------------------------------
           DRUG INFORMATION PANEL
      ---------------------------------- */}
      {drugLoading && (
        <div className="mt-6 p-4 bg-blue-50 text-blue-700 rounded-lg">
          Fetching medicine information...
        </div>
      )}

      {drugData && !drugData.error && (
        <div className="mt-8 p-6 bg-gray-50 border rounded-xl shadow">
          <h2 className="text-xl font-bold text-[#1947a8] mb-2">
            {drugData.system} — {drugData.NAMC_TERM}
          </h2>

          <p className="text-gray-700 mb-4">{drugData.Short_definition}</p>

          <h3 className="text-lg font-semibold mb-3">
            Medicines & Modern Equivalents
          </h3>

          <div className="space-y-4">
            {drugData.drug_information?.drugs?.map((drug, index) => (
              <div
                key={index}
                className="p-4 bg-white border rounded-lg shadow-sm"
              >
                <div className="font-semibold text-gray-900">{drug.name}</div>
                <div className="text-sm text-gray-500">{drug.form}</div>

                <p className="text-sm mt-2">
                  <strong>Uses:</strong> {drug.uses}
                </p>
                <p className="text-sm">
                  <strong>Modern Equivalent:</strong> {drug.modern_equivalent}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Classification:</strong> {drug.modern_classification}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {drugData && drugData.error && (
        <div className="mt-6 p-4 bg-red-100 text-red-600 rounded-lg">
          {drugData.error}
        </div>
      )}

      {error && (
        <p className="text-red-500 text-center mt-4 text-sm">{error}</p>
      )}
    </div>
  );
};

export default ConditionForm;
