import { useParams } from 'react-router-dom';
import { useQuery } from 'react-query';
import api from '../../services/api';
import { useAuthStore } from '../../store/authStore';

const ProductDetailPage = () => {
  const { id } = useParams();
  const { isAuthenticated, user } = useAuthStore();

  const { data } = useQuery(['product', id], async () => {
    const res = await api.get(`/products/${id}`);
    return res.data.data.product;
  });

  const handleAddToCart = async () => {
    if (!isAuthenticated || user?.role !== 'customer') {
      alert('Vui lòng đăng nhập để thêm vào giỏ hàng');
      return;
    }
    // Add to cart logic
  };

  if (!data) return <div>Đang tải...</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <img
            src={data.images?.[0] || '/placeholder.jpg'}
            alt={data.name}
            className="w-full rounded-lg"
          />
        </div>
        <div>
          <h1 className="text-3xl font-bold mb-4">{data.name}</h1>
          {data.brand && (
            <div className="mb-3">
              <span className="text-sm text-gray-500">Nhãn hàng: </span>
              <span className="text-sm font-semibold text-gray-700">{data.brand.name}</span>
            </div>
          )}
          <p className="text-2xl text-primary-600 font-bold mb-4">
            {new Intl.NumberFormat('vi-VN').format(data.price)} đ
          </p>
          <div className="mb-4">
            <h2 className="text-lg font-semibold mb-2">Mô tả sản phẩm</h2>
            <p className="text-gray-600 whitespace-pre-line">{data.description || 'Chưa có mô tả'}</p>
          </div>
          {data.brand?.description && (
            <div className="mb-4 p-4 bg-gray-50 rounded-lg border-l-4 border-blue-500">
              <h2 className="text-lg font-semibold mb-2 text-gray-800">Về nhãn hàng {data.brand.name}</h2>
              <p className="text-gray-700 whitespace-pre-line text-sm leading-relaxed">
                {data.brand.description}
              </p>
            </div>
          )}
          <div className="mb-4">
            <span className="font-semibold">Tồn kho: </span>
            <span>{data.stock}</span>
          </div>
          <button
            onClick={handleAddToCart}
            className="w-full px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            Thêm vào giỏ hàng
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailPage;

