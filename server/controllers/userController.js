import User from "../models/User.js";
import Condition from "../models/Conditions.js";

// ✅ Get all users (Admin only)
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });

    res.status(200).json({
      total: users.length,
      users,
    });
  } catch (error) {
    console.error("❌ Error fetching users:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ✅ Get a specific user by ID and show their Conditions
export const getUserWithConditions = async (req, res) => {
  try {
    const userId = req.params.id;

    const user = await User.findById(userId).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });

    const conditions = await Condition.find({ createdBy: userId }).select(
      "-__v -updatedAt"
    );

    res.status(200).json({
      user,
      totalConditions: conditions.length,
      conditions,
    });
  } catch (error) {
    console.error("❌ Error fetching user details:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
