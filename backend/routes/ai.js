import express from "express";
import { protect } from "../middleware/auth.js";

import {
  chatAnalysis,
  morningMotivation,
  recoveryPlan,
  suggestHabits,
  weeklyReport,
} from "../controllers/aiController.js";

const router = express.Router();

router.use(protect);

router.post("/weekly-report", weeklyReport);
router.post("/suggest-habits", suggestHabits);
router.post("/recovery-plan", recoveryPlan);
router.post("/chat", chatAnalysis);
router.get("/morning", morningMotivation);

export default router;