import { Outlet, NavLink } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

const ShipperLayout = () => {
  const { logout, user } = useAuthStore();

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Sunday Supermarket - Giao hàng</h1>
          <div className="flex items-center gap-4">
            <NavLink to="/shipper" className="hover:text-primary-600">Dashboard</NavLink>
            <NavLink to="/shipper/orders" className="hover:text-primary-600">Đơn hàng</NavLink>
            <span className="text-gray-600">Xin chào, {user?.fullName}</span>
            <button
              onClick={logout}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Đăng xuất
            </button>
          </div>
        </div>
      </header>
      <main className="flex-grow container mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
};

export default ShipperLayout;

