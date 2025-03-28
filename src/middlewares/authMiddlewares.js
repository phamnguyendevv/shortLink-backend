import wrapAsync from "../utils/handlers.js";
import HTTP_STATUS from "../constants/httpStatus.js";
import { decoToken } from "../utils/jwt.js";
import { PrismaClient } from "@prisma/client";

import dotenv from "dotenv";

dotenv.config();
const prisma = new PrismaClient();

export const isAuthenticatedUser = wrapAsync(async (req, res, next) => {
  const token = req.headers["x-access-token"] || req.headers["authorization"];

  // Kiểm tra xem token có tồn tại không
  if (!token) {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      message: "Token không hợp lệ",
    });
  }

  // Loại bỏ "Bearer " từ token
  const access_token = token.replace(/^Bearer\s+/, "");

  // Kiểm tra xem access_token có hợp lệ không
  if (!access_token || typeof access_token !== "string") {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      message: "Token không hợp lệ",
    });
  }

  try {
    // Giải mã access_token
    let decoded;
    try {
      decoded = await decoToken(access_token);
    } catch (error) {
      console.error("Lỗi khi giải mã token:", error.message || error);
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        message: "Lỗi khi giải mã token",
      });
    }

    // Kiểm tra decoded và decoded.id
    if (!decoded || !decoded.id) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        message: "Lỗi khi giải mã token",
      });
    }

    // Loại bỏ các trường không cần thiết từ decoded
    const { iat, exp, ...userData } = decoded;

    // Lưu userData vào req.user
    req.user = userData;
    next();
  } catch (error) {
    console.error(
      "Người dùng không có quyền truy cập:",
      error.message || error
    );
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      message: "Người dùng không có quyền truy cập",
    });
  }
});

export const authorizeRoles = (...allowedRoles) => {
  return async (req, res, next) => {
    try {
      const user = await prisma.user.findUnique({
        where: {
          id: req.user.id,
        },
      });

      if (!user) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          message: "Không tìm thấy người dùng",
        });
      }

      const userRights = Array.isArray(user.rights)
        ? user.rights
        : [user.rights];

      // Kiểm tra xem có bất kỳ quyền nào của người dùng nằm trong danh sách quyền được phép không
      const hasPermission = userRights.some((right) =>
        allowedRoles.includes(right)
      );

      if (!hasPermission) {
        return res.status(HTTP_STATUS.FORBIDDEN).json({
          message: "Người dùng không có quyền truy cập",
        });
      }

      next();
    } catch (error) {
      console.error("Lỗi xác thực quyền:", error.message || error);
      return res.status(HTTP_STATUS.INTERNAL_SERVER).json({
        message: "Đã xảy ra lỗi khi xác thực quyền",
      });
    }
  };
};
