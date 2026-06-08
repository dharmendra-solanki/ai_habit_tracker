import express from "express";

import {
  createHabit,
  getHabit,
  updateHabit,
  deleteHabit,
  reorderHabit,
  archiveHabit,
} from "../controllers/habitController.js";

import { protect } from "../middleware/auth.js";

const router = express.Router();

router.use(protect);

router.get("/", getHabit);

router.post("/", createHabit);

router.post("/reorder", reorderHabit);

router.put("/:id", updateHabit);

router.delete("/:id", deleteHabit);

router.post("/:id/archive", archiveHabit);

export default router;