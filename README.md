# Sunday Supermarket - Hệ thống Siêu thị Trực tuyến

Hệ thống quản lý siêu thị trực tuyến được phát triển cho Công ty DT, hoạt động tại số 01 Lý Tự Trọng, phường Ninh Kiều, thành phố Cần Thơ.

## 🚀 Công nghệ sử dụng

### Backend
- **Node.js** với Express.js
- **SQL Server** với mssql driver
- **JWT** cho xác thực
- **Multer** cho upload file
- **Bcrypt** cho mã hóa mật khẩu

### Frontend
- **React 18** với Vite
- **React Router** cho routing
- **React Query** cho data fetching
- **Zustand** cho state management
- **Tailwind CSS** cho styling
- **Axios** cho HTTP requests

## 📁 Cấu trúc dự án

```
do_an_react/
├── backend/                 # Backend API
│   ├── config/             # Cấu hình database
│   ├── controllers/        # Controllers xử lý logic
│   ├── middleware/         # Middleware (auth, upload)
│   ├── models/             # SQL models
│   ├── routes/             # API routes
│   ├── uploads/            # Thư mục lưu file upload
│   ├── server.js           # Entry point
│   └── package.json
│
└── frontend/               # Frontend React
    ├── src/
    │   ├── components/     # React components
    │   ├── layouts/        # Layout components
    │   ├── pages/          # Page components
    │   ├── services/       # API services
    │   ├── store/          # State management
    │   ├── App.jsx         # Main app component
    │   └── main.jsx        # Entry point
    ├── index.html
    └── package.json
```

## 👥 Vai trò người dùng

### 1. Quản trị viên (Admin)
- Quản lý sản phẩm, danh mục, nhãn hàng
- Quản lý hàng tồn kho và giao dịch kho
- Quản lý đơn hàng và phân công shipper
- Quản lý người dùng

### 2. Khách hàng (Customer)
- Xem và tìm kiếm sản phẩm
- Thêm vào giỏ hàng và đặt hàng
- Theo dõi đơn hàng
- Xem lịch sử mua hàng
- Cập nhật thông tin cá nhân
- Gửi đánh giá sản phẩm

### 3. Nhân viên giao hàng (Shipper)
- Xem đơn hàng được phân công
- Xem chi tiết đơn hàng
- Cập nhật trạng thái giao hàng

### 4. Khách (Guest)
- Xem sản phẩm
- Xem đánh giá
- Không thể đặt hàng

## 🛠️ Cài đặt và chạy dự án

### Yêu cầu
- Node.js >= 16.x
- SQL Server >= 2017
- npm hoặc yarn

### Backend

1. Di chuyển vào thư mục backend:
```bash
cd backend
```

2. Cài đặt dependencies:
```bash
npm install
```

3. Tạo file `.env` từ `.env.example`:
```bash
cp .env.example .env
```

4. Cấu hình `.env`:
```env
PORT=5000
DB_SERVER=localhost
DB_USER=sa
DB_PASSWORD=your_password_here
DB_NAME=SundaySupermarket
DB_ENCRYPT=false
JWT_SECRET=your_secret_key_here
JWT_EXPIRE=7d
```

5. Tạo database từ file SQL:
   - Mở SQL Server Management Studio
   - Chạy file `SQLQuery1.sql` để tạo database và các bảng

6. Chạy server:
```bash
# Development
npm run dev

# Production
npm start
```

### Frontend

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

4. Build cho production:
```bash
npm run build
```

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register` - Đăng ký
- `POST /api/auth/login` - Đăng nhập
- `GET /api/auth/me` - Lấy thông tin user hiện tại
- `PUT /api/auth/profile` - Cập nhật profile

### Products
- `GET /api/products` - Lấy danh sách sản phẩm
- `GET /api/products/:id` - Lấy chi tiết sản phẩm
- `GET /api/products/search?q=...` - Tìm kiếm sản phẩm
- `POST /api/products` - Tạo sản phẩm (Admin)
- `PUT /api/products/:id` - Cập nhật sản phẩm (Admin)
- `DELETE /api/products/:id` - Xóa sản phẩm (Admin)

### Categories
- `GET /api/categories` - Lấy danh sách danh mục
- `GET /api/categories/:id` - Lấy chi tiết danh mục
- `POST /api/categories` - Tạo danh mục (Admin)
- `PUT /api/categories/:id` - Cập nhật danh mục (Admin)
- `DELETE /api/categories/:id` - Xóa danh mục (Admin)

### Brands
- `GET /api/brands` - Lấy danh sách nhãn hàng
- `GET /api/brands/:id` - Lấy chi tiết nhãn hàng
- `POST /api/brands` - Tạo nhãn hàng (Admin)
- `PUT /api/brands/:id` - Cập nhật nhãn hàng (Admin)
- `DELETE /api/brands/:id` - Xóa nhãn hàng (Admin)

### Orders
- `GET /api/orders` - Lấy danh sách đơn hàng (Admin)
- `GET /api/orders/my-orders` - Lấy đơn hàng của tôi (Customer)
- `GET /api/orders/:id` - Lấy chi tiết đơn hàng
- `POST /api/orders` - Tạo đơn hàng (Customer)
- `PUT /api/orders/:id` - Cập nhật đơn hàng (Admin)
- `PUT /api/orders/:id/cancel` - Hủy đơn hàng

### Inventory
- `GET /api/inventory` - Lấy giao dịch kho (Admin)
- `GET /api/inventory/product/:productId` - Lấy lịch sử kho của sản phẩm (Admin)
- `POST /api/inventory` - Tạo giao dịch kho (Admin)

### Reviews
- `GET /api/reviews` - Lấy danh sách đánh giá
- `GET /api/reviews/product/:productId` - Lấy đánh giá của sản phẩm
- `POST /api/reviews` - Tạo đánh giá (Customer)
- `PUT /api/reviews/:id` - Cập nhật đánh giá
- `DELETE /api/reviews/:id` - Xóa đánh giá

### Delivery
- `GET /api/delivery/my-deliveries` - Lấy đơn hàng giao hàng (Shipper)
- `GET /api/delivery/:id` - Lấy chi tiết đơn hàng giao hàng (Shipper)
- `PUT /api/delivery/:id/status` - Cập nhật trạng thái giao hàng (Shipper)
- `PUT /api/delivery/:id/assign` - Phân công shipper (Admin)

## 🔐 Xác thực

API sử dụng JWT token. Thêm token vào header:
```
Authorization: Bearer <token>
```

## 📝 Ghi chú

- Backend chạy trên port 5000 (mặc định)
- Frontend chạy trên port 3000 (mặc định)
- File upload được lưu trong thư mục `backend/uploads/`
- Database SQL Server cần được cài đặt và chạy trước khi start backend
- Chạy file `SQLQuery1.sql` để tạo database và schema

## 📄 License

ISC

