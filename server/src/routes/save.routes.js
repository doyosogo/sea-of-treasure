import { Router } from "express";
import { getSave, putSave } from "../controllers/save.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/", requireAuth, getSave);
router.put("/", requireAuth, putSave);

export default router;
