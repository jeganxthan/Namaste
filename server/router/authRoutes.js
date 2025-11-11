import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  registerUser,
  loginUser,
  getUserProfile,
} from "../controllers/authController.js";
import uploadImages from "../controllers/uploadController.js";
import multer from "multer";  // Add Multer

const router = express.Router();

// Set up Multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/profile");
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const profileUpload = multer({ storage });  // Initialize Multer with storage settings

// User authentication routes
router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/profile", protect, getUserProfile);

// Image upload route (single image upload)
router.post("/upload-image", profileUpload.single('profileImage'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" });
  }
  const imageUrl = `${req.protocol}://${req.get("host")}/uploads/profile/${req.file.filename}`;
  res.status(200).json({ imageUrl });
});

// Profile upload route (multiple fields)
router.put(
  "/upload-profile",
  protect,
  profileUpload.fields([{ name: "profileImage", maxCount: 1 }]), 
  uploadImages  // assuming this handles additional logic like saving URL to DB
);

export default router;
