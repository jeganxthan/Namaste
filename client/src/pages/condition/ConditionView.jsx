import React, { useEffect, useState, useContext } from "react";
import { useParams, Link } from "react-router-dom";
import { UserContext } from "../../context/UserProvider";
import { getConditionById } from "../../api/ConditionService";

const ConditionView = () => {
  const { id } = useParams();
  const { token } = useContext(UserContext);
  const [condition, setCondition] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchCondition = async () => {
      try {
        const data = await getConditionById(id, token);
        setCondition(data);
      } catch (err) {
        console.error("❌ Error fetching condition:", err);
        setError(
          err.response?.data?.message || "Failed to fetch condition details"
        );
      } finally {
        setLoading(false);
      }
    };

    if (token) fetchCondition();
  }, [id, token]);

  if (loading)
    return <div className="text-center py-10 text-lg">Loading condition...</div>;
  if (error)
    return <div className="text-center py-10 text-red-500">{error}</div>;
  if (!condition)
    return (
      <div className="text-center py-10 text-gray-500">Condition not found.</div>
    );

  return (
    <div className="max-w-3xl mx-auto p-8 bg-white shadow rounded-lg mt-10">
      <h1 className="text-2xl font-bold mb-6 text-center text-[#1947a8]">
        Condition Details
      </h1>

      <div className="space-y-4 text-gray-800">
        <p>
          <strong>Condition ID:</strong> {condition.id}
        </p>

        <p>
          <strong>Code:</strong>{" "}
          {condition.code?.coding?.map((cd) => (
            <span key={cd.code}>
              {cd.code} ({cd.system}) - {cd.display}
            </span>
          ))}
        </p>

        <p>
          <strong>Condition Name:</strong> {condition.code?.text || "N/A"}
        </p>

        <p>
          <strong>Category:</strong> {condition.category?.join(", ") || "N/A"}
        </p>

        <p>
          <strong>Severity:</strong>{" "}
          <span
            className={`px-2 py-1 rounded text-white text-sm ${
              condition.severity === "severe"
                ? "bg-red-500"
                : condition.severity === "moderate"
                ? "bg-yellow-500"
                : "bg-green-500"
            }`}
          >
            {condition.severity}
          </span>
        </p>

        <p>
          <strong>Clinical Status:</strong>{" "}
          <span
            className={`px-2 py-1 rounded text-white text-sm ${
              condition.clinicalStatus === "active"
                ? "bg-green-600"
                : "bg-gray-500"
            }`}
          >
            {condition.clinicalStatus}
          </span>
        </p>

        <p>
          <strong>Verification Status:</strong>{" "}
          {condition.verificationStatus || "N/A"}
        </p>

        {/* ✅ Assigned To */}
        <p>
          <strong>Assigned To:</strong>{" "}
          {condition.assignedTo?.name || condition.subject?.display || "N/A"} (
          {condition.assignedTo?.email || "No email"})
        </p>

        {/* ✅ Assigned By */}
        <p>
          <strong>Assigned By:</strong>{" "}
          {condition.assignedBy?.name || "N/A"} (
          {condition.assignedBy?.email || "No email"})
        </p>

        <p>
          <strong>Created At:</strong>{" "}
          {new Date(condition.createdAt).toLocaleString()}
        </p>
      </div>

      <div className="text-center mt-8">
        <Link
          to="/dashboard/conditions"
          className="bg-[#1947a8] text-white px-4 py-2 rounded hover:bg-[#638ee8]"
        >
          ← Back to Conditions
        </Link>
      </div>
    </div>
  );
};

export default ConditionView;
