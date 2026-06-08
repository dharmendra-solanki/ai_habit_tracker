import express from "express";
import { protect } from "../middleware/auth.js";

import {
  getAllStats,
  getHabitStats,
  getHeatmap,
  getRange,
  getToday,
  markComplete,
  unmarkComplete,
} from "../controllers/logController.js";

const router = express.Router();

router.use(protect);

router.get("/today", getToday);
router.get("/range", getRange);
router.get("/heatmap", getHeatmap);
router.get("/stats", getAllStats);
router.get("/stats/:habitId", getHabitStats);

router.post("/:habitId", markComplete);

router.delete("/:habitId", unmarkComplete);
router.delete("/:habitId/:date", unmarkComplete);

export default router;
