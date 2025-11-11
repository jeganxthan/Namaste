import Condition from "../models/Conditions.js";
import User from "../models/User.js";
import ConceptMap from "../models/ConceptMap.js";

/**
 * ✅ Create a new Condition (Admin only)
 * Automatically links condition to user and stores creator info
 */
export const createCondition = async (req, res) => {
  try {
    const {
      userId,
      code,
      clinicalStatus,
      verificationStatus,
      category,
      severity,
    } = req.body;

    // ✅ Only admin can create
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Only admins can create conditions" });
    }

    // ✅ Check if target user exists
    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({ message: "Target user not found" });
    }

    // ✅ Validate code structure
    if (!code || !code.coding || code.coding.length === 0) {
      return res.status(400).json({ message: "Condition code is required" });
    }

    // ✅ Prevent duplicate condition assignment
    const existingCondition = await Condition.findOne({
      "code.coding.code": code.coding[0].code,
      assignedTo: userId,
    });
    if (existingCondition) {
      return res.status(400).json({
        message: "This condition already exists for this user",
      });
    }

    // ✅ Automatically map AYUSH → ICD-11 (if ConceptMap exists)
    const ayushCode = code.coding.find((c) => c.system === "NAMASTE")?.code;
    if (ayushCode) {
      const map = await ConceptMap.findOne({ "group.element.code": ayushCode });
      if (map) {
        const group = map.group.find((g) =>
          g.element.some((el) => el.code === ayushCode)
        );
        const element = group?.element.find((el) => el.code === ayushCode);
        const icdTarget = element?.target?.[0];

        if (icdTarget) {
          code.coding.push({
            system: "ICD-11",
            code: icdTarget.code,
            display: icdTarget.display,
          });
        }
      }
    }

    // ✅ Create new condition
    const condition = new Condition({
      resourceType: "Condition",
      clinicalStatus,
      verificationStatus,
      category,
      severity,
      code,
      subject: {
        reference: `User/${targetUser._id}`,
        display: targetUser.name,
      },
      createdBy: req.user._id, // Admin
      assignedTo: targetUser._id, // User
    });

    await condition.save();

    res.status(201).json({
      message: `Condition assigned to ${targetUser.name}`,
      assignedBy: req.user.name,
      condition,
    });
  } catch (error) {
    console.error("❌ Condition creation error:", error);
    res
      .status(400)
      .json({ message: "Error creating condition", error: error.message });
  }
};

/**
 * ✅ Get all Conditions
 * - Admin → all conditions
 * - User → only their own
 */
export const getAllConditions = async (req, res) => {
  try {
    const query =
      req.user.role === "admin" ? {} : { assignedTo: req.user._id };

    const conditions = await Condition.find(query)
      .populate("assignedTo", "name email role")
      .populate("createdBy", "name email role");

    if (!conditions.length)
      return res.status(404).json({
        message:
          req.user.role === "admin"
            ? "No conditions found"
            : "You have no conditions assigned yet",
      });

    res.status(200).json({
      user: {
        _id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
      },
      totalConditions: conditions.length,
      conditions: conditions.map((c) => ({
        id: c._id,
        clinicalStatus: c.clinicalStatus,
        verificationStatus: c.verificationStatus,
        category: c.category,
        severity: c.severity,
        code: c.code,
        subject: c.subject,
        assignedTo: c.assignedTo
          ? { name: c.assignedTo.name, email: c.assignedTo.email }
          : null,
        assignedBy: c.createdBy
          ? { name: c.createdBy.name, email: c.createdBy.email }
          : null,
        createdAt: c.createdAt,
      })),
    });
  } catch (err) {
    console.error("❌ Error fetching conditions:", err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * ✅ Get a single Condition by ID
 * - Admin can view any
 * - User can view only their own
 */
export const getConditionById = async (req, res) => {
  try {
    const condition = await Condition.findById(req.params.id)
      .populate("assignedTo", "name email")
      .populate("createdBy", "name email");

    if (!condition) return res.status(404).json({ error: "Condition not found" });

    // ✅ Role-based restriction
    if (
      req.user.role !== "admin" &&
      condition.assignedTo._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: "Access denied" });
    }

    res.status(200).json({
      id: condition._id,
      clinicalStatus: condition.clinicalStatus,
      verificationStatus: condition.verificationStatus,
      category: condition.category,
      severity: condition.severity,
      code: condition.code,
      subject: condition.subject,
      assignedTo: {
        name: condition.assignedTo?.name,
        email: condition.assignedTo?.email,
      },
      assignedBy: {
        name: condition.createdBy?.name,
        email: condition.createdBy?.email,
      },
      createdAt: condition.createdAt,
    });
  } catch (err) {
    console.error("❌ Error fetching condition:", err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * ✅ Delete a Condition (Admin only)
 */
export const deleteCondition = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Only admins can delete conditions" });
    }

    const condition = await Condition.findByIdAndDelete(req.params.id);
    if (!condition)
      return res.status(404).json({ message: "Condition not found" });

    res.status(200).json({
      message: "Condition deleted successfully",
      deletedId: condition._id,
    });
  } catch (error) {
    console.error("❌ Condition deletion error:", error);
    res.status(500).json({ message: error.message });
  }
};
