import { useState, useEffect } from 'react';
import api from '../../services/api';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await api.get('/dashboard/stats');
      setStats(response.data.data.stats);
      setRecentOrders(response.data.data.recentOrders || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

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
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

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
