import express from "express";
import wrapAsync from "../../utils/handlers.js";
import authController from "../../controllers/authController.js";
import userMiddlewares from "../../middlewares/userMiddewares.js";
import {
  authorizeRoles,
  isAuthenticatedUser,
} from "../../middlewares/authMiddlewares.js";
import { Rights } from "../../constants/rights.js";
const router = express.Router();

router.post(
  "/signup",
  userMiddlewares.registerValidator,
  isAuthenticatedUser,
  authorizeRoles(Rights.TEAM_ADMIN, Rights.ADMIN),
  wrapAsync(authController.registerController)
);

router.post(
  "/signup-with-team",
  userMiddlewares.registerValidator,
  isAuthenticatedUser,
  authorizeRoles(Rights.ADMIN),
  wrapAsync(authController.registerWithTeamController)
);

router.post(
  "/signin",
  userMiddlewares.loginValidator,
  wrapAsync(authController.loginController)
);

router.post("/token", wrapAsync(authController.refreshToken));

router.patch(
  "/update",
  isAuthenticatedUser,
  wrapAsync(authController.updateUser)
);

export default router;
