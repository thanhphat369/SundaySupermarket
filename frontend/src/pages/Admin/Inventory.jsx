import { useState, useEffect } from 'react';
import api from '../../services/api';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';

const AdminInventory = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await api.get('/products?limit=100');
      setProducts(response.data.data.products);
    } catch (error) {
      toast.error('Lỗi khi tải danh sách sản phẩm');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStock = async (productId, newStock) => {
    try {
      await api.put(`/products/${productId}`, { stock: parseInt(newStock) });
      toast.success('Cập nhật tồn kho thành công');
      fetchProducts();
    } catch (error) {
      toast.error('Lỗi khi cập nhật tồn kho');
    }
  };

  if (loading) return <div className="p-6">Đang tải...</div>;

  const lowStockProducts = products.filter(p => (p.stock || 0) < 10);

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold mb-2">Quản lý kho hàng</h1>
          <p className="text-gray-600">Xem và quản lý tồn kho sản phẩm</p>
        </div>
        <Link
          to="/admin/stock-transactions"
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          📋 Xem lịch sử giao dịch
        </Link>
      </div>

      {lowStockProducts.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <h2 className="font-bold text-yellow-800 mb-2">⚠️ Cảnh báo: Sản phẩm sắp hết hàng</h2>
          <p className="text-yellow-700">Có {lowStockProducts.length} sản phẩm có tồn kho dưới 10</p>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hình ảnh</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tên sản phẩm</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tồn kho</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Thao tác</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {products.map((product) => (
              <tr key={product._id} className={product.stock < 10 ? 'bg-yellow-50' : ''}>
                <td className="px-6 py-4 whitespace-nowrap text-sm">{product._id}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {product.images && product.images.length > 0 ? (
                    <img 
                      src={product.images[0]} 
                      alt={product.name}
                      className="w-12 h-12 object-cover rounded"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center text-gray-400 text-xs">
                      No Image
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 text-sm">{product.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      defaultValue={product.stock || 0}
                      onBlur={(e) => {
                        if (e.target.value !== (product.stock || 0).toString()) {
                          handleUpdateStock(product._id, e.target.value);
                        }
                      }}
                      className="w-20 px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {product.stock < 10 && (
                      <span className="text-red-600 text-xs">⚠️</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <Link
                    to={`/admin/stock-transactions?product=${product._id}`}
                    className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 text-xs inline-block"
                    title="Xem lịch sử giao dịch"
                  >
                    📋 Lịch sử
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminInventory;
