-- Insert sample customers
INSERT INTO public.customers (code, full_name, phone, email, address, customer_type, total_spent, notes) VALUES
('KH001', 'Nguyễn Văn An', '0901234567', 'nva@gmail.com', '123 Lê Lợi, Quận 1, TP.HCM', 'vip', 85000000, 'Khách hàng VIP, thường xuyên mua hàng số lượng lớn'),
('KH002', 'Trần Thị Bình', '0912345678', 'ttbinh@gmail.com', '456 Nguyễn Huệ, Quận 1, TP.HCM', 'loyal', 45000000, 'Khách hàng trung thành, ưu tiên gỗ tự nhiên'),
('KH003', 'Lê Minh Châu', '0923456789', 'lmchau@gmail.com', '789 Hai Bà Trưng, Quận 3, TP.HCM', 'new', 12000000, 'Khách hàng mới, quan tâm nội thất phòng khách'),
('KH004', 'Phạm Đức Dũng', '0934567890', 'pddung@gmail.com', '321 Võ Văn Tần, Quận 3, TP.HCM', 'loyal', 38000000, 'Thích phong cách hiện đại'),
('KH005', 'Hoàng Thị Ê', '0945678901', 'hte@gmail.com', '654 Pasteur, Quận 1, TP.HCM', 'vip', 92000000, 'Chủ khách sạn, đặt hàng số lượng lớn'),
('KH006', 'Võ Văn Phong', '0956789012', 'vvphong@gmail.com', '987 Điện Biên Phủ, Quận 10, TP.HCM', 'new', 8500000, 'Khách hàng mới'),
('KH007', 'Đặng Thị Giang', '0967890123', 'dtgiang@gmail.com', '147 Cách Mạng Tháng 8, Quận 10, TP.HCM', 'loyal', 55000000, 'Ưa chuộng gỗ gụ'),
('KH008', 'Bùi Minh Hải', '0978901234', 'bmhai@gmail.com', '258 Lý Thường Kiệt, Quận 11, TP.HCM', 'new', 15000000, NULL);

-- Insert sample suppliers
INSERT INTO public.suppliers (code, company_name, director_name, phone, email, address, notes) VALUES
('NCC001', 'Công ty TNHH Gỗ Đại Phát', 'Nguyễn Thanh Sơn', '0281234567', 'daiphat@wood.vn', 'KCN Tân Bình, TP.HCM', 'Nhà cung cấp gỗ tự nhiên chất lượng cao'),
('NCC002', 'Công ty CP Gỗ Quốc Tế', 'Trần Văn Bình', '0287654321', 'quocte@gmail.com', 'KCN Bình Dương', 'Chuyên gỗ nhập khẩu'),
('NCC003', 'Xưởng Mộc Hoàng Gia', 'Lê Văn Cường', '0289876543', 'hoanggia@xuong.vn', 'Quận 12, TP.HCM', 'Gia công theo yêu cầu'),
('NCC004', 'Công ty Gỗ Thiên Nhiên', 'Phạm Thị Dung', '0282345678', 'thiennhien@wood.com', 'Đồng Nai', 'Gỗ công nghiệp MDF, MFC'),
('NCC005', 'Nhà máy Gỗ Việt Hưng', 'Hoàng Văn Em', '0283456789', 'viethung@factory.vn', 'Bình Phước', 'Sản xuất gỗ ép');

