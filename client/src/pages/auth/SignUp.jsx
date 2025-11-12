import React, { useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { validateEmail } from "../../constants/helper";
import { API_PATHS, BASE_URL } from "../../constants/apiPaths";
import Input from "../../component/input/Input";
import { UserContext } from "../../context/UserProvider";

const SignUp = () => {
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { updateUser } = useContext(UserContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    setError(null);

    // ✅ Basic validations
    if (!validateEmail(email.trim())) {
      setError("Please enter a valid email address.");
      setLoading(false);
      return;
    }
    if (!password || password.length < 8) {
      setError("Password must be at least 8 characters long.");
      setLoading(false);
      return;
    }

    try {
      const payload = { name, username, email: email.trim(), password };
      const response = await axios.post(
        `${BASE_URL}${API_PATHS.AUTH.REGISTER}`,
        payload,
        { headers: { "Content-Type": "application/json" } }
      );

      console.log("✅ Signup response:", response.data);

      updateUser(response.data);
      navigate(`/conditions`);
    } catch (err) {
      console.error("❌ Signup failed:", err);
      setError(
        err?.response?.data?.message ||
          err.message ||
          "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 px-4">
      <div className="w-full max-w-md bg-white text-black rounded-2xl shadow-lg p-8">
        <h2 className="text-3xl font-bold mb-6 text-center">Sign Up</h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            label="Full Name"
            type="text"
            placeholder="Enter your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <Input
            label="Username"
            type="text"
            placeholder="Choose a username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />

          <Input
            label="Email"
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <Input
            label="Password"
            type="password"
            placeholder="Create a password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button
            type="submit"
            disabled={loading}
            className="bg-[#1947a8] w-full py-2 text-white font-medium rounded-lg hover:bg-[#638ee8] disabled:opacity-50 transition duration-200"
          >
            {loading ? "Signing up..." : "Sign Up"}
          </button>
        </form>

        <div className="mt-4 text-center text-sm">
          Already have an account?{" "}
          <Link to="/" className="text-blue-700 hover:underline">
            Log in
          </Link>
        </div>

        {error && (
          <p className="text-red-500 text-sm text-center mt-3">{error}</p>
        )}
      </div>
    </div>
  );
};

export default SignUp;
