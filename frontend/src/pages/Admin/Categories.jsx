import { useState, useEffect } from 'react';
import api from '../../services/api';
import { toast } from 'react-toastify';

const AdminCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [showProductsModal, setShowProductsModal] = useState(false);
  const [categoryProducts, setCategoryProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    parentCategoryId: '',
    categoryType: 'parent', // 'parent' or 'child'
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await api.get('/categories');
      setCategories(response.data.data.categories);
    } catch (error) {
      toast.error('Lỗi khi tải danh sách danh mục');
    } finally {
      setLoading(false);
    }
  };

  // Group categories by parent
  const groupedCategories = () => {
    const parents = categories.filter(c => !c.parentCategoryId);
    const children = categories.filter(c => c.parentCategoryId);
    
    return parents.map(parent => ({
      ...parent,
      children: children.filter(c => c.parentCategoryId === parent._id)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);
    
    try {
      const categoryData = {
        name: formData.name,
      };
      
      // Nếu là danh mục con, mới thêm parentCategoryId
      if (formData.categoryType === 'child' && formData.parentCategoryId) {
        categoryData.parentCategoryId = formData.parentCategoryId;
      } else {
        categoryData.parentCategoryId = null; // Đảm bảo danh mục cha không có parent
      }

      let response;
      if (editingCategory) {
        response = await api.put(`/categories/${editingCategory._id}`, categoryData);
        if (response.data.success) {
          toast.success('Cập nhật danh mục thành công');
        }
      } else {
        response = await api.post('/categories', categoryData);
        if (response.data.success) {
          toast.success('Tạo danh mục thành công');
        }
      }

      setShowModal(false);
      setEditingCategory(null);
      setFormData({ name: '', parentCategoryId: '', categoryType: 'parent' });
      fetchCategories();
    } catch (error) {
      console.error('Error saving category:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Có lỗi xảy ra';
      toast.error(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      parentCategoryId: category.parentCategoryId || '',
      categoryType: category.parentCategoryId ? 'child' : 'parent',
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa danh mục này? Tất cả danh mục con sẽ bị xóa theo.')) return;
    
    try {
      await api.delete(`/categories/${id}`);
      toast.success('Xóa danh mục thành công');
      fetchCategories();
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Lỗi khi xóa danh mục';
      toast.error(errorMessage);
    }
  };

  const handleViewProducts = async (category) => {
    setSelectedCategory(category);
    setLoadingProducts(true);
    setShowProductsModal(true);
    
    try {
      const response = await api.get(`/products?category=${category._id}&limit=100`);
      setCategoryProducts(response.data.data.products || []);
    } catch (error) {
      toast.error('Lỗi khi tải danh sách sản phẩm');
      setCategoryProducts([]);
    } finally {
      setLoadingProducts(false);
    }
  };

  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith('http')) return imagePath;
    if (imagePath.startsWith('/uploads')) {
      return `http://localhost:5000${imagePath}`;
    }
    return `http://localhost:5000/uploads/${imagePath}`;
  };

  if (loading) {
    return <div className="p-6">Đang tải...</div>;
  }

  const grouped = groupedCategories();

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Quản lý danh mục</h1>
        <button
          onClick={() => {
            setEditingCategory(null);
            setFormData({ name: '', parentCategoryId: '', categoryType: 'parent' });
            setShowModal(true);
          }}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg font-medium flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Thêm danh mục
        </button>
      </div>

      {/* Categories List - Hierarchical View */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="divide-y divide-gray-200">
          {grouped.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p>Chưa có danh mục nào. Hãy thêm danh mục mới!</p>
            </div>
          ) : (
            grouped.map((parent) => (
              <div key={parent._id} className="p-6 hover:bg-gray-50 transition-colors">
                {/* Parent Category */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-16 h-16 rounded-lg border-2 border-gray-200 bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
                      <span className="text-3xl">📁</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold text-gray-800">{parent.name}</h3>
                        <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">Danh mục cha</span>
                        <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full">
                          {parent.productCount || 0} sản phẩm
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">ID: {parent._id}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleViewProducts(parent)}
                      disabled={!parent.productCount || parent.productCount === 0}
                      className="px-3 py-1.5 bg-green-50 text-green-600 rounded-md hover:bg-green-100 transition-colors font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      👁️ Xem sản phẩm ({parent.productCount || 0})
                    </button>
                    <button
                      onClick={() => handleEdit(parent)}
                      className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-colors font-medium text-sm"
                    >
                      ✏️ Sửa
                    </button>
                    <button
                      onClick={() => handleDelete(parent._id)}
                      className="px-3 py-1.5 bg-red-50 text-red-600 rounded-md hover:bg-red-100 transition-colors font-medium text-sm"
                    >
                      🗑️ Xóa
                    </button>
                  </div>
                </div>

                {/* Subcategories */}
                {parent.children && parent.children.length > 0 && (
                  <div className="mt-4 ml-20 space-y-3 pl-4 border-l-2 border-gray-200">
                    {parent.children.map((child) => (
                      <div key={child._id} className="flex items-center justify-between py-2 hover:bg-gray-50 rounded-lg px-3 -ml-4">
                        <div className="flex items-center gap-3 flex-1">
                          <span className="text-gray-400">└─</span>
                          <div className="w-12 h-12 rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-center">
                            <span className="text-xl">📂</span>
                          </div>
                          <div>
                            <h4 className="text-base font-medium text-gray-700">{child.name}</h4>
                            <div className="flex items-center gap-2 mt-1">
                              <p className="text-xs text-gray-500">ID: {child._id}</p>
                              <span className="px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded-full">
                                {child.productCount || 0} sản phẩm
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleViewProducts(child)}
                            disabled={!child.productCount || child.productCount === 0}
                            className="px-2 py-1 bg-green-50 text-green-600 rounded-md hover:bg-green-100 transition-colors text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Xem sản phẩm"
                          >
                            👁️ ({child.productCount || 0})
                          </button>
                          <button
                            onClick={() => handleEdit(child)}
                            className="px-2 py-1 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-colors text-xs font-medium"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => handleDelete(child._id)}
                            className="px-2 py-1 bg-red-50 text-red-600 rounded-md hover:bg-red-100 transition-colors text-xs font-medium"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="px-8 py-6 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-pink-50">
              <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold text-gray-800">
                  {editingCategory ? '✏️ Sửa danh mục' : '➕ Thêm danh mục mới'}
                </h2>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setEditingCategory(null);
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
              <form id="category-form" onSubmit={handleSubmit} className="space-y-6">
                {/* Category Type Selection */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Loại danh mục <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer flex-1 p-4 border-2 border-gray-300 rounded-lg hover:border-purple-400 transition-all">
                      <input
                        type="radio"
                        name="categoryType"
                        value="parent"
                        checked={formData.categoryType === 'parent'}
                        onChange={(e) => {
                          setFormData({ 
                            ...formData, 
                            categoryType: e.target.value,
                            parentCategoryId: '' // Reset parent khi chọn danh mục cha
                          });
                        }}
                        className="w-5 h-5 text-purple-600 focus:ring-purple-500"
                      />
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">📁</span>
                        <div>
                          <div className="font-medium text-gray-800">Danh mục cha</div>
                          <div className="text-xs text-gray-500">Không có danh mục cha</div>
                        </div>
                      </div>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer flex-1 p-4 border-2 border-gray-300 rounded-lg hover:border-purple-400 transition-all">
                      <input
                        type="radio"
                        name="categoryType"
                        value="child"
                        checked={formData.categoryType === 'child'}
                        onChange={(e) => setFormData({ ...formData, categoryType: e.target.value })}
                        className="w-5 h-5 text-purple-600 focus:ring-purple-500"
                      />
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">📂</span>
                        <div>
                          <div className="font-medium text-gray-800">Danh mục con</div>
                          <div className="text-xs text-gray-500">Thuộc danh mục cha</div>
                        </div>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Category Name */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Tên danh mục <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                    placeholder="Nhập tên danh mục"
                  />
                </div>

                {/* Parent Category - Only show if category type is 'child' */}
                {formData.categoryType === 'child' && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Chọn danh mục cha <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      value={formData.parentCategoryId}
                      onChange={(e) => setFormData({ ...formData, parentCategoryId: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all bg-white"
                    >
                      <option value="">-- Chọn danh mục cha --</option>
                      {categories
                        .filter(c => !c.parentCategoryId && (!editingCategory || c._id !== editingCategory._id))
                        .map((cat) => (
                          <option key={cat._id} value={cat._id}>
                            📁 {cat.name}
                          </option>
                        ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      Chọn danh mục cha cho danh mục con này.
                    </p>
                  </div>
                )}

                {/* Form Actions */}
                <div className="pt-6 border-t border-gray-200 flex justify-end gap-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setEditingCategory(null);
                      setFormData({ name: '', parentCategoryId: '', categoryType: 'parent' });
                    }}
                    className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={uploading}
                    className="px-8 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {uploading ? (
                      <>
                        <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Đang xử lý...
                      </>
                    ) : (
                      <>
                        {editingCategory ? '💾 Cập nhật danh mục' : '✨ Tạo danh mục'}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Products Modal */}
      {showProductsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="px-8 py-6 border-b border-gray-200 bg-gradient-to-r from-green-50 to-emerald-50">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">
                    📦 Sản phẩm thuộc danh mục: {selectedCategory?.name}
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Tổng số: {categoryProducts.length} sản phẩm
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowProductsModal(false);
                    setSelectedCategory(null);
                    setCategoryProducts([]);
                  }}
                  className="text-gray-500 hover:text-gray-700 transition-colors p-2 hover:bg-gray-100 rounded-full"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Products List */}
            <div className="flex-1 overflow-y-auto p-6">
              {loadingProducts ? (
                <div className="flex items-center justify-center py-12">
                  <svg className="animate-spin h-8 w-8 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span className="ml-3 text-gray-600">Đang tải sản phẩm...</span>
                </div>
              ) : categoryProducts.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📭</div>
                  <p className="text-gray-500 text-lg">Danh mục này chưa có sản phẩm nào</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {categoryProducts.map((product) => (
                    <div key={product._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow bg-white">
                      <div className="flex gap-4">
                        {product.images && product.images.length > 0 ? (
                          <img
                            src={getImageUrl(product.images[0])}
                            alt={product.name}
                            className="w-20 h-20 object-cover rounded-lg border border-gray-200"
                            onError={(e) => {
                              e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="80" height="80"%3E%3Crect width="80" height="80" fill="%23e5e7eb"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" font-size="32"%3E📦%3C/text%3E%3C/svg%3E';
                            }}
                          />
                        ) : (
                          <div className="w-20 h-20 rounded-lg border border-gray-200 bg-gray-100 flex items-center justify-center">
                            <span className="text-3xl">📦</span>
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-800 truncate">{product.name}</h4>
                          <p className="text-sm text-gray-600 mt-1">
                            Giá: <span className="font-medium text-green-600">{product.price?.toLocaleString('vi-VN')} đ</span>
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Tồn kho: <span className="font-medium">{product.stock || 0}</span>
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Thương hiệu: <span className="font-medium">{product.brand?.name || 'N/A'}</span>
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-8 py-4 border-t border-gray-200 bg-gray-50 flex justify-end">
              <button
                onClick={() => {
                  setShowProductsModal(false);
                  setSelectedCategory(null);
                  setCategoryProducts([]);
                }}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCategories;
