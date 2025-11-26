import * as XLSX from 'xlsx';
import { format } from 'date-fns';

interface Employee {
  code: string;
  full_name: string;
  position: string;
  phone: string | null;
  email: string | null;
  base_salary: number;
  start_date: string;
  birth_year: number | null;
  id_number: string | null;
  hometown: string | null;
  current_address: string | null;
}

interface AttendanceRecord {
  employee_code: string;
  employee_name: string;
  date: string;
  time_in: string | null;
  time_out: string | null;
  total_hours: number | null;
  notes: string | null;
}

interface PayrollRecord {
  employee_code: string;
  employee_name: string;
  position: string;
  base_salary: number;
  total_days: number;
  total_hours: number;
  calculated_salary: number;
}

export const exportEmployeesToExcel = (employees: Employee[]) => {
  // Prepare data
  const data = employees.map((emp, index) => ({
    'STT': index + 1,
    'Mã NV': emp.code,
    'Họ và tên': emp.full_name,
    'Chức vụ': emp.position,
    'Năm sinh': emp.birth_year || '',
    'CMND/CCCD': emp.id_number || '',
    'Số điện thoại': emp.phone || '',
    'Email': emp.email || '',
    'Quê quán': emp.hometown || '',
    'Địa chỉ hiện tại': emp.current_address || '',
    'Lương cơ bản (VNĐ)': emp.base_salary,
    'Ngày bắt đầu': format(new Date(emp.start_date), 'dd/MM/yyyy'),
  }));

  // Create workbook
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(data);

  // Set column widths
  ws['!cols'] = [
    { wch: 5 },  // STT
    { wch: 10 }, // Mã NV
    { wch: 25 }, // Họ và tên
    { wch: 20 }, // Chức vụ
    { wch: 10 }, // Năm sinh
    { wch: 15 }, // CMND/CCCD
    { wch: 15 }, // Số điện thoại
    { wch: 25 }, // Email
    { wch: 20 }, // Quê quán
    { wch: 30 }, // Địa chỉ hiện tại
    { wch: 18 }, // Lương cơ bản
    { wch: 15 }, // Ngày bắt đầu
  ];

  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(wb, ws, 'Danh sách nhân viên');

  // Export file
  const fileName = `Danh_sach_nhan_vien_${format(new Date(), 'dd-MM-yyyy')}.xlsx`;
  XLSX.writeFile(wb, fileName);
};

export const exportAttendanceToExcel = (
  records: AttendanceRecord[],
  startDate: string,
  endDate: string
) => {
  // Prepare data
  const data = records.map((record, index) => ({
    'STT': index + 1,
    'Mã NV': record.employee_code,
    'Họ và tên': record.employee_name,
    'Ngày': format(new Date(record.date), 'dd/MM/yyyy'),
    'Giờ vào': record.time_in || '',
    'Giờ ra': record.time_out || 'Chưa ra',
    'Tổng giờ': record.total_hours ? record.total_hours.toFixed(2) : '',
    'Trạng thái': record.time_out ? 'Hoàn thành' : 'Đang làm',
    'Ghi chú': record.notes || '',
  }));

  // Create workbook
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(data);

  // Set column widths
  ws['!cols'] = [
    { wch: 5 },  // STT
    { wch: 10 }, // Mã NV
    { wch: 25 }, // Họ và tên
    { wch: 12 }, // Ngày
    { wch: 10 }, // Giờ vào
    { wch: 10 }, // Giờ ra
    { wch: 12 }, // Tổng giờ
    { wch: 15 }, // Trạng thái
    { wch: 30 }, // Ghi chú
  ];

  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(wb, ws, 'Bảng chấm công');

  // Export file
  const fileName = `Bang_cham_cong_${format(new Date(startDate), 'dd-MM-yyyy')}_${format(new Date(endDate), 'dd-MM-yyyy')}.xlsx`;
  XLSX.writeFile(wb, fileName);
};

export const exportPayrollToExcel = (records: PayrollRecord[], month: string) => {
  // Calculate totals
  const totalBaseSalary = records.reduce((sum, r) => sum + r.base_salary, 0);
  const totalCalculatedSalary = records.reduce((sum, r) => sum + r.calculated_salary, 0);

  // Prepare data
  const data = records.map((record, index) => ({
    'STT': index + 1,
    'Mã NV': record.employee_code,
    'Họ và tên': record.employee_name,
    'Chức vụ': record.position,
    'Lương cơ bản (VNĐ)': record.base_salary,
    'Số ngày công': record.total_days,
    'Tổng giờ làm': record.total_hours.toFixed(1),
    'Lương thực nhận (VNĐ)': Math.round(record.calculated_salary),
  }));

  // Add summary row
  data.push({
    'STT': '',
    'Mã NV': '',
    'Họ và tên': '',
    'Chức vụ': 'TỔNG CỘNG',
    'Lương cơ bản (VNĐ)': totalBaseSalary,
    'Số ngày công': '',
    'Tổng giờ làm': '',
    'Lương thực nhận (VNĐ)': Math.round(totalCalculatedSalary),
  } as any);

  // Create workbook
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(data);

  // Set column widths
  ws['!cols'] = [
    { wch: 5 },  // STT
    { wch: 10 }, // Mã NV
    { wch: 25 }, // Họ và tên
    { wch: 20 }, // Chức vụ
    { wch: 20 }, // Lương cơ bản
    { wch: 15 }, // Số ngày công
    { wch: 15 }, // Tổng giờ làm
    { wch: 22 }, // Lương thực nhận
  ];

  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(wb, ws, 'Bảng lương');

  // Export file
  const fileName = `Bang_luong_thang_${month}.xlsx`;
  XLSX.writeFile(wb, fileName);
};
