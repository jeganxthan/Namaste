import React, { useState, useContext } from "react";
import axios from "axios";
import { UserContext } from "../../context/UserProvider";
import { BASE_URL } from "../../constants/apiPaths";

const ConceptMapTranslate = () => {
  const { token } = useContext(UserContext);
  const [code, setCode] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  /* ------------------ HANDLE SEARCH ------------------ */
  const handleSearch = async (e) => {
    e.preventDefault();
    setError("");
    setResult(null);

    if (!code.trim()) {
      setError("Please enter an AYUSH code to search.");
      return;
    }

    setLoading(true);
    try {
      const endpoint = `${BASE_URL}/fhir/ConceptMap/$translate?code=${encodeURIComponent(
        code.trim()
      )}`;

      const res = await axios.get(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setResult(res.data);
    } catch (err) {
      console.error("❌ Translation error:", err);
      setError(err.response?.data?.message || "No record found.");
    } finally {
      setLoading(false);
    }
  };

  /* ------------------ RENDER RECORD ------------------ */
  const renderRecord = (data) => {
    if (!data) return null;

    const { system, drug_information, Short_definition, Long_definition, structured, ...rest } = data;

    const color = system === "SIDDHA" ? "text-green-600" : "text-blue-700";

    return (
      <div className="mt-6 bg-white shadow-md rounded-2xl p-6 border border-gray-200 space-y-5">
        <h2 className={`text-2xl font-semibold ${color}`}>
          {system === "SIDDHA" ? "🕉️ Siddha Mapping" : "🪷 Ayurveda Mapping"}
        </h2>

        {/* Display Key Fields */}
        <div className="grid md:grid-cols-2 gap-4 text-sm">
          {Object.entries(rest)
            .filter(([key]) => !["_id", "__v"].includes(key))
            .map(([key, value]) => (
              <div key={key} className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                <p className="font-semibold text-gray-600 capitalize">{key}</p>
                <p className="text-gray-800 break-words">
                  {typeof value === "object" ? JSON.stringify(value, null, 2) : String(value)}
                </p>
              </div>
            ))}
        </div>

        {/* Short Definition */}
        {Short_definition && (
          <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-xl">
            <h3 className="font-semibold text-yellow-700 mb-1">🩺 Short Definition:</h3>
            <p className="text-gray-800">{Short_definition}</p>
          </div>
        )}

        {/* Long Definition */}
        {Long_definition && (
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl">
            <h3 className="font-semibold text-blue-700 mb-1">📖 Long Definition:</h3>
            <p className="text-gray-800 whitespace-pre-wrap">{Long_definition}</p>
          </div>
        )}

        {/* ------------------ DRUG INFORMATION PANEL ------------------ */}
        {drug_information?.drugs?.length > 0 && (
          <div className="bg-green-50 border border-green-200 p-5 rounded-2xl">
            <h3 className="font-semibold text-green-700 text-lg mb-3">🌿 Drug & Treatment Information</h3>

            <table className="min-w-full text-sm border border-gray-300 rounded-lg overflow-hidden">
              <thead className="bg-green-100 text-left">
                <tr>
                  <th className="px-3 py-2 border-b">Drug Name</th>
                  <th className="px-3 py-2 border-b">Form</th>
                  <th className="px-3 py-2 border-b">Uses</th>
                  <th className="px-3 py-2 border-b">Modern Equivalent</th>
                  <th className="px-3 py-2 border-b">Classification</th>
                </tr>
              </thead>
              <tbody>
                {drug_information.drugs.map((drug, i) => (
                  <tr key={i} className="hover:bg-green-50">
                    <td className="px-3 py-2 border-b font-medium">{drug.name}</td>
                    <td className="px-3 py-2 border-b">{drug.form}</td>
                    <td className="px-3 py-2 border-b">{drug.uses}</td>
                    <td className="px-3 py-2 border-b font-semibold text-green-700">
                      {drug.modern_equivalent}
                    </td>
                    <td className="px-3 py-2 border-b text-gray-600">
                      {drug.modern_classification}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  /* ------------------ UI ------------------ */
  return (
    <div className="max-w-5xl mx-auto mt-10 p-8 bg-gradient-to-br from-blue-50 to-white shadow-lg rounded-2xl border border-gray-100">
      <h1 className="text-3xl font-bold mb-8 text-center text-[#1947a8]">
        🧠 ConceptMap Translation Viewer
      </h1>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4 items-center mb-6">
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Enter AYUSH Code (e.g. AAA1.1, SI-1.7)"
          className="w-full sm:flex-1 border border-gray-300 rounded-lg p-3 text-lg focus:ring-2 focus:ring-blue-400"
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-[#1947a8] text-white px-6 py-3 rounded-lg hover:bg-[#517ce9] disabled:opacity-50 transition"
        >
          {loading ? "Translating..." : "Translate"}
        </button>
      </form>

      {/* Error */}
      {error && (
        <div className="text-red-600 text-center bg-red-50 border border-red-200 rounded-xl p-3 mb-5">
          ⚠️ {error}
        </div>
      )}

      {/* Results */}
      {result && renderRecord(result)}
    </div>
  );
};

export default ConceptMapTranslate;
