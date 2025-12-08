import { useState, useEffect } from 'react';
import api from '../../services/api';
import { toast } from 'react-toastify';

const AdminPurchaseOrders = () => {
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPO, setEditingPO] = useState(null);
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [filters, setFilters] = useState({
    supplier: '',
    status: '',
  });
  const [formData, setFormData] = useState({
    supplierId: '',
    status: 'pending',
    items: [{ productId: '', quantity: 1, unitCost: 0 }],
  });

  useEffect(() => {
    fetchPurchaseOrders();
    fetchSuppliers();
    fetchProducts();
  }, [filters]);

  const fetchPurchaseOrders = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filters.supplier) params.supplier = filters.supplier;
      if (filters.status) params.status = filters.status;
      
      const response = await api.get('/purchase-orders', { params });
      setPurchaseOrders(response.data.data.purchaseOrders || []);
    } catch (error) {
      toast.error('Lỗi khi tải danh sách đơn đặt hàng');
    } finally {
      setLoading(false);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const response = await api.get('/suppliers');
      setSuppliers(response.data.data?.suppliers || []);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await api.get('/products?limit=100');
      setProducts(response.data.data.products || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.supplierId) {
      toast.error('Vui lòng chọn nhà cung cấp');
      return;
    }

    if (formData.items.length === 0 || formData.items.some(item => !item.productId || item.quantity <= 0 || item.unitCost < 0)) {
      toast.error('Vui lòng nhập đầy đủ thông tin sản phẩm');
      return;
    }

    try {
      if (editingPO) {
        await api.put(`/purchase-orders/${editingPO.PO_ID}`, formData);
        toast.success('Cập nhật đơn đặt hàng thành công');
      } else {
        await api.post('/purchase-orders', formData);
        toast.success('Tạo đơn đặt hàng thành công');
      }
      setShowModal(false);
      setEditingPO(null);
      resetForm();
      fetchPurchaseOrders();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  const handleEdit = (po) => {
    setEditingPO(po);
    setFormData({
      supplierId: po.Supplier_ID.toString(),
      status: po.Status || 'pending',
      items: po.items && po.items.length > 0 
        ? po.items.map(item => ({
            productId: item.Product_ID.toString(),
            quantity: item.Quantity,
            unitCost: item.UnitCost,
          }))
        : [{ productId: '', quantity: 1, unitCost: 0 }],
    });
    setShowModal(true);
  };

  const handleDelete = async (poId) => {
    if (!window.confirm('Bạn có chắc muốn xóa đơn đặt hàng này?')) return;

    try {
      await api.delete(`/purchase-orders/${poId}`);
      toast.success('Xóa đơn đặt hàng thành công');
      fetchPurchaseOrders();
    } catch (error) {
      toast.error('Lỗi khi xóa đơn đặt hàng');
    }
  };

  const resetForm = () => {
    setFormData({
      supplierId: '',
      status: 'pending',
      items: [{ productId: '', quantity: 1, unitCost: 0 }],
    });
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { productId: '', quantity: 1, unitCost: 0 }],
    });
  };

  const removeItem = (index) => {
    if (formData.items.length > 1) {
      setFormData({
        ...formData,
        items: formData.items.filter((_, i) => i !== index),
      });
    }
  };

  const updateItem = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index][field] = field === 'quantity' || field === 'unitCost' ? parseInt(value) || 0 : value;
    
    // Auto-fill unit cost from product price if product selected
    if (field === 'productId' && value) {
      const product = products.find(p => p._id.toString() === value);
      if (product) {
        newItems[index].unitCost = product.price || 0;
      }
    }
    
    setFormData({ ...formData, items: newItems });
  };

  const getTotalAmount = () => {
    return formData.items.reduce((sum, item) => {
      return sum + (item.quantity * item.unitCost);
    }, 0);
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status) => {
    const labels = {
      pending: 'Chờ xử lý',
      processing: 'Đang xử lý',
      completed: 'Hoàn thành',
      delivered: 'Đã giao',
      cancelled: 'Đã hủy',
    };
    return labels[status?.toLowerCase()] || status;
  };

  if (loading) return <div className="p-6">Đang tải...</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Quản lý đơn đặt hàng</h1>
        <button
          onClick={() => {
            setEditingPO(null);
            resetForm();
            setShowModal(true);
          }}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg font-medium flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Tạo đơn đặt hàng
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Lọc theo nhà cung cấp</label>
            <select
              value={filters.supplier}
              onChange={(e) => setFilters({ ...filters, supplier: e.target.value })}
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tất cả nhà cung cấp</option>
              {suppliers.map((supplier) => (
                <option key={supplier._id} value={supplier._id}>
                  {supplier.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Lọc theo trạng thái</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="pending">Chờ xử lý</option>
              <option value="processing">Đang xử lý</option>
              <option value="completed">Hoàn thành</option>
              <option value="delivered">Đã giao</option>
              <option value="cancelled">Đã hủy</option>
            </select>
          </div>
        </div>
      </div>

      {/* Purchase Orders Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mã đơn</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nhà cung cấp</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tổng tiền</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ngày tạo</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Số sản phẩm</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Thao tác</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {purchaseOrders.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                  Chưa có đơn đặt hàng nào
                </td>
              </tr>
            ) : (
              purchaseOrders.map((po) => (
                <tr key={po.PO_ID} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">#{po.PO_ID}</td>
                  <td className="px-6 py-4 text-sm">
                    <div className="font-medium">{po.Supplier_Name}</div>
                    {po.Supplier_Phone && (
                      <div className="text-gray-500 text-xs">{po.Supplier_Phone}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {po.TotalAmount?.toLocaleString('vi-VN')} đ
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(po.Status)}`}>
                      {getStatusLabel(po.Status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {new Date(po.CreatedAt).toLocaleDateString('vi-VN')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {po.items?.length || 0} sản phẩm
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(po)}
                        className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-colors font-medium text-sm"
                      >
                        ✏️ Sửa
                      </button>
                      <button
                        onClick={() => handleDelete(po.PO_ID)}
                        className="px-3 py-1.5 bg-red-50 text-red-600 rounded-md hover:bg-red-100 transition-colors font-medium text-sm"
                      >
                        🗑️ Xóa
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="px-8 py-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold text-gray-800">
                  {editingPO ? '✏️ Sửa đơn đặt hàng' : '➕ Tạo đơn đặt hàng mới'}
                </h2>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setEditingPO(null);
                    resetForm();
                  }}
                  className="text-gray-500 hover:text-gray-700 transition-colors p-2 hover:bg-gray-100 rounded-full"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Form Body */}
            <div className="flex-1 overflow-y-auto p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Supplier and Status */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Nhà cung cấp <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      value={formData.supplierId}
                      onChange={(e) => setFormData({ ...formData, supplierId: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white"
                    >
                      <option value="">-- Chọn nhà cung cấp --</option>
                      {suppliers.map((supplier) => (
                        <option key={supplier._id} value={supplier._id}>
                          {supplier.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Trạng thái <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white"
                    >
                      <option value="pending">Chờ xử lý</option>
                      <option value="processing">Đang xử lý</option>
                      <option value="completed">Hoàn thành</option>
                      <option value="delivered">Đã giao</option>
                      <option value="cancelled">Đã hủy</option>
                    </select>
                  </div>
                </div>

                {/* Items */}
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <label className="block text-sm font-semibold text-gray-700">
                      Sản phẩm <span className="text-red-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={addItem}
                      className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 text-sm"
                    >
                      ➕ Thêm sản phẩm
                    </button>
                  </div>

                  <div className="space-y-4">
                    {formData.items.map((item, index) => (
                      <div key={index} className="grid grid-cols-12 gap-4 items-end p-4 border rounded-lg bg-gray-50">
                        <div className="col-span-5">
                          <label className="block text-xs font-medium text-gray-700 mb-1">Sản phẩm</label>
                          <select
                            required
                            value={item.productId}
                            onChange={(e) => updateItem(index, 'productId', e.target.value)}
                            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">-- Chọn sản phẩm --</option>
                            {products.map((product) => (
                              <option key={product._id} value={product._id}>
                                {product.name} - {product.price?.toLocaleString('vi-VN')} đ
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="col-span-2">
                          <label className="block text-xs font-medium text-gray-700 mb-1">Số lượng</label>
                          <input
                            type="number"
                            required
                            min="1"
                            value={item.quantity}
                            onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div className="col-span-3">
                          <label className="block text-xs font-medium text-gray-700 mb-1">Đơn giá</label>
                          <input
                            type="number"
                            required
                            min="0"
                            value={item.unitCost}
                            onChange={(e) => updateItem(index, 'unitCost', e.target.value)}
                            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div className="col-span-1">
                          <label className="block text-xs font-medium text-gray-700 mb-1">Tổng</label>
                          <div className="px-3 py-2 bg-white border rounded text-sm font-medium">
                            {(item.quantity * item.unitCost).toLocaleString('vi-VN')} đ
                          </div>
                        </div>
                        <div className="col-span-1">
                          {formData.items.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeItem(index)}
                              className="w-full px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Total */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-gray-700">Tổng tiền:</span>
                    <span className="text-2xl font-bold text-blue-600">
                      {getTotalAmount().toLocaleString('vi-VN')} đ
                    </span>
                  </div>
                </div>

                {/* Form Actions */}
                <div className="pt-6 border-t border-gray-200 flex justify-end gap-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setEditingPO(null);
                      resetForm();
                    }}
                    className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-md hover:shadow-lg flex items-center gap-2"
                  >
                    {editingPO ? '💾 Cập nhật' : '✨ Tạo đơn'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPurchaseOrders;
