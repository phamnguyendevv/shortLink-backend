# Sử dụng một image cơ sở có chứa Node.js
FROM node:20

# Thiết lập thư mục làm việc 
WORKDIR /app

# Sao chép file package.json và package-lock.json vào thư mục làm việc
COPY package*.json ./

# Cài đặt các dependency
RUN npm install

# Sao chép các file còn lại của dự án vào thư mục làm việc
COPY . .

# Cài đặt TypeScript nếu bạn cần biên dịch
RUN npm install -g typescript

# Biên dịch mã TypeScript
RUN tsc

# Mở cổng 8080 để ứng dụng Node.js lắng nghe
EXPOSE 8080

# Khởi chạy ứng dụng
CMD ["node", "dist/index.js"]