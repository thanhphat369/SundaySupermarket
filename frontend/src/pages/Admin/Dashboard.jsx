import { useState, useEffect } from 'react';
import api from '../../services/api';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Get current month and year as default
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(String(currentDate.getMonth() + 1).padStart(2, '0'));
  const [selectedYear, setSelectedYear] = useState(String(currentDate.getFullYear()));

  useEffect(() => {
    fetchDashboardData();
  }, [selectedMonth, selectedYear]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/dashboard/stats?month=${selectedMonth}&year=${selectedYear}`);
      setStats(response.data.data.stats);
      setRecentOrders(response.data.data.recentOrders || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Generate month options
  const monthOptions = Array.from({ length: 12 }, (_, i) => {
    const month = String(i + 1).padStart(2, '0');
    const monthName = new Date(2000, i, 1).toLocaleString('vi-VN', { month: 'long' });
    return { value: month, label: monthName };
  });

  // Generate year options (last 5 years + current year)
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 6 }, (_, i) => {
    const year = currentYear - i;
    return { value: String(year), label: String(year) };
  });

  if (loading) {
    return <div className="p-6">Đang tải...</div>;
  }

  const statCards = [
    { title: 'Tổng sản phẩm', value: stats?.totalProducts || 0, icon: '📦', color: 'bg-blue-500' },
    { title: 'Tổng đơn hàng', value: stats?.totalOrders || 0, icon: '🛒', color: 'bg-green-500' },
    { title: 'Tổng doanh thu', value: `${(stats?.totalRevenue || 0).toLocaleString('vi-VN')} đ`, icon: '💰', color: 'bg-yellow-500' },
    { title: 'Tổng người dùng', value: stats?.totalUsers || 0, icon: '👥', color: 'bg-purple-500' },
    { title: 'Đơn hàng chờ xử lý', value: stats?.pendingOrders || 0, icon: '⏳', color: 'bg-orange-500' },
    { title: 'Sản phẩm sắp hết', value: stats?.lowStockProducts || 0, icon: '⚠️', color: 'bg-red-500' },
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <div className="flex gap-4 items-center">
          <div className="flex gap-2 items-center">
            <label className="text-sm font-medium text-gray-700">Tháng:</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              {monthOptions.map((month) => (
                <option key={month.value} value={month.value}>
                  {month.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-2 items-center">
            <label className="text-sm font-medium text-gray-700">Năm:</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              {yearOptions.map((year) => (
                <option key={year.value} value={year.value}>
                  {year.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {statCards.map((card, index) => (
          <div key={index} className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">{card.title}</p>
                <p className="text-2xl font-bold">{card.value}</p>
              </div>
              <div className={`${card.color} text-white text-4xl p-4 rounded-full`}>
                {card.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold mb-4">Đơn hàng gần đây</h2>
        {recentOrders.length === 0 ? (
          <p className="text-gray-500">Chưa có đơn hàng nào</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mã đơn</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Khách hàng</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tổng tiền</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ngày đặt</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentOrders.map((order) => (
                  <tr key={order._id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{order.orderNumber}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{order.customer.fullName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{order.total.toLocaleString('vi-VN')} đ</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        order.status === 'completed' ? 'bg-green-100 text-green-800' :
                        order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {new Date(order.createdAt).toLocaleDateString('vi-VN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
