import React, { useState } from "react";
import { Eye, EyeClosed } from "lucide-react";

const Input = ({
  value,
  onChange,
  label,
  placeholder,
  type = "text",
  name, // ✅ accept name
}) => {
  const [showPassword, setShowPassword] = useState(false);

  const toggleShowPassword = () => setShowPassword(!showPassword);

  return (
    <div className="w-full">
      <label className="block text-gray-700 font-medium mb-1">{label}</label>
      <div className="relative w-full">
        <input
          name={name} // ✅ pass name to make e.target.name work
          type={type === "password" && showPassword ? "text" : type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-black"
        />
        {type === "password" && (
          <div
            className="absolute inset-y-0 right-4 flex items-center cursor-pointer top-2"
            onClick={toggleShowPassword}
          >
            {showPassword ? <Eye size={20} /> : <EyeClosed size={20} />}
          </div>
        )}
      </div>
    </div>
  );
};

export default Input;
