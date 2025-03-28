import dotenv from "dotenv";

dotenv.config();

export const config = {
  database: {
    url: process.env.DATABASE_URL,
    directUrl: process.env.DIRECT_URL,
  },
  jwt: {
    accessKey: process.env.JWT_ACCESS_KEY,
  },
  server: {
    port: process.env.PORT || 3000,
    env: process.env.NODE_ENV || "development",
  },
};
