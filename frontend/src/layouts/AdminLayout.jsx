import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

const AdminLayout = () => {
  const { logout, user } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { path: '/admin', label: 'Dashboard', icon: '📊' },
    { path: '/admin/products', label: 'Sản phẩm', icon: '📦' },
    { path: '/admin/categories', label: 'Danh mục', icon: '📁' },
    { path: '/admin/brands', label: 'Nhãn hàng', icon: '🏷️' },
    { path: '/admin/orders', label: 'Đơn hàng', icon: '🛒' },
    { path: '/admin/inventory', label: 'Kho hàng', icon: '📋' },
    { path: '/admin/stock-transactions', label: 'Giao dịch kho', icon: '📊' },
    { path: '/admin/suppliers', label: 'Nhà cung cấp', icon: '🏢' },
    { path: '/admin/purchase-orders', label: 'Đơn đặt hàng', icon: '📝' },
    { path: '/admin/users', label: 'Người dùng', icon: '👥' },
  ];

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-800 text-white min-h-screen">
        <div className="p-4 border-b border-gray-700">
          <h1 className="text-xl font-bold">Sunday Supermarket</h1>
          <p className="text-sm text-gray-400">Admin Panel</p>
        </div>
        <nav className="mt-4">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center px-4 py-3 hover:bg-gray-700 ${
                  isActive ? 'bg-gray-700 border-r-4 border-primary-500' : ''
                }`
              }
            >
              <span className="mr-3">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <header className="bg-white shadow-sm px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-semibold">Quản trị viên</h2>
          <div className="flex items-center gap-4">
            <span className="text-gray-600">Xin chào, {user?.fullName}</span>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Đăng xuất
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-6 bg-gray-50">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;

