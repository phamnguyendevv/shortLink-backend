import express from "express";
import wrapAsync from "../../utils/handlers.js";
import linkController from "../../controllers/linkController.js";
const router = express.Router();
let clickCount = 0; // Biến đếm số lần click

router.get("/create" , linkController.createLink); // Tạo link mới
router.get("/get-link", linkController.getLink); // Lấy thông tin link



export default router;
