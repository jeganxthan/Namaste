import express from "express";
import { getAllUsers, getUserWithConditions } from "../controllers/userController.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

// Admin can view all users
router.get("/", protect, adminOnly, getAllUsers);

// Admin can view user details + all conditions
router.get("/:id", protect, adminOnly, getUserWithConditions);

export default router;
