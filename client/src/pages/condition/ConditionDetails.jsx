// src/pages/conditions/ConditionDetails.jsx
import React, { useEffect, useState, useContext } from "react";
import { getConditionById } from "../../api/ConditionService";
import { useParams, Link } from "react-router-dom";
import { UserContext } from "../../context/UserProvider";

const ConditionDetails = () => {
  const { id } = useParams();
  const { user } = useContext(UserContext);
  const [condition, setCondition] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchCondition = async () => {
      try {
        const data = await getConditionById(id, user.token);
        setCondition(data);
      } catch (err) {
        setError(err.response?.data?.message || "Error fetching condition");
      }
    };
    fetchCondition();
  }, [id]);

  if (error)
    return <div className="text-center text-red-500 py-10">{error}</div>;

  if (!condition)
    return <div className="text-center py-10 text-gray-600">Loading...</div>;

  return (
    <div className="max-w-3xl mx-auto bg-white p-8 rounded-lg shadow mt-10">
      <h1 className="text-2xl font-bold mb-4">Condition Details</h1>
      <p><strong>Clinical Status:</strong> {condition.clinicalStatus}</p>
      <p><strong>Verification Status:</strong> {condition.verificationStatus}</p>
      <p><strong>Category:</strong> {condition.category}</p>
      <p><strong>Severity:</strong> {condition.severity}</p>

      <h3 className="font-semibold mt-4">Coding:</h3>
      <ul className="list-disc ml-6">
        {condition.code?.coding?.map((c, i) => (
          <li key={i}>
            {c.system}: {c.code} — {c.display}
          </li>
        ))}
      </ul>

      <p className="mt-4">
        <strong>Assigned To:</strong> {condition.assignedTo?.name}
      </p>
      <p>
        <strong>Assigned By:</strong> {condition.assignedBy?.name}
      </p>

      <Link
        to="/conditions"
        className="block text-center mt-6 text-blue-600 hover:underline"
      >
        ← Back to Conditions
      </Link>
    </div>
  );
};

export default ConditionDetails;
