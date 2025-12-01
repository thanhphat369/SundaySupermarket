# Hướng dẫn cài đặt và thiết lập

## Bước 1: Cài đặt SQL Server

1. Tải và cài đặt SQL Server từ [microsoft.com/sql-server](https://www.microsoft.com/en-us/sql-server/sql-server-downloads)
2. Khởi động SQL Server service
3. Đảm bảo SQL Server đang chạy và có thể kết nối
4. Mở SQL Server Management Studio (SSMS)
5. Chạy file `SQLQuery1.sql` để tạo database `SundaySupermarket` và các bảng

## Bước 2: Thiết lập Backend

1. Di chuyển vào thư mục backend:
```bash
cd backend
```

2. Cài đặt dependencies:
```bash
npm install
```

3. Tạo file `.env`:
```bash
# Copy file mẫu
cp .env.example .env

# Hoặc tạo thủ công file .env với nội dung:
```

4. Chỉnh sửa file `.env`:
```env
PORT=5000
NODE_ENV=development
DB_SERVER=localhost
DB_USER=sa
DB_PASSWORD=your_sql_server_password
DB_NAME=SundaySupermarket
DB_ENCRYPT=false
JWT_SECRET=your_very_secret_jwt_key_change_this_in_production
JWT_EXPIRE=7d
MAX_FILE_SIZE=5242880
```

5. Tạo thư mục uploads:
```bash
mkdir uploads
mkdir uploads/products
mkdir uploads/categories
mkdir uploads/brands
mkdir uploads/avatars
mkdir uploads/reviews
```

6. Tạo tài khoản admin mặc định:
```bash
npm run seed
```

Tài khoản admin mặc định:
- Email: `admin@sunday.com`
- Password: `admin123`

**⚠️ Lưu ý: Đổi mật khẩu ngay sau lần đăng nhập đầu tiên!**

7. Chạy backend:
```bash
# Development mode (với nodemon)
npm run dev

# Production mode
npm start
```

Backend sẽ chạy trên `http://localhost:5000`

## Bước 3: Thiết lập Frontend

1. Di chuyển vào thư mục frontend:
```bash
cd frontend
```

2. Cài đặt dependencies:
```bash
npm install
```

3. Chạy development server:
```bash
npm run dev
```

Frontend sẽ chạy trên `http://localhost:3000`

## Bước 4: Kiểm tra

1. Mở trình duyệt và truy cập `http://localhost:3000`
2. Đăng nhập với tài khoản admin:
   - Email: `admin@sunday.com`
   - Password: `admin123`
3. Kiểm tra các chức năng cơ bản

## Cấu trúc thư mục uploads

Backend cần các thư mục sau để lưu file:
```
backend/uploads/
├── products/      # Hình ảnh sản phẩm
├── categories/    # Hình ảnh danh mục
├── brands/        # Logo nhãn hàng
├── avatars/       # Avatar người dùng
└── reviews/       # Hình ảnh đánh giá
```

## Troubleshooting

### Lỗi kết nối SQL Server
- Kiểm tra SQL Server đã được khởi động chưa
- Kiểm tra các thông tin kết nối trong file `.env` có đúng không (DB_SERVER, DB_USER, DB_PASSWORD, DB_NAME)
- Kiểm tra SQL Server có cho phép kết nối từ xa không (nếu cần)
- Kiểm tra firewall có chặn port SQL Server không (mặc định 1433)
- Đảm bảo đã chạy file `SQLQuery1.sql` để tạo database

### Lỗi CORS
- Đảm bảo backend đang chạy trên port 5000
- Kiểm tra proxy configuration trong `vite.config.js`

### Lỗi upload file
- Kiểm tra thư mục `uploads` đã được tạo chưa
- Kiểm tra quyền ghi file trong thư mục `uploads`

## Production Deployment

### Backend
1. Set `NODE_ENV=production` trong `.env`
2. Sử dụng process manager như PM2:
```bash
npm install -g pm2
pm2 start server.js --name sunday-backend
```

### Frontend
1. Build production:
```bash
npm run build
```

2. Serve với nginx hoặc Apache, trỏ đến thư mục `dist/`

3. Cấu hình reverse proxy cho API:
```nginx
location /api {
    proxy_pass http://localhost:5000;
}
```

