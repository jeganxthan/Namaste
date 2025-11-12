import React, { useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import Input from "../../component/input/Input";
import { API_PATHS, BASE_URL } from "../../constants/apiPaths";
import { UserContext } from "../../context/UserProvider";

const SignIn = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false); // ✅ local state

  const navigate = useNavigate();
  const { updateUser } = useContext(UserContext);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    setError("");

    try {
      const response = await axios.post(
        `${BASE_URL}${API_PATHS.AUTH.LOGIN}`,
        { email, password },
        { headers: { "Content-Type": "application/json" } }
      );


      // ✅ Save user + token in context and localStorage
      updateUser({
        ...response.data.user,
        token: response.data.token,
      });

      navigate("/dashboard/conditions");
    } catch (err) {
      console.error("❌ Login failed:", err);
      setError(err.response?.data?.message || "Invalid credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
        <h2 className="text-3xl font-bold mb-6 text-center text-gray-900">Sign In</h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            label="Email"
            type="email"
            placeholder="Enter your Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <Input
            label="Password"
            type="password"
            placeholder="Enter your Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button
            type="submit"
            disabled={loading}
            className="bg-[#1947a8] w-full py-2 text-white font-medium rounded-lg hover:bg-[#638ee8] disabled:opacity-50 transition duration-200"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div className="mt-4 text-center text-sm">
          Don&apos;t have an account?{" "}
          <Link to="/signup" className="text-blue-700 hover:underline">
            Sign Up
          </Link>
        </div>

        {error && <p className="text-red-500 text-sm text-center mt-3">{error}</p>}
      </div>
    </div>
  );
};

export default SignIn;
