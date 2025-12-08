import { useState, useEffect } from 'react';
import api from '../../services/api';
import { toast } from 'react-toastify';

const AdminBrands = () => {
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingBrand, setEditingBrand] = useState(null);
  const [name, setName] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [suppliers, setSuppliers] = useState([]);

  useEffect(() => {
    fetchBrands();
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      const response = await api.get('/suppliers');
      setSuppliers(response.data.data?.suppliers || []);
    } catch (error) {
      console.log('Suppliers API not available');
    }
  };

  const fetchBrands = async () => {
    try {
      const response = await api.get('/brands');
      setBrands(response.data.data.brands);
    } catch (error) {
      toast.error('Lỗi khi tải danh sách nhãn hàng');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const brandData = { name, supplierId: supplierId || null };
      if (editingBrand) {
        await api.put(`/brands/${editingBrand._id}`, brandData);
        toast.success('Cập nhật nhãn hàng thành công');
      } else {
        await api.post('/brands', brandData);
        toast.success('Tạo nhãn hàng thành công');
      }
      setShowModal(false);
      setEditingBrand(null);
      setName('');
      setSupplierId('');
      fetchBrands();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  const handleEdit = (brand) => {
    setEditingBrand(brand);
    setName(brand.name);
    setSupplierId(brand.supplierId || '');
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa nhãn hàng này?')) return;
    try {
      await api.delete(`/brands/${id}`);
      toast.success('Xóa nhãn hàng thành công');
      fetchBrands();
    } catch (error) {
      toast.error('Lỗi khi xóa nhãn hàng');
    }
  };

  if (loading) return <div className="p-6">Đang tải...</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Quản lý nhãn hàng</h1>
        <button
          onClick={() => {
            setEditingBrand(null);
            setName('');
            setSupplierId('');
            setShowModal(true);
          }}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          + Thêm nhãn hàng
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tên</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nhà cung cấp</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Thao tác</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {brands.map((brand) => (
              <tr key={brand._id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm">{brand._id}</td>
                <td className="px-6 py-4 text-sm font-medium">{brand.name}</td>
                <td className="px-6 py-4 text-sm">{brand.supplier?.name || '-'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                  <button onClick={() => handleEdit(brand)} className="text-blue-600 hover:text-blue-800">
                    Sửa
                  </button>
                  <button onClick={() => handleDelete(brand._id)} className="text-red-600 hover:text-red-800">
                    Xóa
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold mb-4">{editingBrand ? 'Sửa nhãn hàng' : 'Thêm nhãn hàng'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Tên nhãn hàng <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Nhập tên nhãn hàng"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Nhà cung cấp (tùy chọn)</label>
                <select
                  value={supplierId}
                  onChange={(e) => setSupplierId(e.target.value)}
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Chọn nhà cung cấp --</option>
                  {suppliers.map((supplier) => (
                    <option key={supplier._id} value={supplier._id}>
                      {supplier.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex space-x-2">
                <button type="submit" className="flex-1 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
                  {editingBrand ? 'Cập nhật' : 'Tạo'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingBrand(null);
                    setName('');
                    setSupplierId('');
                  }}
                  className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
                >
                  Hủy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminBrands;
