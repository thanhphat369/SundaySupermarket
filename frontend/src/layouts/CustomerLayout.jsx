import { Outlet, NavLink } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

const CustomerLayout = () => {
  const { logout, user } = useAuthStore();

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <NavLink to="/" className="text-2xl font-bold text-primary-600">
            Sunday Supermarket
          </NavLink>
          <nav className="flex gap-4 items-center">
            <NavLink to="/" className="hover:text-primary-600">Trang chủ</NavLink>
            <NavLink to="/products" className="hover:text-primary-600">Sản phẩm</NavLink>
            <NavLink to="/customer/cart" className="hover:text-primary-600">Giỏ hàng</NavLink>
            <NavLink to="/customer/orders" className="hover:text-primary-600">Đơn hàng</NavLink>
            <NavLink to="/customer/profile" className="hover:text-primary-600">Hồ sơ</NavLink>
            <span className="text-gray-600">Xin chào, {user?.fullName}</span>
            <button
              onClick={logout}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Đăng xuất
            </button>
          </nav>
        </div>
      </header>
      <main className="flex-grow container mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
};

export default CustomerLayout;

