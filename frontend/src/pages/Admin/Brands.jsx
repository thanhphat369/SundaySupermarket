import { useState, useEffect } from 'react';
import api from '../../services/api';
import { toast } from 'react-toastify';

const AdminBrands = () => {
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingBrand, setEditingBrand] = useState(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
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
      const brandData = { 
        name, 
        description: description || null,
        supplierId: supplierId || null 
      };
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
      setDescription('');
      setSupplierId('');
      fetchBrands();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  const handleEdit = (brand) => {
    setEditingBrand(brand);
    setName(brand.name);
    setDescription(brand.description || '');
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

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File quá lớn. Vui lòng chọn file nhỏ hơn 5MB');
      e.target.value = '';
      return;
    }

    const fileName = file.name.toLowerCase();
    const fileExtension = fileName.split('.').pop();

    try {
      let fileContent = '';

      // Handle text files (.txt, .md)
      if (fileExtension === 'txt' || fileExtension === 'md') {
        fileContent = await readTextFile(file);
        setDescription(fileContent);
        toast.success('Đã tải nội dung từ file thành công');
      }
      else {
        toast.error('Định dạng file không được hỗ trợ. Vui lòng chọn file .txt hoặc .md');
        e.target.value = '';
        return;
      }

      // Reset file input
      e.target.value = '';
    } catch (error) {
      console.error('Error reading file:', error);
      toast.error('Lỗi khi đọc file: ' + error.message);
      e.target.value = '';
    }
  };

  const downloadTemplate = () => {
    const templateContent = `MÔ TẢ NHÃN HÀNG

Nhập mô tả chi tiết về nhãn hàng tại đây.

Ví dụ:
- Lịch sử hình thành
- Sứ mệnh và tầm nhìn
- Các sản phẩm nổi bật
- Điểm mạnh của nhãn hàng
- Thông tin liên hệ hoặc website

Bạn có thể chỉnh sửa nội dung này và lưu lại, sau đó tải lên để tự động điền vào mô tả nhãn hàng.`;

    const blob = new Blob([templateContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'mau-mo-ta-nhan-hang.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Đã tải file mẫu thành công');
  };

  const readTextFile = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        resolve(e.target.result);
      };
      reader.onerror = (e) => {
        reject(new Error('Không thể đọc file'));
      };
      // Try UTF-8 first, fallback to other encodings if needed
      reader.readAsText(file, 'UTF-8');
    });
  };

  // const readDocxFile = async (file) => {
  //   try {
  //     // Dynamic import to avoid build errors if package is not installed
  //     const JSZip = (await import('jszip')).default;
  //     const arrayBuffer = await file.arrayBuffer();
  //     const zip = await JSZip.loadAsync(arrayBuffer);
      
  //     // Get the main document XML
  //     const documentXml = await zip.file('word/document.xml').async('string');
      
  //     // Extract text from XML - Word documents use w:t tags for text
  //     let text = documentXml
  //       .replace(/<w:t[^>]*>([^<]*)<\/w:t>/g, '$1 ') // Extract text from w:t tags
  //       .replace(/<[^>]+>/g, ' ') // Remove remaining XML tags
  //       .replace(/&lt;/g, '<')
  //       .replace(/&gt;/g, '>')
  //       .replace(/&amp;/g, '&')
  //       .replace(/&quot;/g, '"')
  //       .replace(/&apos;/g, "'")
  //       .replace(/&#x([0-9A-Fa-f]+);/g, (match, hex) => String.fromCharCode(parseInt(hex, 16))) // Decode hex entities
  //       .replace(/&#(\d+);/g, (match, dec) => String.fromCharCode(parseInt(dec, 10))) // Decode decimal entities
  //       .replace(/\s+/g, ' ') // Replace multiple spaces with single space
  //       .trim();
      
  //     if (!text || text.length === 0) {
  //       throw new Error('Không tìm thấy nội dung trong file Word');
  //     }
      
  //     return text;
  //   } catch (error) {
  //     if (error.message.includes('Không tìm thấy')) {
  //       throw error;
  //     }
  //     if (error.message.includes('Failed to resolve') || error.message.includes('Cannot find module')) {
  //       throw new Error('Thư viện jszip chưa được cài đặt. Vui lòng chạy: npm install jszip');
  //     }
  //     throw new Error('Không thể đọc file Word. Vui lòng thử file .txt hoặc .md');
  //   }
  // };

  if (loading) return <div className="p-6">Đang tải...</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Quản lý nhãn hàng</h1>
        <button
          onClick={() => {
            setEditingBrand(null);
            setName('');
            setDescription('');
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
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mô tả</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nhà cung cấp</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Thao tác</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {brands.map((brand) => (
              <tr key={brand._id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm">{brand._id}</td>
                <td className="px-6 py-4 text-sm font-medium">{brand.name}</td>
                <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate" title={brand.description || ''}>
                  {brand.description || '-'}
                </td>
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
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="px-8 py-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold text-gray-800">
                  {editingBrand ? '✏️ Sửa nhãn hàng' : '➕ Thêm nhãn hàng mới'}
                </h2>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setEditingBrand(null);
                    setName('');
                    setDescription('');
                    setSupplierId('');
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
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Tên nhãn hàng <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  placeholder="Nhập tên nhãn hàng"
                />
              </div>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-semibold text-gray-700">Mô tả (tùy chọn)</label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={downloadTemplate}
                      className="text-sm text-green-600 hover:text-green-800 cursor-pointer flex items-center gap-1 px-3 py-1.5 border border-green-600 rounded hover:bg-green-50 transition-colors font-medium"
                      title="Tải file mẫu về để điền thông tin"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Tải mẫu
                    </button>
                    <label className="text-sm text-blue-600 hover:text-blue-800 cursor-pointer flex items-center gap-1 px-3 py-1.5 border border-blue-600 rounded hover:bg-blue-50 transition-colors font-medium">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      Tải từ file
                      <input
                        type="file"
                        accept=".txt,.md"
                        onChange={handleFileUpload}
                        className="hidden"
                        id="description-file-input"
                      />
                    </label>
                  </div>
                </div>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none"
                  placeholder="Nhập mô tả về nhãn hàng hoặc tải từ file..."
                  rows="6"
                />
                {description && (
                  <p className="text-xs text-gray-500 mt-1">
                    {description.length} ký tự
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nhà cung cấp (tùy chọn)
                </label>
                <select
                  value={supplierId}
                  onChange={(e) => setSupplierId(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white"
                >
                  <option value="">-- Chọn nhà cung cấp --</option>
                  {suppliers.map((supplier) => (
                    <option key={supplier._id} value={supplier._id}>
                      {supplier.name}
                    </option>
                  ))}
                </select>
              </div>
              {/* Form Actions - Inside form but styled as footer */}
              <div className="pt-6 border-t border-gray-200 flex justify-end gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingBrand(null);
                    setName('');
                    setDescription('');
                    setSupplierId('');
                  }}
                  className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-md hover:shadow-lg flex items-center gap-2"
                >
                  {editingBrand ? '💾 Cập nhật nhãn hàng' : '✨ Tạo nhãn hàng'}
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

export default AdminBrands;
