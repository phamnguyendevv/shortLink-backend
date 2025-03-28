import express from "express";
import authRouter from "./auth/authRoutes.js";
import teamRouter from "./auth/teamRoutes.js";
import linkRouter from "./link/linkRotes.js";


const router = express.Router();

router.get("/health", (req, res) => {
  res.status(200).json({ status: "success", message: "Server is healthy" });
});

router.use("/auth", authRouter);
router.use("/team", teamRouter);
router.get("/link", linkRouter);

export default router;
