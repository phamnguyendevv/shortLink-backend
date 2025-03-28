import express from "express";
import authRouter from "./auth/authRoutes.js";
import teamRouter from "./auth/teamRoutes.js";

const router = express.Router();

router.get("/api/v0", (req, res) => {
  res.send("Shope web here!");
});

router.use("/auth", authRouter);
router.use("/team", teamRouter);

export default router;
