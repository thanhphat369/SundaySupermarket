const Footer = () => {
  return (
    <footer className="bg-gray-800 text-white mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-xl font-bold mb-4">Sunday Supermarket</h3>
            <p className="text-gray-400">
              Siêu thị trực tuyến hàng đầu tại Cần Thơ
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Liên hệ</h4>
            <p className="text-gray-400">Địa chỉ: 01 Lý Tự Trọng, phường Ninh Kiều, TP. Cần Thơ</p>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Thông tin</h4>
            <ul className="text-gray-400 space-y-2">
              <li>Về chúng tôi</li>
              <li>Chính sách bảo mật</li>
              <li>Điều khoản sử dụng</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-700 mt-8 pt-4 text-center text-gray-400">
          <p>&copy; 2024 Sunday Supermarket. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

