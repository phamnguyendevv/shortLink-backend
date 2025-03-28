import { validationResult } from "express-validator";
import HTTP_STATUS from "../constants/httpStatus.js";

const validate = (validations) => async (req, res, next) => {
  for (const validation of validations) {
    await validation.run(req);
  }

  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return next();
  }

  const firstError = errors.array()[0];
  const message = firstError.msg;
  const status = HTTP_STATUS.UNPROCESSABLE_ENTITY;

  res.status(status).json({ message, status });
};

export default validate;
