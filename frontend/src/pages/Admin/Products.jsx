import { useState, useEffect, useRef } from 'react';
import api from '../../services/api';
import { toast } from 'react-toastify';

const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [allBrands, setAllBrands] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [selectedImages, setSelectedImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [showImageGallery, setShowImageGallery] = useState(false);
  const [galleryImages, setGalleryImages] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const fileInputRef = useRef(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    supplier: '',
    brand: '',
    price: '',
    stock: '',
    minStock: '',
  });

  useEffect(() => {
    fetchProducts();
    fetchCategories();
    fetchBrands();
    fetchSuppliers();
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

  const fetchCategories = async () => {
    try {
      const response = await api.get('/categories');
      setCategories(response.data.data.categories);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchBrands = async () => {
    try {
      const response = await api.get('/brands');
      const brandsData = response.data.data.brands;
      setAllBrands(brandsData);
      // Filter brands based on current supplier selection
      filterBrandsBySupplier(brandsData, formData.supplier);
    } catch (error) {
      console.error('Error fetching brands:', error);
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

  const filterBrandsBySupplier = (brandsList, supplierId) => {
    if (supplierId) {
      const supplierIdNum = typeof supplierId === 'string' ? parseInt(supplierId) : supplierId;
      const filtered = brandsList.filter(brand => {
        // Check both supplierId and supplier._id for compatibility
        const brandSupplierId = brand.supplierId || brand.supplier?._id;
        if (!brandSupplierId) return false;
        // Compare as both string and number
        return brandSupplierId === supplierIdNum || 
               brandSupplierId === supplierId || 
               brandSupplierId.toString() === supplierId.toString() ||
               parseInt(brandSupplierId) === supplierIdNum;
      });
      setBrands(filtered);
      console.log(`Filtered brands for supplier ${supplierId}:`, filtered.length, 'brands found');
    } else {
      setBrands(brandsList);
    }
  };

  // Filter brands when supplier changes
  useEffect(() => {
    if (allBrands.length > 0) {
      filterBrandsBySupplier(allBrands, formData.supplier);
      
      // Reset brand selection if current brand doesn't belong to selected supplier
      if (formData.brand && formData.supplier) {
        const supplierIdNum = typeof formData.supplier === 'string' ? parseInt(formData.supplier) : formData.supplier;
        const currentBrand = allBrands.find(b => {
          const brandId = typeof b._id === 'string' ? parseInt(b._id) : b._id;
          const formBrandId = typeof formData.brand === 'string' ? parseInt(formData.brand) : formData.brand;
          return brandId === formBrandId;
        });
        
        if (currentBrand) {
          const brandSupplierId = currentBrand.supplierId || currentBrand.supplier?._id;
          if (brandSupplierId && brandSupplierId !== supplierIdNum && brandSupplierId !== formData.supplier && 
              brandSupplierId.toString() !== supplierIdNum.toString() && brandSupplierId.toString() !== formData.supplier.toString()) {
            setFormData(prev => ({ ...prev, brand: '' }));
          }
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.supplier, allBrands.length]);

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    const totalImages = selectedImages.length + files.length;
    
    if (totalImages > 5) {
      toast.error('Chỉ được chọn tối đa 5 ảnh');
      return;
    }
    
    if (totalImages < 2) {
      toast.warning('Vui lòng chọn ít nhất 2 ảnh');
    }

    const newFiles = [...selectedImages, ...files];
    setSelectedImages(newFiles);
    
    // Tạo preview - merge với previews hiện có
    const newPreviews = files.map(file => URL.createObjectURL(file));
    setImagePreviews([...imagePreviews, ...newPreviews]);
  };

  const removeImage = (index) => {
    const newFiles = selectedImages.filter((_, i) => i !== index);
    const newPreviews = imagePreviews.filter((_, i) => i !== index);
    setSelectedImages(newFiles);
    setImagePreviews(newPreviews);
    
    // Revoke object URLs
    URL.revokeObjectURL(imagePreviews[index]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);
    
    try {
      // Validate images
      const totalImages = imagePreviews.length;
      if (totalImages < 2) {
        toast.error('Vui lòng chọn ít nhất 2 ảnh cho sản phẩm');
        setUploading(false);
        return;
      }
      if (totalImages > 5) {
        toast.error('Chỉ được chọn tối đa 5 ảnh');
        setUploading(false);
        return;
      }

      const productData = new FormData();
      productData.append('name', formData.name);
      productData.append('description', formData.description);
      productData.append('category', parseInt(formData.category));
      productData.append('brand', parseInt(formData.brand));
      // Note: supplier is linked through brand, not directly to product
      productData.append('price', parseInt(formData.price));
      productData.append('stock', formData.stock ? parseInt(formData.stock) : 0);
      productData.append('minStock', formData.minStock ? parseInt(formData.minStock) : 0);

      // Append new images
      selectedImages.forEach((file) => {
        productData.append('images', file);
      });
      
      // If editing, send existing image URLs that should be kept
      if (editingProduct) {
        const existingImageUrls = imagePreviews
          .filter(url => typeof url === 'string' && (url.startsWith('http') || url.startsWith('/uploads')))
          .map(url => {
            // Extract path from full URL
            if (url.startsWith('http://localhost:5000')) {
              return url.replace('http://localhost:5000', '');
            }
            return url.startsWith('/uploads') ? url : null;
          })
          .filter(Boolean);
        
        // Send existing URLs to backend
        existingImageUrls.forEach(url => {
          productData.append('existingImages', url);
        });
      }

      let response;
      if (editingProduct) {
        response = await api.put(`/products/${editingProduct._id}`, productData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        if (response.data.success) {
          toast.success('Cập nhật sản phẩm thành công');
        } else {
          throw new Error(response.data.message || 'Cập nhật thất bại');
        }
      } else {
        response = await api.post('/products', productData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        if (response.data.success) {
          toast.success('Tạo sản phẩm thành công');
        } else {
          throw new Error(response.data.message || 'Tạo thất bại');
        }
      }

      setShowModal(false);
      setEditingProduct(null);
      setFormData({ name: '', description: '', category: '', supplier: '', brand: '', price: '', stock: '', minStock: '' });
      setSelectedImages([]);
      setImagePreviews([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      fetchProducts();
    } catch (error) {
      console.error('Error saving product:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Có lỗi xảy ra';
      toast.error(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    // Get supplier from brand
    const supplierId = product.brand?.supplier?._id || product.supplier?._id || '';
    setFormData({
      name: product.name,
      description: product.description || '',
      category: product.category._id.toString(),
      supplier: supplierId ? supplierId.toString() : '',
      brand: product.brand._id.toString(),
      price: product.price.toString(),
      costPrice: product.costPrice || null,
      stock: product.stock?.toString() || '0',
      minStock: '0',
    });
    
    // Set image previews từ product hiện tại
    if (product.images && product.images.length > 0) {
      const existingImages = product.images.map(img => getImageUrl(img)).filter(Boolean);
      setImagePreviews(existingImages);
      setSelectedImages([]); // Ảnh hiện có không phải là file mới
    } else {
      setImagePreviews([]);
      setSelectedImages([]);
    }
    
    setShowModal(true);
  };

  const openImageGallery = (product) => {
    if (product.images && product.images.length > 0) {
      const images = product.images.map(img => getImageUrl(img)).filter(Boolean);
      setGalleryImages(images);
      setCurrentImageIndex(0);
      setShowImageGallery(true);
    } else {
      toast.info('Sản phẩm này chưa có hình ảnh');
    }
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % galleryImages.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + galleryImages.length) % galleryImages.length);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa sản phẩm này?')) return;

    try {
      await api.delete(`/products/${id}`);
      toast.success('Xóa sản phẩm thành công');
      fetchProducts();
    } catch (error) {
      toast.error('Lỗi khi xóa sản phẩm');
    }
  };


  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    // Nếu đã là URL đầy đủ (http/https), return trực tiếp
    if (imagePath.startsWith('http')) return imagePath;
    // Nếu là đường dẫn tương đối từ /uploads
    // Proxy trong vite.config.js đã cấu hình /uploads -> localhost:5000
    // Nhưng để đảm bảo hoạt động cả khi không có proxy, thêm backend URL
    if (imagePath.startsWith('/uploads')) {
      // Sử dụng backend URL (giống như Users.jsx)
      // Trong development: proxy sẽ xử lý nếu dùng relative path
      // Nhưng để chắc chắn, thêm full URL
      return `http://localhost:5000${imagePath}`;
    }
    return imagePath;
  };

  if (loading) {
    return <div className="p-6">Đang tải...</div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Quản lý sản phẩm</h1>
        <button
          onClick={() => {
            setEditingProduct(null);
            setFormData({ name: '', description: '', category: '', supplier: '', brand: '', price: '', stock: '', minStock: '' });
            setSelectedImages([]);
            setImagePreviews([]);
            if (fileInputRef.current) {
              fileInputRef.current.value = '';
            }
            setShowModal(true);
          }}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg font-medium flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Thêm sản phẩm
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hình ảnh</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tên</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Danh mục</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nhãn hàng</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nhà cung cấp</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Giá nhập</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Giá bán</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tồn kho</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Thao tác</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {products.map((product) => (
              <tr key={product._id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="relative group">
                    {product.images && product.images.length > 0 ? (
                      <div className="flex items-center gap-1">
                        <img
                          src={getImageUrl(product.images[0])}
                          alt={product.name}
                          className="w-16 h-16 object-cover rounded border border-gray-200 cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => openImageGallery(product)}
                          onError={(e) => {
                            e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="64" height="64"%3E%3Crect width="64" height="64" fill="%23e5e7eb"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" font-size="24"%3E📦%3C/text%3E%3C/svg%3E';
                          }}
                        />
                        {product.images.length > 1 && (
                          <div 
                            className="w-8 h-16 bg-black bg-opacity-50 text-white text-xs flex items-center justify-center rounded-r cursor-pointer hover:bg-opacity-70 transition-all"
                            onClick={() => openImageGallery(product)}
                            title={`Xem thêm ${product.images.length - 1} ảnh`}
                          >
                            +{product.images.length - 1}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="w-16 h-16 rounded border border-gray-200 bg-gray-100 flex items-center justify-center">
                        <span className="text-gray-400 text-2xl">📦</span>
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">{product._id}</td>
                <td className="px-6 py-4 text-sm">{product.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">{product.category?.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">{product.brand?.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">{product.brand?.supplier?.name || product.supplier?.name || '-'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {product.costPrice ? `${product.costPrice.toLocaleString('vi-VN')} đ` : '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  {product.price.toLocaleString('vi-VN')} đ
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span>{product.stock || 0}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEdit(product)}
                      className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-colors font-medium text-sm"
                      title="Sửa sản phẩm"
                    >
                      ✏️ Sửa
                    </button>
                    <button
                      onClick={() => handleDelete(product._id)}
                      className="px-3 py-1.5 bg-red-50 text-red-600 rounded-md hover:bg-red-100 transition-colors font-medium text-sm"
                      title="Xóa sản phẩm"
                    >
                      🗑️ Xóa
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="px-8 py-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold text-gray-800">
                  {editingProduct ? '✏️ Sửa sản phẩm' : '➕ Thêm sản phẩm mới'}
                </h2>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setEditingProduct(null);
                    setSelectedImages([]);
                    setImagePreviews([]);
                    if (fileInputRef.current) {
                      fileInputRef.current.value = '';
                    }
                  }}
                  className="text-gray-500 hover:text-gray-700 transition-colors p-2 hover:bg-gray-100 rounded-full"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Form Body - Scrollable */}
            <div className="flex-1 overflow-y-auto p-8">
              <form id="product-form" onSubmit={handleSubmit} className="space-y-6">
                {/* Row 1: Tên sản phẩm - Full width */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Tên sản phẩm <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    placeholder="Nhập tên sản phẩm"
                  />
                </div>

                {/* Row 2: Mô tả - Full width */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Mô tả sản phẩm
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none"
                    rows="4"
                    placeholder="Nhập mô tả chi tiết về sản phẩm..."
                  />
                </div>

                {/* Row 3: 2 columns - Danh mục và Nhà cung cấp */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Danh mục <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white"
                    >
                      <option value="">-- Chọn danh mục --</option>
                      {categories
                        .filter(cat => !cat.parentCategoryId)
                        .map((parent) => {
                          const children = categories.filter(c => c.parentCategoryId === parent._id);
                          return (
                            <optgroup key={parent._id} label={`📁 ${parent.name}`}>
                              <option value={parent._id}>{parent.name}</option>
                              {children.map(child => (
                                <option key={child._id} value={child._id}>
                                  &nbsp;&nbsp;└─ {child.name}
                                </option>
                              ))}
                            </optgroup>
                          );
                        })}
                      {/* Hiển thị các category con không có parent (fallback) */}
                      {categories
                        .filter(cat => cat.parentCategoryId && !categories.find(c => c._id === cat.parentCategoryId))
                        .map(cat => (
                          <option key={cat._id} value={cat._id}>
                            {cat.name}
                          </option>
                        ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      Có thể chọn danh mục cha hoặc danh mục con cụ thể.
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Nhà cung cấp <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      value={formData.supplier}
                      onChange={(e) => {
                        setFormData({ ...formData, supplier: e.target.value, brand: '' });
                      }}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white"
                    >
                      <option value="">-- Chọn nhà cung cấp --</option>
                      {suppliers.map((supplier) => (
                        <option key={supplier._id} value={supplier._id}>
                          {supplier.name}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      Chọn nhà cung cấp trước để hiển thị các nhãn hàng.
                    </p>
                  </div>
                </div>

                {/* Row 3.5: Nhãn hàng (chỉ hiển thị sau khi chọn nhà cung cấp) */}
                {formData.supplier && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Nhãn hàng <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      value={formData.brand}
                      onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white"
                      disabled={!formData.supplier || brands.length === 0}
                    >
                      <option value="">
                        {brands.length === 0 ? '-- Không có nhãn hàng cho nhà cung cấp này --' : '-- Chọn nhãn hàng --'}
                      </option>
                      {brands.map((brand) => (
                        <option key={brand._id} value={brand._id}>
                          {brand.name}
                        </option>
                      ))}
                    </select>
                    {brands.length === 0 && formData.supplier && (
                      <p className="text-xs text-red-500 mt-1">
                        Nhà cung cấp này chưa có nhãn hàng nào. Vui lòng thêm nhãn hàng trước.
                      </p>
                    )}
                  </div>
                )}

                {/* Row 4: 4 columns - Giá nhập, Giá bán, Tồn kho, Min Stock */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Giá nhập (VNĐ)
                    </label>
                    <input
                      type="text"
                      readOnly
                      value={editingProduct && editingProduct.costPrice ? editingProduct.costPrice.toLocaleString('vi-VN') + ' đ' : 'Chưa có'}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                      placeholder="Chưa có"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Giá nhập từ đơn đặt hàng (chỉ xem)
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Giá bán (VNĐ) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Tồn kho
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.stock}
                      onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Tồn kho tối thiểu
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.minStock}
                      onChange={(e) => setFormData({ ...formData, minStock: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      placeholder="0"
                    />
                  </div>
                </div>

                {/* Row 5: Hình ảnh */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Hình ảnh sản phẩm <span className="text-gray-500 text-xs">(Từ 2 đến 5 ảnh)</span>
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-blue-400 transition-colors">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageChange}
                      className="hidden"
                      id="image-upload"
                    />
                    <label
                      htmlFor="image-upload"
                      className="flex flex-col items-center justify-center cursor-pointer"
                    >
                      <svg className="w-12 h-12 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="text-sm text-gray-600 font-medium">
                        Click để chọn ảnh hoặc kéo thả vào đây
                      </span>
                      <span className="text-xs text-gray-500 mt-1">
                        PNG, JPG, GIF up to 5MB • Đã chọn: {imagePreviews.length}/5
                      </span>
                    </label>
                  </div>

                  {/* Image Previews */}
                  {imagePreviews.length > 0 && (
                    <div className="mt-4">
                      <p className="text-sm text-gray-600 mb-3">
                        {imagePreviews.length} ảnh đã chọn {imagePreviews.length < 2 && <span className="text-red-500">(Cần ít nhất 2 ảnh)</span>}
                      </p>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        {imagePreviews.map((preview, index) => (
                          <div key={index} className="relative group">
                            <img
                              src={preview}
                              alt={`Preview ${index + 1}`}
                              className="w-full h-32 object-cover rounded-lg border-2 border-gray-200 cursor-pointer hover:border-blue-400 transition-all"
                              onClick={() => {
                                setGalleryImages(imagePreviews);
                                setCurrentImageIndex(index);
                                setShowImageGallery(true);
                              }}
                            />
                            <div className="absolute top-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                              {index + 1}
                            </div>
                            <button
                              type="button"
                              onClick={() => removeImage(index)}
                              className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 shadow-lg"
                              title="Xóa ảnh"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Form Actions - Inside form but styled as footer */}
                <div className="pt-6 border-t border-gray-200 flex justify-end gap-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setEditingProduct(null);
                      setSelectedImages([]);
                      setImagePreviews([]);
                      if (fileInputRef.current) {
                        fileInputRef.current.value = '';
                      }
                    }}
                    className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={uploading}
                    className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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
                        {editingProduct ? '💾 Cập nhật sản phẩm' : '✨ Tạo sản phẩm'}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Image Gallery Modal */}
      {showImageGallery && galleryImages.length > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50" onClick={() => setShowImageGallery(false)}>
          <div className="relative max-w-6xl max-h-[90vh] w-full mx-4" onClick={(e) => e.stopPropagation()}>
            {/* Close Button */}
            <button
              onClick={() => setShowImageGallery(false)}
              className="absolute top-4 right-4 z-10 bg-white bg-opacity-20 hover:bg-opacity-30 text-white rounded-full p-2 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Main Image */}
            <div className="relative bg-white rounded-lg overflow-hidden">
              <img
                src={galleryImages[currentImageIndex]}
                alt={`Image ${currentImageIndex + 1}`}
                className="w-full h-auto max-h-[80vh] object-contain mx-auto"
                onError={(e) => {
                  e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="800" height="600"%3E%3Crect width="800" height="600" fill="%23e5e7eb"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" font-size="48"%3E📦%3C/text%3E%3C/svg%3E';
                }}
              />

              {/* Navigation Arrows */}
              {galleryImages.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-80 hover:bg-opacity-100 text-gray-800 rounded-full p-3 shadow-lg transition-all"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-80 hover:bg-opacity-100 text-gray-800 rounded-full p-3 shadow-lg transition-all"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </>
              )}

              {/* Image Counter */}
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-60 text-white px-4 py-2 rounded-full text-sm">
                {currentImageIndex + 1} / {galleryImages.length}
              </div>
            </div>

            {/* Thumbnail Strip */}
            {galleryImages.length > 1 && (
              <div className="mt-4 flex justify-center gap-2 overflow-x-auto pb-2">
                {galleryImages.map((img, index) => (
                  <img
                    key={index}
                    src={img}
                    alt={`Thumbnail ${index + 1}`}
                    className={`w-20 h-20 object-cover rounded-lg border-2 cursor-pointer transition-all ${
                      index === currentImageIndex
                        ? 'border-blue-500 ring-2 ring-blue-300'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                    onClick={() => setCurrentImageIndex(index)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProducts;
