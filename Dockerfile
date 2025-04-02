# Base image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package.json và yarn.lock trước để cache dependencies
COPY package.json yarn.lock ./

# Cài đặt cả devDependencies để có @types/*
RUN yarn install --frozen-lockfile

# Copy toàn bộ source code
COPY . .

# Generate Prisma client (nếu có Prisma)
RUN yarn prisma generate

# Build TypeScript project
RUN yarn build

# Chạy ứng dụng
CMD ["yarn", "start"]
