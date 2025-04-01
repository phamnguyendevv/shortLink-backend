# Sử dụng Node.js v20 làm base image
FROM node:20

# Thiết lập thư mục làm việc trong container
WORKDIR /app

# Sao chép package.json và package-lock.json trước để tận dụng Docker cache
COPY package*.json ./

# Cài đặt dependencies nhưng không cài devDependencies (nếu không cần)
RUN yarn install

# Sao chép toàn bộ mã nguồn vào container
COPY . .

# Chạy Prisma generate sau khi có toàn bộ source code
RUN yarn prisma generate 

# Biên dịch TypeScript (nếu dự án của bạn cần)
RUN yarn build

# Mở cổng 8080
EXPOSE 8080

# Khởi chạy ứng dụng
CMD ["node", "dist/index.js"]
