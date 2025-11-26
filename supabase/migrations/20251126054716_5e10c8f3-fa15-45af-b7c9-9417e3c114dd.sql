-- Insert sample employees
INSERT INTO public.employees (code, full_name, position, base_salary, birth_year, email, phone, id_number, current_address, hometown, start_date) VALUES
('NV002', 'Trần Thị Lan Anh', 'Nhân viên bán hàng', 8000000, 1995, 'lananh@hoanggia.vn', '0912345678', '001095012345', '123 Đường Lê Lợi, Q1, TP.HCM', 'Đà Nẵng', '2022-03-15'),
('NV003', 'Lê Văn Minh', 'Thợ mộc', 10000000, 1988, 'minh@hoanggia.vn', '0923456789', '001088023456', '456 Đường Nguyễn Huệ, Q1, TP.HCM', 'Bình Dương', '2020-06-01'),
('NV004', 'Phạm Thị Hương', 'Kế toán', 12000000, 1990, 'huong@hoanggia.vn', '0934567890', '001090034567', '789 Đường Trần Hưng Đạo, Q5, TP.HCM', 'TP.HCM', '2021-01-10'),
('NV005', 'Hoàng Văn Tùng', 'Thợ mộc', 9500000, 1992, 'tung@hoanggia.vn', '0945678901', '001092045678', '321 Đường Hai Bà Trưng, Q3, TP.HCM', 'Long An', '2021-08-20'),
('NV006', 'Ngô Thị Mai', 'Nhân viên bán hàng', 7500000, 1998, 'mai@hoanggia.vn', '0956789012', '001098056789', '654 Đường Cách Mạng Tháng 8, Q10, TP.HCM', 'Tiền Giang', '2023-02-01'),
('NV007', 'Đặng Văn Hải', 'Thủ kho', 8500000, 1991, 'hai@hoanggia.vn', '0967890123', '001091067890', '987 Đường Võ Văn Tần, Q3, TP.HCM', 'Vũng Tàu', '2021-11-15')
ON CONFLICT (code) DO NOTHING;

-- Insert attendance records for the past 30 days (excluding weekends and with some absences)
WITH date_series AS (
  SELECT d::date as attendance_date
  FROM generate_series(
    current_date - interval '29 days',
    current_date - interval '1 day',
    interval '1 day'
  ) d
  WHERE EXTRACT(DOW FROM d) NOT IN (0, 6)
)
INSERT INTO public.attendance (employee_id, date, time_in, time_out, total_hours, notes)
SELECT 
  e.id,
  ds.attendance_date,
  '08:00:00'::time,
  '17:30:00'::time,
  9.5,
  CASE 
    WHEN random() < 0.1 THEN 'Đi muộn 15 phút'
    WHEN random() < 0.05 THEN 'Về sớm'
    ELSE NULL
  END
FROM public.employees e
CROSS JOIN date_series ds
WHERE random() > 0.05
ON CONFLICT (employee_id, date) DO NOTHING;

-- Insert some half-day records (random dates from past 20 days)
INSERT INTO public.attendance (employee_id, date, time_in, time_out, total_hours, notes)
SELECT 
  e.id,
  (current_date - (1 + floor(random() * 20))::int)::date,
  '08:00:00'::time,
  '12:00:00'::time,
  4,
  'Nghỉ nửa ngày'
FROM public.employees e
WHERE random() < 0.15
LIMIT 5
ON CONFLICT (employee_id, date) DO NOTHING;

-- Insert some overtime records (random dates from past 15 days)
INSERT INTO public.attendance (employee_id, date, time_in, time_out, total_hours, notes)
SELECT 
  e.id,
  (current_date - (1 + floor(random() * 15))::int)::date,
  '08:00:00'::time,
  '20:00:00'::time,
  12,
  'Tăng ca'
FROM public.employees e
WHERE random() < 0.2
LIMIT 8
ON CONFLICT (employee_id, date) DO NOTHING;