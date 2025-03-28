import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import { config } from "./config/config.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import rootRouter from "./routers/index.js";

const app = express();

// Middleware
app.use(helmet());
app.use(compression());
app.use(morgan("dev"));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use(rootRouter);

// Error handling
app.use(errorHandler);

// 404 handler
app.use((req, res, next) => {
  res.status(404).json({
    status: "error",
    message: "Route not found",
  });
});



const PORT = config.server.port;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