-- Insert sample products
INSERT INTO public.products (code, name, wood_type, category, purchase_price, selling_price, quantity, location, description, image_url) VALUES
('SP001', 'Bàn ăn gỗ gụ 6 ghế', 'Gỗ Gụ', 'Bàn ăn', 15000000, 22000000, 8, 'Kho A1', 'Bàn ăn gỗ gụ tự nhiên, kích thước 1.6m x 0.9m, kèm 6 ghế sang trọng', NULL),
('SP002', 'Tủ áo gỗ sồi 4 cánh', 'Gỗ Sồi', 'Tủ quần áo', 8500000, 13000000, 12, 'Kho A2', 'Tủ áo 4 cánh gỗ sồi Mỹ, kích thước 2.4m x 2.2m x 0.6m', NULL),
('SP003', 'Sofa gỗ tần bì 3+1+1', 'Gỗ Tần Bì', 'Sofa', 12000000, 18000000, 5, 'Kho B1', 'Bộ sofa gỗ tần bì bọc nỉ cao cấp, gồm 1 ghế 3 chỗ và 2 ghế đơn', NULL),
('SP004', 'Giường ngủ gỗ xoan đào 1.8m', 'Gỗ Xoan Đào', 'Giường ngủ', 6500000, 9500000, 15, 'Kho A3', 'Giường ngủ gỗ xoan đào tự nhiên 1.8m x 2m, thiết kế hiện đại', NULL),
('SP005', 'Bàn làm việc gỗ công nghiệp', 'MFC', 'Bàn làm việc', 1500000, 2500000, 25, 'Kho C1', 'Bàn làm việc MFC chống ẩm, kích thước 1.2m x 0.6m', NULL),
('SP006', 'Kệ tivi gỗ óc chó', 'Gỗ Óc Chó', 'Kệ tivi', 4500000, 7000000, 10, 'Kho B2', 'Kệ tivi gỗ óc chó tự nhiên 2.0m, có ngăn kéo', NULL),
('SP007', 'Tủ bếp gỗ Acrylic', 'MDF Acrylic', 'Tủ bếp', 25000000, 35000000, 3, 'Kho D1', 'Tủ bếp hiện đại phủ Acrylic chống trầy xước, thi công theo mét dài', NULL),
('SP008', 'Bàn trà gỗ mặt đá', 'Gỗ Gụ + Đá', 'Bàn trà', 3500000, 5500000, 18, 'Kho B1', 'Bàn trà gỗ gụ mặt đá tự nhiên, kích thước 1.2m x 0.7m', NULL),
('SP009', 'Ghế ăn gỗ sồi bọc nệm', 'Gỗ Sồi', 'Ghế', 800000, 1200000, 50, 'Kho C2', 'Ghế ăn gỗ sồi bọc nệm simili cao cấp', NULL),
('SP010', 'Tủ giày gỗ MDF', 'MDF', 'Tủ giày', 1200000, 1800000, 30, 'Kho C1', 'Tủ giày 4 tầng gỗ MDF phủ melamine', NULL),
('SP011', 'Bàn học sinh gỗ thông', 'Gỗ Thông', 'Bàn học', 2000000, 3000000, 20, 'Kho A2', 'Bàn học sinh có ngăn kéo và giá sách', NULL),
('SP012', 'Kệ sách gỗ tự nhiên 5 tầng', 'Gỗ Cao Su', 'Kệ sách', 3000000, 4500000, 12, 'Kho B2', 'Kệ sách 5 tầng gỗ cao su tự nhiên', NULL);

-- Insert sample orders
INSERT INTO public.orders (code, customer_id, total_amount, discount, final_amount, payment_method, status, notes) VALUES
('DH001', (SELECT id FROM customers WHERE code = 'KH001'), 22000000, 1000000, 21000000, 'bank_transfer', 'completed', 'Giao hàng và lắp đặt tại nhà khách'),
('DH002', (SELECT id FROM customers WHERE code = 'KH002'), 13000000, 500000, 12500000, 'cash', 'completed', 'Khách tự đến lấy hàng'),
('DH003', (SELECT id FROM customers WHERE code = 'KH003'), 12000000, 0, 12000000, 'bank_transfer', 'pending', 'Chờ xác nhận chuyển khoản'),
('DH004', (SELECT id FROM customers WHERE code = 'KH004'), 7000000, 200000, 6800000, 'credit_card', 'completed', NULL),
('DH005', (SELECT id FROM customers WHERE code = 'KH005'), 70000000, 3000000, 67000000, 'bank_transfer', 'completed', 'Đơn hàng lớn cho khách sạn'),
('DH006', (SELECT id FROM customers WHERE code = 'KH006'), 8500000, 0, 8500000, 'cash', 'pending', NULL),
('DH007', (SELECT id FROM customers WHERE code = 'KH007'), 18000000, 800000, 17200000, 'bank_transfer', 'completed', NULL),
('DH008', (SELECT id FROM customers WHERE code = 'KH008'), 15000000, 500000, 14500000, 'cash', 'completed', NULL);

