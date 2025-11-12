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

  const renderRecord = (data) => {
    if (!data) return null;

    const keys = Object.keys(data).filter(
      (k) => !["_id", "__v", "system"].includes(k)
    );

    return (
      <div className="mt-6 bg-white shadow-md rounded-lg p-6 border border-gray-200">
        <h2
          className={`text-xl font-semibold mb-4 ${
            data.system === "SIDDHA" ? "text-green-600" : "text-[#1947a8]"
          }`}
        >
          {data.system === "SIDDHA" ? "🕉️ Siddha Mapping" : "🪷 Ayurveda Mapping"}
        </h2>

        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-300 text-sm">
            <tbody>
              {keys.map((key) => (
                <tr key={key} className="border-b hover:bg-gray-50">
                  <td className="p-2 font-medium text-gray-600">{key}</td>
                  <td className="p-2 text-gray-800">{String(data[key])}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto mt-10 p-8 bg-white shadow rounded-lg">
      <h1 className="text-2xl font-bold mb-6 text-center text-[#1947a8]">
        ConceptMap Translation Viewer
      </h1>

      {/* 🔹 Search Form */}
      <form
        onSubmit={handleSearch}
        className="flex flex-col sm:flex-row gap-4 items-center mb-6"
      >
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Enter AYUSH Code (e.g. SI-1.7)"
          className="w-full sm:flex-1 border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-400 focus:outline-none"
        />

        <button
          type="submit"
          disabled={loading}
          className="bg-[#1947a8] text-white px-4 py-2 rounded-lg hover:bg-[#638ee8] disabled:opacity-50"
        >
          {loading ? "Searching..." : "Search"}
        </button>
      </form>

      {/* 🔹 Error */}
      {error && (
        <p className="text-red-500 text-center mb-4 font-medium">{error}</p>
      )}

      {/* 🔹 Results */}
      {result && renderRecord(result)}
    </div>
  );
};

export default ConceptMapTranslate;
