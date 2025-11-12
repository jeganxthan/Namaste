import express from "express";
import {
  getAllConceptMaps,
  translateCode,
  translateByName
} from "../controllers/conceptMapController.js";
import { adminOnly, protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/",protect,adminOnly, getAllConceptMaps);
router.get("/$translate",protect,  translateCode);
router.get("/$translate",protect,  translateByName);

export default router;
