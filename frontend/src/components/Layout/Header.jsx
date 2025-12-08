import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

const Header = () => {
  const { isAuthenticated, user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="bg-white shadow-md">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <Link to="/" className="text-2xl font-bold text-primary-600">
            Sunday Supermarket
          </Link>
          <nav className="flex gap-6 items-center">
            <NavLink to="/" className="hover:text-primary-600">Trang chủ</NavLink>
            <NavLink to="/products" className="hover:text-primary-600">Sản phẩm</NavLink>
            {isAuthenticated ? (
              <>
                {user?.role === 'customer' && (
                  <>
                    <Link to="/customer/cart" className="hover:text-primary-600">Giỏ hàng</Link>
                    <Link to="/customer/orders" className="hover:text-primary-600">Đơn hàng</Link>
                  </>
                )}
                {user?.role === 'admin' && (
                  <Link to="/admin" className="hover:text-primary-600">Quản trị</Link>
                )}
                {user?.role === 'shipper' && (
                  <Link to="/shipper" className="hover:text-primary-600">Giao hàng</Link>
                )}
                <span className="text-gray-600">{user?.fullName}</span>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                >
                  Đăng xuất
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="hover:text-primary-600">Đăng nhập</Link>
                <Link
                  to="/register"
                  className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700"
                >
                  Đăng ký
                </Link>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;

