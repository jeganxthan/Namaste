import express from "express";
import {
  createCondition,
  getAllConditions,
  getConditionById,
  deleteCondition
} from "../controllers/conditionController.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

// 🧑‍⚕️ Admin only
router.post("/", protect, adminOnly, createCondition);
router.delete("/:id", protect, adminOnly, deleteCondition);

// 👤 Both Admin and User
router.get("/", protect, getAllConditions);
router.get("/:id", protect, getConditionById);

export default router;
