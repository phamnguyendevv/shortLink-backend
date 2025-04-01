FROM node:20-alpine
WORKDIR /app

# 1. Copy package files trước
COPY package.json yarn.lock ./

# 2. Cài đặt dependencies
RUN yarn install --frozen-lockfile --production

# 3. Copy TOÀN BỘ source code (bao gồm cả thư mục prisma)
COPY . .

# 4. Chạy prisma generate sau khi đã có đủ file
RUN yarn prisma generate

# 5. Build ứng dụng (nếu cần)
RUN yarn build

CMD ["yarn", "start"]