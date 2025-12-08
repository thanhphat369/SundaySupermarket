import { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { toast } from 'react-toastify';

const ProfilePage = () => {
  const { user, updateUser } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: {
      street: '',
      ward: '',
      district: '',
      city: '',
    },
  });
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);

  useEffect(() => {
    if (user) {
      setFormData({
        fullName: user.fullName || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || {
          street: '',
          ward: '',
          district: '',
          city: '',
        },
      });
      if (user.avatar) {
        // Avatar path from backend is like /uploads/avatars/filename.jpg
        // Use proxy path since vite proxy handles /api -> localhost:5000
        const avatarUrl = user.avatar.startsWith('http') 
          ? user.avatar 
          : user.avatar.startsWith('/uploads') 
            ? `http://localhost:5000${user.avatar}`
            : user.avatar;
        setAvatarPreview(avatarUrl);
      }
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('address.')) {
      const addressField = name.split('.')[1];
      setFormData({
        ...formData,
        address: {
          ...formData.address,
          [addressField]: value,
        },
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Kích thước file không được vượt quá 5MB');
        return;
      }
      if (!file.type.startsWith('image/')) {
        toast.error('Chỉ chấp nhận file ảnh');
        return;
      }
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('fullName', formData.fullName);
      formDataToSend.append('phone', formData.phone);
      formDataToSend.append('address', JSON.stringify(formData.address));
      
      if (avatarFile) {
        formDataToSend.append('avatar', avatarFile);
      }

      const response = await api.put('/auth/profile', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        const updatedUser = response.data.data.user;
        // Update user in store
        updateUser(updatedUser);
        toast.success('Cập nhật thông tin thành công');
        
        // Update avatar preview
        if (updatedUser.avatar) {
          const avatarUrl = updatedUser.avatar.startsWith('http')
            ? updatedUser.avatar
            : updatedUser.avatar.startsWith('/uploads')
              ? `http://localhost:5000${updatedUser.avatar}`
              : updatedUser.avatar;
          setAvatarPreview(avatarUrl);
        } else {
          setAvatarPreview(null);
        }
        setAvatarFile(null);
        
        // Refresh user data from store
        const authStorage = localStorage.getItem('auth-storage');
        if (authStorage) {
          const parsed = JSON.parse(authStorage);
          if (parsed.state?.user) {
            parsed.state.user = { ...parsed.state.user, ...updatedUser };
            localStorage.setItem('auth-storage', JSON.stringify(parsed));
          }
        }
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi cập nhật');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Thông tin cá nhân</h1>

      <div className="bg-white rounded-lg shadow-md p-6">
        <form onSubmit={handleSubmit}>
          {/* Avatar Section */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Ảnh đại diện</label>
            <div className="flex items-center space-x-4">
              <div className="relative">
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="Avatar"
                    className="w-24 h-24 rounded-full object-cover border-2 border-gray-300"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center border-2 border-gray-300">
                    <span className="text-4xl text-gray-400">👤</span>
                  </div>
                )}
              </div>
              <div>
                <label className="cursor-pointer inline-block px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                  Chọn ảnh
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                </label>
                <p className="text-xs text-gray-500 mt-1">JPG, PNG hoặc GIF (tối đa 5MB)</p>
              </div>
            </div>
          </div>

          {/* Full Name */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Họ và tên</label>
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Email (readonly) */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              disabled
              className="w-full px-3 py-2 border rounded bg-gray-100 cursor-not-allowed"
            />
            <p className="text-xs text-gray-500 mt-1">Email không thể thay đổi</p>
          </div>

          {/* Phone */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Address */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Địa chỉ</label>
            <div className="space-y-2">
              <input
                type="text"
                name="address.street"
                value={formData.address.street || ''}
                onChange={handleInputChange}
                placeholder="Số nhà, tên đường"
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  name="address.ward"
                  value={formData.address.ward || ''}
                  onChange={handleInputChange}
                  placeholder="Phường/Xã"
                  className="px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="text"
                  name="address.district"
                  value={formData.address.district || ''}
                  onChange={handleInputChange}
                  placeholder="Quận/Huyện"
                  className="px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <input
                type="text"
                name="address.city"
                value={formData.address.city || ''}
                onChange={handleInputChange}
                placeholder="Thành phố/Tỉnh"
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => {
                if (user) {
                  setFormData({
                    fullName: user.fullName || '',
                    email: user.email || '',
                    phone: user.phone || '',
                    address: user.address || {
                      street: '',
                      ward: '',
                      district: '',
                      city: '',
                    },
                  });
                  if (user.avatar) {
                    const avatarUrl = user.avatar.startsWith('http')
                      ? user.avatar
                      : user.avatar.startsWith('/uploads')
                        ? `http://localhost:5000${user.avatar}`
                        : user.avatar;
                    setAvatarPreview(avatarUrl);
                  } else {
                    setAvatarPreview(null);
                  }
                  setAvatarFile(null);
                }
              }}
              className="px-6 py-2 border border-gray-300 rounded hover:bg-gray-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfilePage;