-- Insert sample order items
INSERT INTO public.order_items (order_id, product_id, product_name, quantity, unit_price, total_price) VALUES
-- Order 1
((SELECT id FROM orders WHERE code = 'DH001'), (SELECT id FROM products WHERE code = 'SP001'), 'Bàn ăn gỗ gụ 6 ghế', 1, 22000000, 22000000),
-- Order 2
((SELECT id FROM orders WHERE code = 'DH002'), (SELECT id FROM products WHERE code = 'SP002'), 'Tủ áo gỗ sồi 4 cánh', 1, 13000000, 13000000),
-- Order 3
((SELECT id FROM orders WHERE code = 'DH003'), (SELECT id FROM products WHERE code = 'SP004'), 'Giường ngủ gỗ xoan đào 1.8m', 1, 9500000, 9500000),
((SELECT id FROM orders WHERE code = 'DH003'), (SELECT id FROM products WHERE code = 'SP005'), 'Bàn làm việc gỗ công nghiệp', 1, 2500000, 2500000),
-- Order 4
((SELECT id FROM orders WHERE code = 'DH004'), (SELECT id FROM products WHERE code = 'SP006'), 'Kệ tivi gỗ óc chó', 1, 7000000, 7000000),
-- Order 5
((SELECT id FROM orders WHERE code = 'DH005'), (SELECT id FROM products WHERE code = 'SP007'), 'Tủ bếp gỗ Acrylic', 2, 35000000, 70000000),
-- Order 6
((SELECT id FROM orders WHERE code = 'DH006'), (SELECT id FROM products WHERE code = 'SP008'), 'Bàn trà gỗ mặt đá', 1, 5500000, 5500000),
((SELECT id FROM orders WHERE code = 'DH006'), (SELECT id FROM products WHERE code = 'SP010'), 'Tủ giày gỗ MDF', 1, 1800000, 1800000),
((SELECT id FROM orders WHERE code = 'DH006'), (SELECT id FROM products WHERE code = 'SP009'), 'Ghế ăn gỗ sồi bọc nệm', 1, 1200000, 1200000),
-- Order 7
((SELECT id FROM orders WHERE code = 'DH007'), (SELECT id FROM products WHERE code = 'SP003'), 'Sofa gỗ tần bì 3+1+1', 1, 18000000, 18000000),
-- Order 8
((SELECT id FROM orders WHERE code = 'DH008'), (SELECT id FROM products WHERE code = 'SP011'), 'Bàn học sinh gỗ thông', 3, 3000000, 9000000),
((SELECT id FROM orders WHERE code = 'DH008'), (SELECT id FROM products WHERE code = 'SP012'), 'Kệ sách gỗ tự nhiên 5 tầng', 1, 4500000, 4500000),
((SELECT id FROM orders WHERE code = 'DH008'), (SELECT id FROM products WHERE code = 'SP010'), 'Tủ giày gỗ MDF', 1, 1800000, 1800000);

-- Insert sample inventory transactions (goods receipt)
INSERT INTO public.inventory_transactions (code, type, product_id, supplier_id, quantity, unit_price, notes) VALUES
('NK001', 'goods_receipt', (SELECT id FROM products WHERE code = 'SP001'), (SELECT id FROM suppliers WHERE code = 'NCC001'), 5, 15000000, 'Nhập hàng đợt 1 tháng 11'),
('NK002', 'goods_receipt', (SELECT id FROM products WHERE code = 'SP002'), (SELECT id FROM suppliers WHERE code = 'NCC002'), 8, 8500000, 'Nhập hàng đợt 1 tháng 11'),
('NK003', 'goods_receipt', (SELECT id FROM products WHERE code = 'SP003'), (SELECT id FROM suppliers WHERE code = 'NCC001'), 3, 12000000, 'Đơn hàng đặc biệt'),
('NK004', 'goods_receipt', (SELECT id FROM products WHERE code = 'SP004'), (SELECT id FROM suppliers WHERE code = 'NCC003'), 10, 6500000, 'Nhập hàng đợt 1 tháng 11'),
('NK005', 'goods_receipt', (SELECT id FROM products WHERE code = 'SP005'), (SELECT id FROM suppliers WHERE code = 'NCC004'), 30, 1500000, 'Nhập số lượng lớn'),
-- Sales transactions from orders
('XK001', 'sale', (SELECT id FROM products WHERE code = 'SP001'), NULL, -1, 22000000, 'Xuất hàng đơn DH001'),
('XK002', 'sale', (SELECT id FROM products WHERE code = 'SP002'), NULL, -1, 13000000, 'Xuất hàng đơn DH002'),
('XK003', 'sale', (SELECT id FROM products WHERE code = 'SP004'), NULL, -1, 9500000, 'Xuất hàng đơn DH003'),
('XK004', 'sale', (SELECT id FROM products WHERE code = 'SP006'), NULL, -1, 7000000, 'Xuất hàng đơn DH004'),
('XK005', 'sale', (SELECT id FROM products WHERE code = 'SP007'), NULL, -2, 35000000, 'Xuất hàng đơn DH005');

-- Update customer total_spent to match their order amounts
UPDATE public.customers SET total_spent = (
  SELECT COALESCE(SUM(final_amount), 0) 
  FROM orders 
  WHERE orders.customer_id = customers.id AND orders.status = 'completed'
);

-- Update customer types based on total_spent
UPDATE public.customers SET customer_type = 'vip' WHERE total_spent >= 50000000;
UPDATE public.customers SET customer_type = 'loyal' WHERE total_spent >= 20000000 AND total_spent < 50000000;
UPDATE public.customers SET customer_type = 'new' WHERE total_spent < 20000000;