import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import { toast } from 'react-toastify';

const AdminStockTransactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState(null); // 'import', 'export'
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [transactionData, setTransactionData] = useState({
    quantity: '',
    reason: '',
    supplierId: '',
  });
  const [searchParams] = useSearchParams();
  const [filters, setFilters] = useState({
    product: searchParams.get('product') || '',
    type: '',
  });
  const fetchingRef = useRef(false);
  const initializedRef = useRef(false);

  useEffect(() => {
    const initialize = async () => {
      if (initializedRef.current) return;
      initializedRef.current = true;
      await fetchProducts();
      await fetchSuppliers();
      fetchTransactions();
    };
    initialize();
  }, []);

  useEffect(() => {
    if (initializedRef.current && !fetchingRef.current) {
      fetchTransactions();
    }
  }, [filters.product, filters.type]);

  const fetchTransactions = async () => {
    if (fetchingRef.current) return; // Prevent concurrent calls
    
    try {
      fetchingRef.current = true;
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.product) params.append('product', filters.product);
      if (filters.type) params.append('type', filters.type);
      
      const response = await api.get(`/inventory?${params}`);
      const transactionsData = response.data.data?.transactions || [];
      
      // Remove duplicates by Transaction_ID
      const uniqueTransactions = transactionsData.filter((transaction, index, self) =>
        index === self.findIndex(t => t.Transaction_ID === transaction.Transaction_ID)
      );
      
      setTransactions(uniqueTransactions);
    } catch (error) {
      toast.error('Lỗi khi tải lịch sử giao dịch');
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await api.get('/products?limit=100');
      setProducts(response.data.data.products);
    } catch (error) {
      console.log('Error fetching products');
    }
  };

  const fetchSuppliers = async () => {
    try {
      const response = await api.get('/suppliers');
      setSuppliers(response.data.data?.suppliers || []);
    } catch (error) {
      console.log('Suppliers API not available');
    }
  };

  const openModal = (type, product = null, transaction = null) => {
    setModalType(type);
    setSelectedProduct(product);
    setEditingTransaction(transaction);
    if (transaction) {
      // Edit mode - populate form with transaction data
      const productData = products.find(p => p._id === transaction.Product_ID);
      setSelectedProduct(productData);
      setTransactionData({ 
        quantity: transaction.Quantity.toString(), 
        reason: transaction.Note || '', 
        supplierId: transaction.Supplier_ID ? transaction.Supplier_ID.toString() : ''
      });
    } else {
      // Create mode
      setTransactionData({ quantity: '', reason: '', supplierId: '' });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setModalType(null);
    setSelectedProduct(null);
    setEditingTransaction(null);
    setTransactionData({ quantity: '', reason: '', supplierId: '' });
  };

  const handleTransaction = async (e) => {
    e.preventDefault();
    
    if (!transactionData.quantity || parseInt(transactionData.quantity) <= 0) {
      toast.error('Vui lòng nhập số lượng hợp lệ');
      return;
    }

    if (!selectedProduct) {
      toast.error('Vui lòng chọn sản phẩm');
      return;
    }

    try {
      if (editingTransaction) {
        // Update existing transaction
        await api.put(`/inventory/${editingTransaction.Transaction_ID}`, {
          product: selectedProduct._id,
          type: modalType,
          quantity: parseInt(transactionData.quantity),
          reason: transactionData.reason || null,
          supplierId: transactionData.supplierId || null,
        });
        toast.success(`Cập nhật giao dịch ${modalType === 'import' ? 'nhập' : 'xuất'} hàng thành công`);
      } else {
        // Create new transaction
        await api.post('/inventory', {
          product: selectedProduct._id,
          type: modalType,
          quantity: parseInt(transactionData.quantity),
          reason: transactionData.reason || null,
          supplierId: transactionData.supplierId || null,
        });
        toast.success(`${modalType === 'import' ? 'Nhập' : 'Xuất'} hàng thành công`);
      }
      closeModal();
      // Small delay to ensure backend has processed
      setTimeout(() => {
        fetchTransactions();
      }, 300);
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Có lỗi xảy ra';
      toast.error(errorMessage);
    }
  };

  const getModalTitle = () => {
    if (editingTransaction) {
      return `Sửa giao dịch ${modalType === 'import' ? 'nhập' : 'xuất'} hàng`;
    }
    switch (modalType) {
      case 'import': return 'Nhập hàng vào kho';
      case 'export': return 'Xuất hàng khỏi kho';
      default: return '';
    }
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case 'import': return 'Nhập';
      case 'export': return 'Xuất';
      default: return type;
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'import': return 'bg-green-100 text-green-800';
      case 'export': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) return <div className="p-6">Đang tải...</div>;

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Lịch sử giao dịch kho</h1>
        <p className="text-gray-600">Xem chi tiết các giao dịch nhập/xuất hàng trong kho</p>
      </div>

      {/* Filters and Actions */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Lọc theo sản phẩm</label>
            <select
              value={filters.product}
              onChange={(e) => setFilters({ ...filters, product: e.target.value })}
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tất cả sản phẩm</option>
              {products.map((product) => (
                <option key={product._id} value={product._id}>
                  {product.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Lọc theo loại</label>
            <select
              value={filters.type}
              onChange={(e) => setFilters({ ...filters, type: e.target.value })}
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tất cả loại</option>
              <option value="import">Nhập hàng</option>
              <option value="export">Xuất hàng</option>
            </select>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => openModal('import')}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            ➕ Nhập hàng
          </button>
          <button
            onClick={() => openModal('export')}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            ➖ Xuất hàng
          </button>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ngày giờ</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sản phẩm</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Loại</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Số lượng</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nhà cung cấp</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ghi chú</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Thao tác</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {transactions.length === 0 ? (
              <tr>
                <td colSpan="8" className="px-6 py-4 text-center text-gray-500">
                  Chưa có giao dịch nào
                </td>
              </tr>
            ) : (
              transactions.map((transaction, index) => (
                <tr key={`${transaction.Transaction_ID}-${transaction.CreatedAt}-${index}`} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{transaction.Transaction_ID}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {new Date(transaction.CreatedAt).toLocaleString('vi-VN')}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div className="flex items-center gap-2">
                      {transaction.Product_Image && (
                        <img 
                          src={transaction.Product_Image.split(',')[0]} 
                          alt={transaction.Product_Name}
                          className="w-8 h-8 object-cover rounded"
                        />
                      )}
                      <span>{transaction.Product_Name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 py-1 rounded text-xs ${getTypeColor(transaction.Type)}`}>
                      {getTypeLabel(transaction.Type)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {transaction.Quantity}
                  </td>
                  <td className="px-6 py-4 text-sm">{transaction.Supplier_Name || '-'}</td>
                  <td className="px-6 py-4 text-sm">{transaction.Note || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          const productData = products.find(p => p._id === transaction.Product_ID);
                          openModal(transaction.Type, productData, transaction);
                        }}
                        className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-xs"
                      >
                        ✏️ Sửa
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Transaction Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">{getModalTitle()}</h2>
                <button
                  onClick={closeModal}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleTransaction}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sản phẩm <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    disabled={!!editingTransaction}
                    value={selectedProduct?._id || ''}
                    onChange={(e) => {
                      const product = products.find(p => p._id === parseInt(e.target.value));
                      setSelectedProduct(product);
                    }}
                    className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    <option value="">-- Chọn sản phẩm --</option>
                    {products.map((product) => (
                      <option key={product._id} value={product._id}>
                        {product.name} (Tồn kho: {product.stock || 0})
                      </option>
                    ))}
                  </select>
                </div>

                {selectedProduct && (
                  <div className="mb-4 p-3 bg-gray-50 rounded">
                    <p><strong>Tồn kho hiện tại:</strong> {selectedProduct.stock || 0}</p>
                  </div>
                )}

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Số lượng <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={transactionData.quantity}
                    onChange={(e) => setTransactionData({ ...transactionData, quantity: e.target.value })}
                    className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Nhập số lượng"
                  />
                  {modalType === 'import' && selectedProduct && (
                    <p className="text-sm text-gray-500 mt-1">
                      Tồn kho sau nhập: {(selectedProduct.stock || 0) + parseInt(transactionData.quantity || 0)}
                    </p>
                  )}
                  {modalType === 'export' && selectedProduct && (
                    <p className="text-sm text-gray-500 mt-1">
                      Tồn kho sau xuất: {Math.max(0, (selectedProduct.stock || 0) - parseInt(transactionData.quantity || 0))}
                    </p>
                  )}
                </div>

                {suppliers.length > 0 && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nhà cung cấp (tùy chọn)
                    </label>
                    <select
                      value={transactionData.supplierId}
                      onChange={(e) => setTransactionData({ ...transactionData, supplierId: e.target.value })}
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
                )}

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ghi chú (tùy chọn)
                  </label>
                  <textarea
                    value={transactionData.reason}
                    onChange={(e) => setTransactionData({ ...transactionData, reason: e.target.value })}
                    className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows="3"
                    placeholder="Nhập ghi chú cho giao dịch này..."
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className={`px-4 py-2 text-white rounded hover:opacity-90 ${
                      modalType === 'import' ? 'bg-green-500 hover:bg-green-600' :
                      'bg-red-500 hover:bg-red-600'
                    }`}
                  >
                    {editingTransaction ? 'Cập nhật' : (modalType === 'import' ? 'Nhập hàng' : 'Xuất hàng')}
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

export default AdminStockTransactions;
