import { Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import api from '../../services/api';

const HomePage = () => {
  const { data: productsData } = useQuery('featured-products', async () => {
    const res = await api.get('/products?featured=true&limit=8');
    return res.data.data;
  });

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary-600 to-primary-800 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold mb-4">Sunday Supermarket</h1>
          <p className="text-xl mb-8">Siêu thị trực tuyến - Mua sắm tiện lợi mọi lúc mọi nơi</p>
          <Link
            to="/products"
            className="inline-block px-8 py-3 bg-white text-primary-600 rounded-lg font-semibold hover:bg-gray-100"
          >
            Khám phá ngay
          </Link>
        </div>
      </section>

      {/* Featured Products */}
      <section className="container mx-auto px-4 py-12">
        <h2 className="text-3xl font-bold mb-8">Sản phẩm nổi bật</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {productsData?.products?.map((product) => (
            <Link
              key={product._id}
              to={`/products/${product._id}`}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition"
            >
              <img
                src={product.images?.[0] || '/placeholder.jpg'}
                alt={product.name}
                className="w-full h-48 object-cover"
              />
              <div className="p-4">
                <h3 className="font-semibold mb-2">{product.name}</h3>
                <p className="text-primary-600 font-bold">
                  {new Intl.NumberFormat('vi-VN').format(product.price)} đ
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
};

export default HomePage;

