import validate from "../utils/validate.js"; // Đảm bảo đường dẫn đúng
import USERS_MESSAGES from "../constants/messages.js";
import { checkSchema } from "express-validator";
import { PrismaClient } from "@prisma/client";
import { comparePassword } from "../utils/password.js";

const prisma = new PrismaClient();

let userMiddlewares = {
  //register validator
  registerValidator: validate(
    checkSchema(
      {
        email: {
          trim: true,
          isEmail: {
            errorMessage: USERS_MESSAGES.INVALID_EMAIL,
          },
          matches: {
            options: [/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/],
            errorMessage: USERS_MESSAGES.INVALID_EMAIL,
          },
          custom: {
            options: async (value) => {
              try {
                const user = await prisma.user.findUnique({
                  where: {
                    email: value,
                  },
                });
                if (!user) {
                  return true;
                } else {
                  throw new Error(USERS_MESSAGES.EMAIL_ALREADY_EXISTS);
                }
              } catch (error) {
                console.log(error);
                throw new Error(USERS_MESSAGES.EMAIL_ALREADY_EXISTS);
              }
            },
          },
        },
        password: {
          trim: true,
          isLength: {
            options: { min: 2 },
            errorMessage:
              USERS_MESSAGES.PASSWORD_MUST_BE_LONGER_THAN_6_CHARACTERS,
          },
        },
      },
      ["body"]
    )
  ),

  //login validator
  loginValidator: validate(
    checkSchema(
      {
        email: {
          trim: true,
          isEmail: {
            errorMessage: USERS_MESSAGES.INVALID_EMAIL,
          },
          custom: {
            options: async (value, { req }) => {
              console.log(value);
              const user = await prisma.user.findUnique({
                where: {
                  email: value,
                },
              });
              if (!user) {
                throw new Error(USERS_MESSAGES.USER_NOT_FOUND);
              }

              req.user = user;

              return true;
            },
          },
        },
        password: {
          trim: true,
          isLength: {
            options: { min: 0 },
            errorMessage: USERS_MESSAGES.MATCH_PASSWORD,
          },
          custom: {
            options: async (value, { req }) => {
              const user = req.user;
              const password = user.password;
              const isMatch = await comparePassword(value, password);
              if (!isMatch) {
                throw new Error(USERS_MESSAGES.PASSWORD_NOT_MATCH);
              }
              return true;
            },
          },
        },
      },
      ["body"]
    )
  ),

  updateValidator: validate(
    checkSchema(
      {
        id: {
          custom: {
            options: async (value, { req }) => {
              const { id } = req.user;
              const user = await prisma.user.findUnique({
                where: {
                  id: value,
                },
              });
              if (!user) {
                throw new Error(USERS_MESSAGES.USER_NOT_FOUND);
              }
              return true;
            },
          },
        },
      },
      ["body"]
    )
  ),

  changePassword: validate(
    checkSchema(
      {
        id: {
          trim: true,
          custom: {
            options: async (value, { req }) => {
              const user = await prisma.user.findUnique({
                where: {
                  id: value,
                },
              });
              if (!user) {
                throw new Error(USERS_MESSAGES.USER_NOT_FOUND);
              }
              // check ban hay ko
              req.user = user;
              return true;
            },
          },
        },
        oldPassword: {
          trim: true,
          isLength: {
            options: { min: 3 },
            errorMessage: USERS_MESSAGES.MATCH_PASSWORD,
          },
          custom: {
            options: async (value, { req }) => {
              const user = req.user;
              const password = user.password;
              const isMatch = await comparePassword(value, password);
              if (!isMatch) {
                throw new Error(USERS_MESSAGES.PASSWORD_NOT_MATCH);
              }
              return true;
            },
          },
        },
      },
      ["body"]
    )
  ),

  // Validator cho việc tạo user và team cùng lúc
  registerWithTeamValidator: validate(
    checkSchema(
      {
        email: {
          trim: true,
          isEmail: {
            errorMessage: USERS_MESSAGES.INVALID_EMAIL,
          },
          matches: {
            options: [/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/],
            errorMessage: USERS_MESSAGES.INVALID_EMAIL,
          },
          custom: {
            options: async (value) => {
              try {
                const user = await prisma.user.findUnique({
                  where: {
                    email: value,
                  },
                });
                if (!user) {
                  return true;
                } else {
                  throw new Error(USERS_MESSAGES.EMAIL_ALREADY_EXISTS);
                }
              } catch (error) {
                console.log(error);
                throw new Error(USERS_MESSAGES.EMAIL_ALREADY_EXISTS);
              }
            },
          },
        },
        password: {
          trim: true,
          isLength: {
            options: { min: 2 },
            errorMessage:
              USERS_MESSAGES.PASSWORD_MUST_BE_LONGER_THAN_6_CHARACTERS,
          },
        },
        teamName: {
          trim: true,
          notEmpty: {
            errorMessage: "Tên team không được để trống",
          },
          isLength: {
            options: { min: 2, max: 100 },
            errorMessage: "Tên team phải từ 2-100 ký tự",
          },
        },
        teamTargetUrl: {
          trim: true,
          notEmpty: {
            errorMessage: "Target URL không được để trống",
          },
          isURL: {
            errorMessage: "Target URL không hợp lệ",
          },
        },
      },
      ["body"]
    )
  ),
};

export default userMiddlewares;
