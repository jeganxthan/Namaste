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

  const navigate = useNavigate();

  const { updateUser, setLoading, loading } = useContext(UserContext);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await axios.post(
        `${BASE_URL}${API_PATHS.AUTH.LOGIN}`,
        { email, password },
        { headers: { "Content-Type": "application/json" } }
      );

      console.log("Response:", response.data);

      updateUser({
        ...response.data.user, 
        token: response.data.token,
      });

      navigate("/dashboard");
    } catch (err) {
      console.error("Error during login:", err);
      setError(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center align-middle mt-10 max-w-md mx-auto">
      <div className="mt-10 p-6 border bg-white text-black rounded-2xl h-100%">
        <h2 className="text-2xl font-bold mb-4 text-center">Sign In</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
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
            className="bg-[#1947a8] w-full p-2 hover:bg-[#638ee8] text-white disabled:opacity-50 rounded-lg"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div className="my-4 text-center">
          Don&apos;t have an account?{" "}
          <Link to="/signup" className="text-blue-700">
            Sign Up
          </Link>
        </div>

        {error && (
          <p className="text-red-500 text-sm text-center mt-2">{error}</p>
        )}
      </div>
    </div>
  );
};

export default SignIn;
