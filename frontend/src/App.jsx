import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';

// Layouts
import PublicLayout from './layouts/PublicLayout';
import AdminLayout from './layouts/AdminLayout';
import CustomerLayout from './layouts/CustomerLayout';
import ShipperLayout from './layouts/ShipperLayout';

// Public Pages
import HomePage from './pages/Public/HomePage';
import ProductsPage from './pages/Public/ProductsPage';
import ProductDetailPage from './pages/Public/ProductDetailPage';
import LoginPage from './pages/Auth/LoginPage';
import RegisterPage from './pages/Auth/RegisterPage';

// Customer Pages
import CartPage from './pages/Customer/CartPage';
import CheckoutPage from './pages/Customer/CheckoutPage';
import OrdersPage from './pages/Customer/OrdersPage';
import OrderDetailPage from './pages/Customer/OrderDetailPage';
import ProfilePage from './pages/Customer/ProfilePage';

// Admin Pages
import AdminDashboard from './pages/Admin/Dashboard';
import AdminProducts from './pages/Admin/Products';
import AdminCategories from './pages/Admin/Categories';
import AdminBrands from './pages/Admin/Brands';
import AdminOrders from './pages/Admin/Orders';
import AdminInventory from './pages/Admin/Inventory';
import AdminStockTransactions from './pages/Admin/StockTransactions';
import AdminSuppliers from './pages/Admin/Suppliers';
import AdminUsers from './pages/Admin/Users';
import AdminPurchaseOrders from './pages/Admin/PurchaseOrders';

// Shipper Pages
import ShipperDashboard from './pages/Shipper/Dashboard';
import ShipperOrders from './pages/Shipper/Orders';
import ShipperOrderDetail from './pages/Shipper/OrderDetail';

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<PublicLayout />}>
        <Route index element={<HomePage />} />
        <Route path="products" element={<ProductsPage />} />
        <Route path="products/:id" element={<ProductDetailPage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
      </Route>

      {/* Customer Routes */}
      <Route
        path="/customer"
        element={
          <ProtectedRoute allowedRoles={['customer']}>
            <CustomerLayout />
          </ProtectedRoute>
        }
      >
        <Route path="cart" element={<CartPage />} />
        <Route path="checkout" element={<CheckoutPage />} />
        <Route path="orders" element={<OrdersPage />} />
        <Route path="orders/:id" element={<OrderDetailPage />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>

      {/* Admin Routes */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="products" element={<AdminProducts />} />
        <Route path="categories" element={<AdminCategories />} />
        <Route path="brands" element={<AdminBrands />} />
        <Route path="orders" element={<AdminOrders />} />
        <Route path="inventory" element={<AdminInventory />} />
        <Route path="stock-transactions" element={<AdminStockTransactions />} />
        <Route path="suppliers" element={<AdminSuppliers />} />
        <Route path="purchase-orders" element={<AdminPurchaseOrders />} />
        <Route path="users" element={<AdminUsers />} />
      </Route>

      {/* Shipper Routes */}
      <Route
        path="/shipper"
        element={
          <ProtectedRoute allowedRoles={['shipper']}>
            <ShipperLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<ShipperDashboard />} />
        <Route path="orders" element={<ShipperOrders />} />
        <Route path="orders/:id" element={<ShipperOrderDetail />} />
      </Route>

      {/* 404 */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;

