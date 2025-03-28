import Joi from "joi";
import { ValidationError } from "../errors/AppError.js";

const teamSchema = Joi.object({
  name: Joi.string().required().min(3).max(50),
  description: Joi.string().required().min(10),
  status: Joi.string().valid("active", "inactive").default("active"),
  targetUrl: Joi.string().uri(),
});

export const validateTeam = (data) => {
  const { error } = teamSchema.validate(data);
  if (error) {
    throw new ValidationError(error.details[0].message);
  }
  return data;
};

export const validateTeamId = (id) => {
  if (!id || isNaN(id)) {
    throw new ValidationError("Invalid team ID");
  }
  return parseInt(id);
};

export const validateUserId = (userId) => {
  if (!userId || isNaN(userId)) {
    throw new ValidationError("Invalid user ID");
  }
  return parseInt(userId);
};
