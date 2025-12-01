import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import api from '../../services/api';

const ProductsPage = () => {
  const [filters, setFilters] = useState({
    category: '',
    brand: '',
    search: '',
    page: 1,
  });

  const { data, isLoading } = useQuery(
    ['products', filters],
    async () => {
      const params = new URLSearchParams();
      if (filters.category) params.append('category', filters.category);
      if (filters.brand) params.append('brand', filters.brand);
      if (filters.search) params.append('search', filters.search);
      params.append('page', filters.page);
      const res = await api.get(`/products?${params}`);
      return res.data.data;
    }
  );

  const { data: categories } = useQuery('categories', async () => {
    const res = await api.get('/categories');
    return res.data.data.categories;
  });

  const { data: brands } = useQuery('brands', async () => {
    const res = await api.get('/brands');
    return res.data.data.brands;
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex gap-8">
        {/* Filters */}
        <aside className="w-64">
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="font-bold mb-4">Bộ lọc</h3>
            <input
              type="text"
              placeholder="Tìm kiếm..."
              className="w-full px-3 py-2 border rounded mb-4"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
            />
            {/* Add category and brand filters */}
          </div>
        </aside>

        {/* Products Grid */}
        <div className="flex-1">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {isLoading ? (
              <div>Đang tải...</div>
            ) : (
              data?.products?.map((product) => (
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
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductsPage;

