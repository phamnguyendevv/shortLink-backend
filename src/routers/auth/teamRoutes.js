import express from "express";
import wrapAsync from "../../utils/handlers.js";
import teamController from "../../controllers/teamController.js";
import {
  authorizeRoles,
  isAuthenticatedUser,
} from "../../middlewares/authMiddlewares.js";
import { Rights } from "../../constants/rights.js";

const router = express.Router();

router.post(
  "",
  isAuthenticatedUser,
  authorizeRoles(Rights.TEAM_ADMIN, Rights.ADMIN),
  wrapAsync(teamController.createTeam)
);

router.get("", isAuthenticatedUser, wrapAsync(teamController.getTeam));

router.post(
  "remove-user/:id",
  isAuthenticatedUser,
  authorizeRoles(Rights.TEAM_ADMIN, Rights.ADMIN),
  wrapAsync(teamController.removeUser)
);

router.post(
  "list-team",
  isAuthenticatedUser,
  authorizeRoles(Rights.ADMIN),
  wrapAsync(teamController.listTeam)
);






export default router;
