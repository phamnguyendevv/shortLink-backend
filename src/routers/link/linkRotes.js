import express from "express";

const router = express.Router();
let clickCount = 0; // Biến đếm số lần click

router.get("/track-link", (req, res) => {
  // Tăng biến đếm
  clickCount++;
  console.log(`Link has been clicked ${clickCount} times.`);

  // Lấy thông tin User-Agent và IP
  const userAgent = req.headers["user-agent"];
  const ip = req.ip;

  console.log(
    `User with IP ${ip} and User-Agent ${userAgent} clicked the link.`
  );

  // Kiểm tra xem có phải là bot không
  const isBot = userAgent.includes("bot") || userAgent.includes("Bot");
  if (isBot) {
    console.log("This is a bot.");
  } else {
    console.log("This is a real user.");
  }

  // Xác định quốc gia của người dùng
  const geo = geoip.lookup(ip);
  if (geo) {
    console.log(`User is from ${geo.country} (${geo.city}).`);
  } else {
    console.log("Could not determine user location.");
  }

  // Chuyển hướng người dùng đến link gốc
  res.redirect("https://pics.alphacoders.com/pictures/view/218404");
});

export default router;
