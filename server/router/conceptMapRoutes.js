import express from "express";
import {
  getAllConceptMaps,
  translate
} from "../controllers/conceptMapController.js";
import { adminOnly, protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/",protect,adminOnly, getAllConceptMaps);
router.get("/$translate",protect,  translate);

export default router;
